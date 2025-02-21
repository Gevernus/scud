require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require("cors");
const helmet = require('helmet');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Event = require('./models/Event');
const Station = require('./models/Station')
const Session = require('./models/Session')
const Counterparty = require('./models/Counterparty')
const Registration = require('./models/Registration')
const LockUsers = require('./models/LockUsers')
const { startOfDay, endOfDay, startOfWeek, startOfMonth, toDate } = require("date-fns");
const { checkPermissionsMiddleware, PERMISSIONS_MODULES } = require("./permissions");
const bcrypt = require('bcryptjs')
const { v4: uuidv4 } = require('uuid'); // ✅ Генерация UUID


const app = express();
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"], // Запрещаем загрузку внешних ресурсов
            scriptSrc: ["'self'", "https://telegram.org"], // Разрешаем Telegram Login
            imgSrc: ["'self'", "data:", "https://telegram.org"], // Разрешаем картинки из Telegram
            frameAncestors: ["'none'"], // Защита от Clickjacking
        },
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" }, // Безопасная политика рефереров скрывает реферер, если запрос идёт на другой домен.
    frameguard: { action: "deny" }, // Блокируем встраивание в iframe
}));
app.use(cors({
    exposedHeaders: ['Content-Range']
}));
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

app.post("/api/front/users/lock", async (req, res) => {
    const { telegramId, firstName, lastName, username } = req.body;

    try {
        // Проверяем, уже ли пользователь заблокирован
        const existingUser = await LockUsers.findOne({ telegramId });
        console.log(existingUser)
        if (existingUser) {
            return res.status(403).json({ error: "Пользователь уже заблокирован." });
        }

        // Создаем нового заблокированного пользователя
        const blockedUser = new LockUsers({
            telegramId,
            firstName,
            lastName,
            username,
        });

        await blockedUser.save();
        // Логируем 
        await registerEvent({
            eventType: "incident",
            description: `Пользователь ${firstName} (username: ${username}) с телеграмм ID ${telegramId} был заблокирован.`,
        });

        console.log(`🚨 Пользователь ${username} (${telegramId}) был заблокирован.`);

        return res.status(200).json({ message: "Вы заблокированы после 3 неудачных попыток." });

    } catch (error) {
        console.error("❌ Ошибка при блокировке пользователя:", error);
        return res.status(500).json({ error: "Ошибка сервера при обработке блокировки." });
    }
});

app.post("/api/front/users", async (req, res) => {
    const { telegramId, firstName, lastName, username, password, deviceId } = req.body;

    try {
        // Проверяем количество пользователей в базе
        const userCount = await User.countDocuments();
        let user = await User.findOne({ telegramId });
        const registration = await Registration.findOne();
        const lockedUser = await LockUsers.findOne({ telegramId });
        
        if (lockedUser) {
            return res.status(200).json({ isBlocked: true });
        }

        // Если пользователь уже есть, возвращаем его
        if (user) {
            if (!user.deviceId || user.deviceId !== deviceId) {
                user.deviceId = deviceId;
                await user.save();

                await registerEvent({
                    eventType: "incident",
                    description: `Id устройства пользователя ${user.username} c Id ${user._id} было изменено.`
                });
            }
            return res.status(200).json({ exists: true, user });
        }

        // Если пользователей нет — создаем первого с правами админа
        if (userCount === 0) {
            user = new User({
                telegramId,
                firstName,
                lastName,
                username,
                permissions: 98303, // Полные права администратора
                deviceId,
            });
            await user.save();
            return res.status(201).json({ exists: true, user });
        }

        // Если регистрация запрещена
        if (!registration || !registration.status) {
            return res.status(200).json({ exists: false, registrationAllowed: false });
        }

        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(409).json({ error: `Username пользователя "${username}" уже занято` });
        }

        // Если регистрация разрешена, но пароль не передан — просим его
        if (!password) {
            return res.status(200).json({ exists: false, registrationAllowed: true });
        }

        // Проверяем, совпадает ли введенный пароль
        const isPasswordValid = password === registration.pass;
        if (!isPasswordValid) {
            await registerEvent({
                eventType: "incident",
                description: `Неудачная попытка входа: ${firstName} ${lastName} (username: ${username}, telegrammID: ${telegramId})`
            });
            return res.status(400).json({ error: "Неверный пароль" });
        }

        // Создаем нового пользователя
        user = new User({ telegramId, firstName, lastName, username, deviceId });
        await user.save();

        return res.status(201).json({ exists: true, user });

    } catch (error) {
        console.error("Ошибка в /api/front/users:", error);
        res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
});

//Проверка пользователя в админки
app.post("/api/admin/auth/check", async (req, res) => {
    const { telegramId } = req.body;

    try {
        // Проверяем, есть ли пользователь в базе
        const user = await User.findOne({ telegramId });

        if (!user) {
            return res.status(404).json({ error: "Пользователь не найден" });
        }

        res.json(user);
    } catch (error) {
        console.error("Ошибка проверки пользователя:", error);
        res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
});


const haversine = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371; // Радиус Земли в км

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Расстояние в километрах
};

const decodeQRData = (encryptedPayload) => {
    try {
        // Decode base64 to UTF-8 string
        const jsonString = Buffer.from(encryptedPayload, 'base64').toString('utf-8');

        // Parse the JSON string
        const payload = JSON.parse(jsonString);

        return {
            deviceId: payload.DeviceId,
            sessionId: payload.SessionId
        };
    } catch (error) {
        throw new Error(`Invalid QR data format: ${error.message} with qr data ${encryptedPayload}`);
    }
};

app.get('/api/qr', async (req, res) => {
    try {
        const { deviceId, sessionId } = req.query;
        console.log(`Request: ${deviceId}:${sessionId}`);
        // Find the device
        const station = await Station.findOne({ deviceId, deleted: false });
        if (!station) {
            return res.status(404).json({
                status: 'device_not_found',
                message: 'Рабочая станция не зарегистрирована',
                username: '',
                password: ''
            });
        }

        // Check for approved session
        const session = await Session.findOne({
            sessionId,
            deviceId,
            status: 'approved'
        });

        if (!session) {
            console.log(`Session not found`);
            return res.status(200).json({
                status: 'pending',
                message: 'Не найдено активной сессии',
                username: '',
                password: ''
            });
        }
        console.log(`Session found`);
        // Return credentials for approved session
        return res.status(200).json({
            status: 'approved',
            message: 'Session approved',
            username: station.username,
            password: station.password
        });
    } catch (error) {
        console.error('Error in /api/qr:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error',
            username: '',
            password: ''
        });
    }
});

app.post('/api/qr/scan', async (req, res) => {
    const { qrData, location, userId } = req.body;

    // Decode base64 QR data
    const { deviceId, sessionId } = decodeQRData(qrData);
    try {        
        const station = await Station.findOne({ deviceId, deleted: false }).populate('users');

        if (!station) {
            console.log(`Station not found`);
            return res.status(200).json({
                status: 'device_not_found',
                message: 'Нужно зарегистрировать рабочую станцию'
            });
        }      
        
        // Проверяем, существует ли пользователь
        const user = await User.findOne({ _id: userId });

        if (!user) {
            console.log(`User not found`);
            return res.status(403).json({
                status: 'user_not_found',
                message: 'Пользователь не найден'
            });
        }

        // Проверяем, есть ли этот пользователь в списке users станции
        const isUserAllowed = station.users.some(stationUser => stationUser._id.equals(user._id));

        if (!isUserAllowed) {
            console.log(`User ${userId} is not allowed to access station ${deviceId}`);

            // Создаем событие "incident"
            await registerEvent({
                eventType: "incident",
                description: `Попытка авторизации пользователя ${userId} на станции ${deviceId} - доступ запрещен.`
            });

            return res.status(403).json({
                status: 'access_denied',
                message: 'У пользователя нет прав для доступа к рабочей станции'
            });
        }

        // Проверяем совпадение локации
        const [stationLat, stationLon] = station.location.split(',').map(parseFloat);
        const [latitude, longitude] = location.split(',').map(parseFloat);

        const distance = haversine(stationLat, stationLon, latitude, longitude);
        const maxAllowedDistance = 0.05; // 50 метров

        if (distance > maxAllowedDistance) {
            console.log(`Location mismatch: ${distance.toFixed(3)} km`);

            // Создаем событие "Несовпадение локации incident"
            await registerEvent({
                eventType: "incident",
                description: `Местоположение станции  ${deviceId} не совпадает. Расстояние: ${distance.toFixed(3)} km`
            });

            return res.status(200).json({
                status: 'location_mismatch',
                message: `Локация не совпадает. Расстояние: ${distance.toFixed(3)} км`
            });
        }

        const session = new Session({
            deviceId,
            sessionId,
            userId,
            location,
            status: 'approved',
            createdAt: new Date()
        });
        await session.save();

        // Создаем событие "authorization"
        await registerEvent({
            eventType: "authorization",
            description: `Авторизация пользователя ${userId} на станции ${deviceId}.`
        });

        console.log(`Session created ${sessionId}:${deviceId}`);
        return res.status(200).json({
            status: 'success',
            message: 'Успешно авторизован'
        });
    } catch (error) {
        // Создаем событие "incident"
        await registerEvent({
            eventType: "incident",
            description: `Авторизации пользователя ${userId} на станции ${deviceId} не удалась.`
        });
        console.error('Error in /api/qr/scan:', error);
        res.status(500).json({
            status: 'error',
            message: 'Ошибка сканирования QR'
        });
    }
});

app.post('/api/qr/add', async (req, res) => {
    const { qrData, location, username, password } = req.body;

    // Decode base64 QR data
    const { deviceId, sessionId } = decodeQRData(qrData);
    try {
        const existingStation = await Station.findOne({ deviceId });
        if (existingStation) {
            existingStation.username = username;
            existingStation.password = password;
            existingStation.deleted = false;
            existingStation.location = location;
            existingStation.createdAt = new Date();
            await existingStation.save();

            return res.status(200).json({
                status: 'success',
                message: 'Устройство успешно зарегистрировано'
            });
        }

        //Additional check: is the password encrypted
        const hashedPassword = await bcrypt.hash(password, 10);

        const station = new Station({
            deviceId,
            location,
            username,
            password: password,
            createdAt: new Date()
        });
        await station.save();
        // event "registration"
        await registerEvent({
            eventType: "registration",
            description: `Рабочая станция ${deviceId} добавлена.`
        });

        return res.status(200).json({
            status: 'success',
            message: 'Рабочая станция успешно добавлена'
        });
    } catch (error) {
        // event "error"
        await registerEvent({
            eventType: "incident",
            description: `Попытка регистрации станции ${deviceId}.`
        });
        console.error('Error in /api/qr/add:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Internal Server Error'
        });
    }
});

// Универсальная функция для регистрации события
const registerEvent = async ({ eventType, description }) => {
    try {
        const event = new Event({
            eventType,
            description,
        });

        await event.save();
        return event;
    } catch (err) {
        console.error("Ошибка регистрации события:", err);
        throw err;
    }
};

// Эндпоинт для регистрации события
app.post("/api/front/events", async (req, res) => {
    const { eventType, description } = req.body;
    try {
        // В данном случае функция самостоятельно найдёт пользователя по telegramId
        const event = await registerEvent({ eventType, description });
        res.status(201).json({ message: "Event recorded successfully", event });
    } catch (error) {
        console.error("Error in /api/front/events:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

//функции для логирования событий удаления
const logDeletion = async (Model, item) => {
    let description = "";

    switch (Model.modelName) {
        case "User": {
            const user = await User.findById(item._id);
            if (user) {
                description = `Пользователь ${user.firstName || "Неизвестно"} ${user.lastName || ""} (Telegram ID: ${user.telegramId}) был перенесен в корзину.`;
            } else {
                description = `Неизвестный пользователь был перенесен в корзину.`;
            }
            break;
        }
        case "Station": {
            const station = await Station.findById(item._id);
            if (station) {
                description = `Станция ${station.name || "Неизвестно"} (IP: ${station.ip || "Неизвестно"}) была перенесена в корзину.`;
            } else {
                description = `Неизвестная станция была перенесена в корзину.`;
            }
            break;
        }
        case "Counterparty": {
            const сounterparty = await Counterparty.findById(item._id);
            if (сounterparty) {
                description = `Контрагент ${сounterparty.fullName || "Неизвестно"} (Id: ${сounterparty.counterpartyId || "Неизвестно"}) был перенесен в корзину.`;
            } else {
                description = `Неизвестный контрагент был перенесен в корзину.`;
            }
            break;
        }
        default:
            description = `Неизвестный объект типа ${Model.modelName} был перенесен в корзину.`;
            break;
    }

    await registerEvent({
        eventType: "soft_delete",
        description
    });
};

const logPermanentDeletion = async (Model, item) => {
    let description = "";
    switch (Model.modelName) {
        case "User": {
            description = `Пользователь ${item.firstName || "Неизвестно"} ${item.lastName || ""} (Telegram ID: ${item.telegramId}) был полностью удален.`;
            break;
        }
        case "Station": {
            description = `Станция ${item.name || "Неизвестно"} (IP: ${item.ip || "Неизвестно"}) была полностью удалена.`;
            break;
        }
        case "Counterparty": {
            description = `Контрагент ${item.fullName || "Неизвестно"} (Id: ${item.counterpartyId || "Неизвестно"}) был полностью удален.`;
            break;
        }
        default:
            description = `Неизвестный объект типа ${Model.modelName} был полностью удален.`;
            break;
    }

    await registerEvent({
        eventType: "full_delete",
        description
    });
};
// Универсальная Функция для обработки маршрутов администратора
const handleAdminRoute = (Model, resourceName, additionalFilter = {}) => async (req, res) => {
    try {
        let filter = req.query.filter ? JSON.parse(req.query.filter) : {};
        filter = { ...filter, ...additionalFilter };

        const now = new Date();

        // Получаем смещение от клиента (в минутах) и переводим в миллисекунды
        const timezoneOffset = req.headers["x-timezone-offset"] ? parseInt(req.headers["x-timezone-offset"]) * 60000 : 0;
        
        // Приводим `now` к локальному времени пользователя перед `startOfDay()`
        const userNow = new Date(now.getTime() - timezoneOffset);

        // 🔹 Фильтрация по предустановленным диапазонам (сегодня, неделя, месяц)
        if (filter.dateRange) {
            let start, end;
            switch (filter.dateRange) {
                case 'today':
                    start = new Date(startOfDay(userNow).getTime() + timezoneOffset).toISOString();
                    end = new Date(endOfDay(userNow).getTime() + timezoneOffset).toISOString();
                    break;
                case 'week':
                    start = new Date(startOfWeek(userNow, { weekStartsOn: 1 }).getTime() + timezoneOffset).toISOString();
                    end = new Date(endOfDay(userNow).getTime() + timezoneOffset).toISOString();
                    break;
                case 'month':
                    start = new Date(startOfMonth(userNow).getTime() + timezoneOffset).toISOString();
                    end = new Date(endOfDay(userNow).getTime() + timezoneOffset).toISOString();
                    break;
                default:
                    break;
            }

            if (start && end) {
                filter.createdAt = { $gte: start, $lte: end };
            }

            delete filter.dateRange;
        }

        // 🔹 Фильтрация по произвольному диапазону дат
        if (filter.startDate || filter.endDate) {
            let startDate = filter.startDate ? new Date(startOfDay(new Date(filter.startDate)).getTime() + timezoneOffset).toISOString() : null;
            let endDate = filter.endDate ? new Date(endOfDay(new Date(filter.endDate)).getTime() + timezoneOffset).toISOString() : null;

            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = startDate;
            if (endDate) filter.createdAt.$lte = endDate;

            delete filter.startDate;
            delete filter.endDate;
        }

        // 🔹 Логируем фильтр, чтобы проверить, что даты верные
        // console.log("Фильтр по датам (UTC):", filter.createdAt);

        // Преобразование id в _id для отображения разрешенных пользователей в станциях
        if (filter.id) {
            filter._id = filter.id;
            delete filter.id;
        }

        // Динамический поиск по выбранному столбцу       
        if (filter.q && filter.searchField) {
            if (filter.searchField === "id" || filter.searchField === "_id") {
                if (mongoose.Types.ObjectId.isValid(filter.q) && filter.q.length === 24) {
                    // Точный поиск по ObjectId
                    filter._id = new mongoose.Types.ObjectId(filter.q);
                } else {
                    // Динамический поиск по ObjectId как строке
                    filter.$expr = { $regexMatch: { input: { $toString: "$_id" }, regex: filter.q, options: "i" } };
                }
            } else {
                // Динамический поиск по текстовым полям (username, email и т.д.)
                filter[filter.searchField] = { $regex: filter.q, $options: "i" };
            }
        
            delete filter.q;
            delete filter.searchField;
        }  

        if (filter.deleted === undefined) {
            filter.deleted = false; 
        }

        if (Model.modelName === "Registration") {
            let existingRecords = await Model.find();

            if (existingRecords.length === 0) {
                const newRecord = new Model(); 
                await newRecord.save();
                existingRecords = [newRecord];
            }

            // 🔹 Убираем пагинацию, так как запись всегда одна
            res.set("Content-Range", `registration 0-1/1`);
            res.set("Access-Control-Expose-Headers", "Content-Range");
            return res.json(existingRecords);
        }

        // Разбираем сортировку и диапазон
        const [start, end] = req.query.range ? JSON.parse(req.query.range) : [0, 9];
        let [sortField, sortOrder] = req.query.sort ? JSON.parse(req.query.sort) : ["id", "ASC"];
        if (sortField === "id") sortField = "_id";

        const total = await Model.countDocuments(filter);
        const items = await Model.find(filter)
            .sort({ [sortField]: sortOrder === "ASC" ? 1 : -1 })
            .skip(start)
            .limit(end - start + 1);

        res.set('Content-Range', `${resourceName} ${start}-${Math.min(end, total)}/${total}`);
        res.set('Access-Control-Expose-Headers', 'Content-Range');
        res.json(items);
    } catch (error) {
        console.error("Ошибка в фильтрации:", error);
        res.status(500).json({ error: error.message });
    }
};

// Универсальные CRUD-обработчики
const handleGetOne = (Model) => async (req, res) => {
    try {
        const item = await Model.findById(req.params.id);
        if (!item) return res.status(404).json({ error: "Not found" });
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const handleCreate = (Model) => async (req, res) => {
    try {
        // Hashing password
        let data = req.body;
        if (data.password) {
            data.password = await bcrypt.hash(data.password, 10)
        }

        const item = new Model(req.body);
        await item.save();
        res.status(201).json(item);
    } catch (error) {
        if (error.code === 11000) {
            // Обрабатываем ошибку уникальности (дубликат)
            return res.status(400).json({ error: "значение являеться уникальным и уже существует." });
        }
        res.status(400).json({ error: error.message });
    }
};

const handleUpdate = (Model) => async (req, res) => {
    try {
        // Hashing password
        let data = req.body;
        if(data.password) {
            data.password = await bcrypt.hash(data.password, 10);
        }

        const item = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!item) return res.status(404).json({ error: "Not found" });
        res.json(item);
    } catch (error) {
        if (error.code === 11000) {
            // Обрабатываем ошибку уникальности (дубликат)
            return res.status(400).json({ error: "значение являеться уникальным и уже существует." });
        }
        res.status(500).json({ error: error.message });
    }
};

const handleDelete = (Model) => async (req, res) => {
    try {
        const item = await Model.findByIdAndUpdate(
            req.params.id,
            { deleted: true },
            { new: true }
        );
        if (!item) return res.status(404).json({ error: "Not found" });

        // Вызываем универсальную функцию логирования события мягкого удаления
        if (Model.modelName !== "Event") {await logDeletion(Model, item)}
    
        res.json({ message: "Удалено (soft delete)", item });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const handleRestore = (Model) => async (req, res) => {
    try {
        const item = await Model.findByIdAndUpdate(
            req.params.id,
            { deleted: false },
            { new: true }
        );
        if (!item) return res.status(404).json({ error: "Not found" });
        res.json({ message: "Restored successfully", item });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const handlePermanentDelete = (Model) => async (req, res) => {
    try {
        // Сначала находим объект, чтобы извлечь его данные (telegramId и _id)
        const item = await Model.findById(req.params.id);
        if (!item) return res.status(404).json({ error: "Not found" });       
        
        // Удаляем объект окончательно из базы
        await Model.findByIdAndDelete(req.params.id);
        // Вызываем универсальную функцию логирования события полного удаления
        if (Model.modelName !== "Event") {await logPermanentDeletion(Model, item)}
        
        
        res.json({ message: "Полностью удалено" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Эндпоинты для админа (неудалённые объекты)
app.get("/api/admin/users", 
    checkPermissionsMiddleware(PERMISSIONS_MODULES["Пользователи"].view), 
    handleAdminRoute(User, "users"));
app.get("/api/admin/users/:id", 
    handleGetOne(User, "users"));
app.post("/api/admin/users", 
    checkPermissionsMiddleware(PERMISSIONS_MODULES["Пользователи"].create), 
    handleCreate(User));
app.put("/api/admin/users/:id", 
    checkPermissionsMiddleware(PERMISSIONS_MODULES["Пользователи"].edit), 
    handleUpdate(User));
app.delete("/api/admin/users/:id", 
    checkPermissionsMiddleware(PERMISSIONS_MODULES["Пользователи"].delete), 
    handleDelete(User));  // Мягкое удаление

app.get("/api/admin/events", 
    checkPermissionsMiddleware(PERMISSIONS_MODULES["Журнал событий"].view), 
    handleAdminRoute(Event, "events"));
app.get("/api/admin/events/:id", 
    handleGetOne(Event, "events"));
app.delete("/api/admin/events/:id", 
    checkPermissionsMiddleware(PERMISSIONS_MODULES["Журнал событий"].delete), 
    handleDelete(Event));  // Мягкое удаление

app.get("/api/admin/stations", 
    checkPermissionsMiddleware(PERMISSIONS_MODULES["Станции"].view), 
    handleAdminRoute(Station, "stations"));
app.get("/api/admin/stations/:id", 
    handleGetOne(Station));
app.post("/api/admin/stations", 
    checkPermissionsMiddleware(PERMISSIONS_MODULES["Станции"].create), 
    handleCreate(Station));
app.put("/api/admin/stations/:id", 
    checkPermissionsMiddleware(PERMISSIONS_MODULES["Станции"].edit), 
    handleUpdate(Station));
app.delete("/api/admin/stations/:id", 
    checkPermissionsMiddleware(PERMISSIONS_MODULES["Станции"].delete), 
    handleDelete(Station));  // Мягкое удаление

app.get("/api/admin/counterparts", 
    checkPermissionsMiddleware(PERMISSIONS_MODULES["Контрагенты"].view), 
    handleAdminRoute(Counterparty, "counterparts"));
app.get("/api/admin/counterparts/:id", 
    handleGetOne(Counterparty));
app.post("/api/admin/counterparts", 
    checkPermissionsMiddleware(PERMISSIONS_MODULES["Контрагенты"].create), 
    handleCreate(Counterparty));
app.put("/api/admin/counterparts/:id", 
    checkPermissionsMiddleware(PERMISSIONS_MODULES["Контрагенты"].edit), 
    handleUpdate(Counterparty));
app.delete("/api/admin/counterparts/:id", 
    checkPermissionsMiddleware(PERMISSIONS_MODULES["Контрагенты"].delete), 
    handleDelete(Counterparty));  // Мягкое удаление

app.get("/api/admin/registration", 
    checkPermissionsMiddleware(PERMISSIONS_MODULES["Регистрация"].view), 
    handleAdminRoute(Registration, "registration"));
app.get("/api/admin/registration/:id", 
    handleGetOne(Registration));
app.put("/api/admin/registration/:id", 
    checkPermissionsMiddleware(PERMISSIONS_MODULES["Регистрация"].edit), 
    handleUpdate(Registration));

app.get("/api/admin/lockUsers", 
    checkPermissionsMiddleware(PERMISSIONS_MODULES["Регистрация"].view), 
    handleAdminRoute(LockUsers, "lockUsers"));

// Эндпоинты для работы с корзиной (только удалённые объекты)
app.get("/api/admin/UsersTrash", 
    checkPermissionsMiddleware(PERMISSIONS_MODULES["Пользователи"].view), 
    handleAdminRoute(User, "users", { deleted: true }));
app.get("/api/admin/EventsTrash", 
    checkPermissionsMiddleware(PERMISSIONS_MODULES["Журнал событий"].view),  
    handleAdminRoute(Event, "events", { deleted: true }));
app.get("/api/admin/StationsTrash", 
    checkPermissionsMiddleware(PERMISSIONS_MODULES["Станции"].view), 
    handleAdminRoute(Station, "stations", { deleted: true }));
app.get("/api/admin/counterpartyTrash", 
    checkPermissionsMiddleware(PERMISSIONS_MODULES["Контрагенты"].view), 
    handleAdminRoute(Counterparty, "counterparts", { deleted: true }));

// Эндпоинты для восстановления объектов из корзины
app.post("/api/admin/trash/users/:id/restore", 
    checkPermissionsMiddleware(PERMISSIONS_MODULES["Пользователи"].delete), 
    handleRestore(User));
app.post("/api/admin/trash/events/:id/restore", 
    checkPermissionsMiddleware(PERMISSIONS_MODULES["Журнал событий"].delete), 
    handleRestore(Event));
app.post("/api/admin/trash/stations/:id/restore", 
    checkPermissionsMiddleware(PERMISSIONS_MODULES["Станции"].delete), 
    handleRestore(Station));
app.post("/api/admin/trash/counterparts/:id/restore", 
    checkPermissionsMiddleware(PERMISSIONS_MODULES["Контрагенты"].delete), 
    handleRestore(Counterparty));

// Эндпоинты для окончательного удаления из корзины
app.delete("/api/admin/usersTrash/:id", 
    checkPermissionsMiddleware(PERMISSIONS_MODULES["Пользователи"].delete), 
    handlePermanentDelete(User));
app.delete("/api/admin/eventsTrash/:id", 
    checkPermissionsMiddleware(PERMISSIONS_MODULES["Журнал событий"].delete), 
    handlePermanentDelete(Event));
app.delete("/api/admin/stationsTrash/:id", 
    checkPermissionsMiddleware(PERMISSIONS_MODULES["Станции"].delete), 
    handlePermanentDelete(Station));
app.delete("/api/admin/counterpartyTrash/:id", 
    checkPermissionsMiddleware(PERMISSIONS_MODULES["Контрагенты"].delete), 
    handlePermanentDelete(Counterparty));
app.delete("/api/admin/lockUsers/:id", 
    checkPermissionsMiddleware(PERMISSIONS_MODULES["Регистрация"].edit), 
    handlePermanentDelete(LockUsers));

app.listen(8000, () => console.log('Backend running on port 8000'));