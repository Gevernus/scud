require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require("cors");
const User = require('./models/User');
const Event = require('./models/Event');
const Station = require('./models/Station')
const Session = require('./models/Session')
const Counterparty = require('./models/Counterparty')
const Registration = require('./models/Registration')
const LockUsers = require('./models/LockUsers')
const Nfc = require('./models/Nfc')
const { startOfDay, endOfDay, startOfWeek, startOfMonth, toDate } = require("date-fns");
const { checkPermissionsMiddleware, PERMISSIONS_MODULES } = require("./permissions");


const app = express();
// app.use(helmet({
//     contentSecurityPolicy: {
//         directives: {
//             defaultSrc: ["'self'"], // Запрещаем загрузку внешних ресурсов
//             scriptSrc: ["'self'", "https://telegram.org"], // Разрешаем Telegram Login
//             imgSrc: ["'self'", "data:", "https://telegram.org"], // Разрешаем картинки из Telegram
//             frameAncestors: ["'none'"], // Защита от Clickjacking
//         },
//     },
//     referrerPolicy: { policy: "strict-origin-when-cross-origin" }, // Безопасная политика рефереров скрывает реферер, если запрос идёт на другой домен.
//     frameguard: { action: "deny" }, // Блокируем встраивание в iframe
// }));
app.use(cors({
    exposedHeaders: ['Content-Range']
}));
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

app.post("/api/front/users", async (req, res) => {
    const { telegramId, firstName, lastName, username, password, deviceId } = req.body;

    try {
        // Проверяем количество пользователей в базе
        const userCount = await User.countDocuments();
        let user = await User.findOne({ telegramId });
        const registration = await Registration.findOne();
        const lockedUser = await LockUsers.findOne({ telegramId });
        
        if (lockedUser) {
            return res.status(200).json({
                isBlocked: true,
                blockReason: "Ваш аккаунт был заблокирован. Обратитесь к администратору."
            });
        }

        // Если пользователь уже есть, возвращаем его
        if (user) {
            if (!user.deviceId.includes(deviceId)) {                
                user.unsafe = true;
                await user.save();
                await registerEvent({
                    eventType: "incident",
                    description: `Id устройства пользователя: ${user.firstName} ${user.lastName} (username: ${user.username}) c Id ${user._id} не совпадает.`
                });
            }
             // Если пользователь подозрительный
            if ( user.unsafe && !registration.status ) {
                return res.status(200).json({
                    isBlocked: true,
                    blockReason: "Отказано в доступе. Обнаружено несоответствие устройства, обратитесь к администратору."
                });
            }
            // Если регистрация разрешена запрашиваем пароль
            if (user.unsafe && !password) {
                return res.status(200).json({exists: false, user, verification: true });
            }
            
            const isPasswordValid = password === registration.pass;

            if (password && !isPasswordValid) {
                await registerEvent({
                    eventType: "incident",
                    description: `Неудачная попытка добавления нового устройства пользователя: ${firstName} ${lastName} (username: ${username}, telegrammID: ${telegramId}), неверный PIN.`
                });
                return res.status(400).json({ error: "PIN-код неверный, обратитесь к администратору." });
            }

            return res.status(200).json({ exists: true, user, passwordVerified: true });
        }

        // Если пользователей нет — создаем первого с правами админа
        if (userCount === 0) {
            user = new User({
                telegramId,
                firstName,
                lastName,
                username,
                permissions: 1048575, // Полные права администратора
                deviceId,
            });
            await user.save();
            return res.status(201).json({ exists: true, user });
        }

        // Если регистрация запрещена
        if (!registration || !registration.status) {
            await registerEvent({
                eventType: "incident",
                description: `Запрос на авторизацию от незарегистрированного пользователя: ${firstName} ${lastName} (username: ${username}, telegrammID: ${telegramId}) .`
            });
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
        
        const isPasswordValid = password === registration.pass;

        if (!isPasswordValid) {
            await registerEvent({
                eventType: "incident",
                description: `Неудачная попытка регистрации пользователя: ${firstName} ${lastName} (username: ${username}, telegrammID: ${telegramId}) неверный PIN.`
            });
            return res.status(400).json({ error: "PIN-код неверный, обратитесь к администратору." });
        }
        
        await registerEvent({
            eventType: "registration",
            description: `Новый пользователя: ${firstName} ${lastName} (username: ${username}, telegrammID: ${telegramId}) был зарегистрирован.`
        });
        return res.status(200).json({ exists: true, passwordVerified: true });
        
    } catch (error) {
        console.error("Ошибка в /api/front/users:", error);
        res.status(500).json({ error: `Внутренняя ошибка сервера: ${error.message}` });
    }
});    

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
            description: `PIN-код неправильно введен 3 раза пользователь ${firstName} (username: ${username}) с телеграмм ID ${telegramId} был заблокирован.`,
        });

        console.log(`🚨 Пользователь ${username} (${telegramId}) был заблокирован.`);

        return res.status(200).json({ message: "Вы заблокированы после 3 неудачных попыток." });

    } catch (error) {
        console.error("❌ Ошибка при блокировке пользователя:", error);
        return res.status(500).json({ error: "Ошибка сервера при обработке блокировки." });
    }
});

app.post("/api/front/users/new", async (req, res) => {
    const { telegramId, firstName, lastName, username,deviceId, middleName, phone, email,  division, position , company} = req.body;

    try {
        let user = await User.findOne({ telegramId });
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(409).json({ error: `Username пользователя "${username}" уже занято` });
        }

        user = new User({ 
            telegramId,
            firstName,
            lastName,
            middleName,
            username,
            phone,
            email,
            division,
            position,
            deviceId,
            company, 
        });

        await user.save();
        return res.status(201).json({ exists: true, user });

    } catch (error) {
        console.error("Ошибка в /api/front/users:", error);
        res.status(500).json({ error: `Внутренняя ошибка сервера: ${error.message}` });
    }
});

app.post("/api/front/users/verification", async (req, res) => {
    const { telegramId, deviceId} = req.body;

    try {
        let user = await User.findOne({ telegramId });
        
        // Если пользователь уже есть, возвращаем его
        if (user) {          
                user.deviceId.push(deviceId);
                user.unsafe = false;               
                await user.save();
                await registerEvent({
                    eventType: "incident",
                    description: `Добавлено новое устройство пользователя: ${user.firstName} ${user.lastName} (username: ${user.username}) c (ID: ${user._id}).`
                });
            return res.status(200).json({ exists: true, user });
        }
    
        return res.status(201).json({ exists: true, user });

    } catch (error) {
        console.error("Ошибка в /api/front/users:", error);
        res.status(500).json({ error: `Внутренняя ошибка сервера: ${error.message}` });
    }
});

// Эндпоинт для получения списка компаний
app.get("/api/front/companies", async (req, res) => {
    try {
        const companies = await Counterparty.find({}, "_id fullName"); // Получаем только id и имя
        res.json(companies);
    } catch (error) {
        console.error("Ошибка получения списка компаний:", error);
        res.status(500).json({ error: "Ошибка сервера" });
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
        res.status(500).json({ error: `Внутренняя ошибка сервера: ${error.message}` });
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
        // Find the device
        const station = await Station.findOne({ deviceId, deleted: false });
        if (!station) {
            return res.status(404).json({
                status: 'device_not_found',
                mode: 'PASSWORD',
                message: 'Рабочая станция не зарегистрирована',
            });
        }

        if (station.loginMode == 'PASSWORD') {
            return res.status(200).json({
                status: 'password_mode',
                mode: 'PASSWORD',
                message: 'Необходимо ввести логин и пароль',
            });
        }

        // Check for approved session
        const session = await Session.findOne({
            sessionId,
            deviceId,
            status: 'approved'
        });

        if (!session) {
            return res.status(200).json({
                status: 'pending',
                mode: 'QR',
                message: 'Не найдено активной сессии',
            });
        }
        // Return credentials for approved session
        return res.status(200).json({
            status: 'approved',
            mode: 'QR',
            message: 'Session approved',
        });
    } catch (error) {
        console.error('Error in /api/qr:', error);
        res.status(500).json({
            status: 'error',
            mode: 'QR',
            message: 'Internal server error',
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
        
        if (station.loginMode == 'PASSWORD') {
            return res.status(200).json({
                status: 'password_mode',
                message: 'Вход по QR запрещен',
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

        // Проверяем, есть ли этот пользователь в списке разрешённых пользователей
        const isUserAllowed = station.users.some(stationUser => stationUser._id.equals(user._id));
        if (!isUserAllowed) {
            console.log(`User ${userId} is not allowed to access station ${deviceId}`);

            // Проверяем, есть ли этот пользователь в списке attemptedUsers станции
            const alreadyAttempted = station.attemptedUsers.some(attempt => attempt.equals(user._id));
            if (!alreadyAttempted) {
                station.attemptedUsers.push(user._id);
                await station.save();
            }

            // Создаем событие "incident"
            await registerEvent({
                eventType: "incident",
                description: `Попытка авторизации пользователя: ${user.firstName || "Неизвестно"} ${user.lastName || "Неизвестно"} (username: ${user.username || "Неизвестно"}) с ID ${userId} на станции ${station.name || "Неизвестно"} c ID ${deviceId} - доступ запрещен.`
            });

            return res.status(403).json({
                status: 'access_denied',
                message: 'У пользователя нет прав для доступа к рабочей станции'
            });
        }

        const session = new Session({
            deviceId,
            sessionId,
            userId,
            location,
            status: 'pending',
            createdAt: new Date()
        });
        await session.save();

        //проверяем режим станции
        if (station.nfcMode === 'always') {
            return res.status(200).json({
                status: 'nfcMode_always',
                message: `Необходима проверка с помощью NFC`,
                sessionId,
                deviceId
            });
        }

        // Проверяем совпадение локации
        if (!station.location){
            station.location = location;
            await station.save();
        }

        const [stationLat, stationLon] = station.location.split(',').map(parseFloat);
        const [latitude, longitude] = location.split(',').map(parseFloat);

        const distance = haversine(stationLat, stationLon, latitude, longitude);
        const maxAllowedDistance = 0.01; // 10 метров
        const distanceInMeters = distance * 1000;
        if (distance > maxAllowedDistance && (station.nfcMode === 'geoMismatch' || station.nfcMode === 'never')) {
            console.log(`Location mismatch: ${distance.toFixed(3)} km`);

            // Создаем событие "Несовпадение локации incident"
            await registerEvent({
                eventType: "incident",
                description: `Местоположение пользователя: ${user.firstName} ${user.lastName} (username: ${user.username}) с ID ${userId} не совпадает со станцией ${deviceId}. Расстояние: ${distanceInMeters.toFixed(0)} m`,
                sessionId,
                deviceId
            });
            const status = station.nfcMode === 'geoMismatch' ? 'nfcMode_geoMismatch' : 'location_mismatch';
            return res.status(200).json({
                status,
                message: `Локация не совпадает. Расстояние: ${distance.toFixed(3)} км`
            });
        }        

        session.status = 'approved';
        await session.save();

        // Создаем событие "authorization"
        await registerEvent({
            eventType: "authorization",
            description: `Пользователь: ${user.firstName} ${user.lastName} (username: ${user.username}) с ID ${userId} авторизирован на станции ${station.name || ""} с ID ${deviceId}. Расстояние: ${distanceInMeters.toFixed(0)} m`
        });

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
    const { deviceId, name, companyName, description } = req.body;

    // Decode base64 QR data
    // const { deviceId, sessionId } = decodeQRData(qrData);
    try {
        const existingStation = await Station.findOne({ deviceId });
        if (existingStation) {
            existingStation.name = name;
            existingStation.description = description;
            existingStation.company = companyName;
            existingStation.deleted = false;
            existingStation.updatedAt = new Date();
            await existingStation.save();

            await registerEvent({
                eventType: "registration",
                description: `Успешно зарегистрирована станция ${deviceId}.`
            });

            return res.status(200).json({
                status: 'success',
                message: 'Устройство успешно зарегистрировано'
            });
        }

        //Additional check: is the password encrypted
        // const hashedPassword = await bcrypt.hash(password, 10);

        const station = new Station({
            deviceId,
            name,
            description,
            company: companyName,
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

//Универсальный эндпоинт для работы с NFC (сканирование + регистрация)
app.post('/api/nfc-handler', async (req, res) => {
    try {
        const { tagId, sessionId, nfcName, nfcDescription, userId, location } = req.body;

        if (!tagId) return res.status(400).json({ error: 'Не передан tagId' });

        const nfcTag = await Nfc.findOne({ guid: tagId });
        if (!nfcTag && !nfcName) return res.status(404).json({ status: 'NFC not found', message: 'NFC метка не найдена. Добавьте метку' });

        const user = await User.findOne({ _id: userId });
        if (!user) return res.status(403).json({ error: 'Доступ запрещен. Пользователь не найден.' });

        if (nfcName && !nfcTag) {
            if (!nfcName || nfcName.trim() === '') {
                return res.status(400).json({ error: 'Не указано имя NFC-метки' });
            }

            if (!nfcDescription || nfcDescription.trim() === '') {
                return res.status(400).json({ error: 'Не указано описание NFC-метки' });
            }

            // Проверяем, есть ли у пользователя права на добавление меток
            // if (!checkPermission(user.permissions, PERMISSIONS_MODULES["Nfc"].edit)) {
            //     return res.status(403).json({ error: 'Недостаточно прав для регистрации NFC.' });
            // }

            // Создаем новую метку
            const nfcTag = new Nfc({ guid: tagId, nfcName, nfcDescription, location});
            await nfcTag.save();

            await registerEvent({
                eventType: "NFC",
                description: `Пользователь: ${user.firstName} ${user.lastName} (username: ${user.username}) с ID ${userId} зарегистрировал новую NFC метку с именем ${nfcTag.nfcName}.`
            });

            return res.json({ message: '✅ NFC-метка успешно зарегистрирована' });
        }

        await registerEvent({
            eventType: "NFC",
            description: `Пользователь: ${user.firstName} ${user.lastName} (username: ${user.username}) с ID ${userId} отсканировал NFC метку с именем ${nfcTag.nfcName}.`
        });

        if (!nfcTag.location && location) {
            nfcTag.location = location;
            await nfcTag.save();
        }
        const distanceInMeters = 0.0;

        if (nfcTag.location && location) {
            const [stationLat, stationLon] = nfcTag.location.split(',').map(parseFloat);
            const [latitude, longitude] = location.split(',').map(parseFloat);

            const distance = haversine(stationLat, stationLon, latitude, longitude);
            distanceInMeters = distance * 1000;
            const maxAllowedDistance = 0.01; // 10 метров

            if (distance > maxAllowedDistance) {
                // Создаем событие "Несовпадение локации incident"
                await registerEvent({
                    eventType: "incident",
                    description: `Местоположение пользователя: ${user.firstName} ${user.lastName} (username: ${user.username}) с ID ${userId} не совпадает с NFC меткой ${nfcTag.nfcName}. Расстояние: ${distanceInMeters.toFixed(0)} m`,
                });
            } 
        }             
        
        if (sessionId){
            const session = await Session.findOne({
                sessionId,
            });

            if (!session) {
                return res.status(400).json({
                    status: 'error',
                    error: 'Не найдено активной сессии',
                });
            }   

            const station = await Station.findOne({ deviceId:session.deviceId, deleted: false });
            const hasNfc = station.nfc.some(nfcId => nfcId.toString() === nfcTag.id);

            if (!hasNfc) {
                await registerEvent({
                    eventType: "incident",
                    description: `Метка NFC не  привязана к станции. Пользователю: ${user.firstName} ${user.lastName} (username: ${user.username}) с ID ${userId} отказано в авторизации на станции ${station.name || ""} с ID ${station.deviceId}. Расстояние: ${distanceInMeters.toFixed(0)} m`
                });

                return res.status(400).json({
                    status: 'error',
                    error: 'NFC метка не привязана к этой рабочей станции. Обратитесь к администратору.',
                });
            } 
            
            session.status = 'approved';
            await session.save();            

            // Создаем событие "authorization"
            await registerEvent({
                eventType: "authorization",
                description: `С помощью NFC был авторизован пользователь: ${user.firstName} ${user.lastName} (username: ${user.username}) с ID ${userId} авторизован на станции ${station.name || ""} с ID ${station.deviceId}. Расстояние: ${distanceInMeters.toFixed(0)} m`
            });
            return res.status(200).json({
                message: 'Успешно авторизован'
            });
        }  
        
        return res.status(200).json({            
            message: 'Сканирование прошло успешно'
        });

    } catch (error) {
        console.error('Ошибка NFC:', error);
        return res.status(500).json({ error: `Внутренняя ошибка сервера: ${error.message}` });
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
                description = `Станция ${station.name || "Неизвестно"} (ID: ${station._id || "Неизвестно"}) была перенесена в корзину.`;
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
            eventType = "full_delete",
            description = `Пользователь ${item.firstName || "Неизвестно"} ${item.lastName || ""} (Telegram ID: ${item.telegramId}) был полностью удален.`;
            break;
        }
        case "Station": {
            eventType = "full_delete",
            description = `Станция ${item.name || "Неизвестно"} (IP: ${item.ip || "Неизвестно"}) была полностью удалена.`;
            break;
        }
        case "Counterparty": {
            eventType = "full_delete",
            description = `Контрагент ${item.fullName || "Неизвестно"} (Id: ${item.counterpartyId || "Неизвестно"}) был полностью удален.`;
            break;
        }
        case "LockUsers": {
            eventType = "incident",
            description = `Пользователь ${item.username || "Неизвестно"} (Id: ${item.telegramId || "Неизвестно"}) был разблокирован.`;
            break;
        }
        case "Nfc": {
            eventType = "full_delete",
            description = `Nfc ${item.nfcName || "Неизвестно"} (идентифекатор: ${item.guid || "Неизвестно"}) был удален.`;
            break;
        }
        default:
            eventType = "full_delete",
            description = `Неизвестный объект типа ${Model.modelName} был полностью удален.`;
            break;
    }

    await registerEvent({
        eventType,
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
        // if (data.password) {
        //     data.password = await bcrypt.hash(data.password, 10)
        // }

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
        // if(data.password) {
        //     data.password = await bcrypt.hash(data.password, 10);
        // }
        let data = req.body;
        const user = req.user; // Получаем текущего пользователя
        const userId = user?.id || "Системный процесс";

        if (Model.modelName === 'Registration' ) {

            // Получаем старые данные перед изменением
            const oldItem = await Model.findById(req.params.id);
            if (!oldItem) return res.status(404).json({ error: "Not found" });
    
            // Проверяем, изменились ли `pass` или `status`
            const formatStatus = (status) => status ? "Разрешён" : "Запрещён";
            const changes = [];
            if (oldItem.pass !== data.pass) {
                changes.push(`Пароль изменён с "${oldItem.pass}" на "${data.pass}"`);
            }
            if (oldItem.status !== data.status) {
                changes.push(`Режим регистрации изменён с "${formatStatus(oldItem.status)}" на "${formatStatus(data.status)}"`);
            }
    
            // Если были изменения, записываем событие
            if (changes.length > 0 && Model.modelName === 'Registration') {
                await registerEvent({
                    eventType: "registration",
                    description: `Администратор: ${user.firstName} ${user.lastName} (username: ${user.username}) изменил регистрацию. ${changes.join(", ")}`,
                });
            }
        }

        // Если обновляется станция и в теле переданы разрешённые пользователи...
        if (Model.modelName === 'Station' && data.users) {
            // Получаем существующую станцию
            const existingStation = await Model.findById(req.params.id);
            if (existingStation) {
                // Преобразуем разрешённые пользователей в массив строк (если они могут быть объектами или ID)
                const allowedUserIds = data.users.map(u => 
                typeof u === 'object' ? u.id : u.toString()
                );
                // Отфильтровываем attemptedUsers, исключая те, что есть в allowedUserIds
                const filteredAttempted = existingStation.attemptedUsers.filter(userId =>
                    !allowedUserIds.includes(userId.toString())
                );
                data.attemptedUsers = filteredAttempted;
            }

            const oldItem = await Model.findById(req.params.id).populate("nfc");
            // Получаем ID старых и новых NFC-меток
            const oldNfcIds = oldItem.nfc.map(nfc => nfc._id.toString());
            const newNfcIds = (data.nfc || []).map(id => id.toString());

            // Определяем, какие метки были удалены и какие добавлены
            const detachedNfcIds = oldNfcIds.filter(id => !newNfcIds.includes(id)); // Больше не привязаны
            const attachedNfcIds = newNfcIds.filter(id => !oldNfcIds.includes(id)); // Новые привязанные
             // Снимаем флаг `attached` у отвязанных меток
            if (detachedNfcIds.length > 0) {
                const detachedNfcs = await Nfc.find({ _id: { $in: detachedNfcIds } }); // Загружаем объекты NFC
                await Nfc.updateMany(
                    { _id: { $in: detachedNfcIds } },
                    { $set: { attached: false } }
                );

                for (let nfc of detachedNfcs) {
                    await registerEvent({
                        eventType: "NFC",
                        description: `NFC метка "${nfc.nfcName}" (NFC идентификатор: ${nfc.guid}) была отвязана от станции "${oldItem.name}" (ID: ${oldItem.deviceId}).`,
                    });
                }
            }

            // Устанавливаем `attached = true` для новых привязанных меток
            if (attachedNfcIds.length > 0) {
                const attachedNfcs = await Nfc.find({ _id: { $in: attachedNfcIds } }); // Загружаем объекты NFC
                await Nfc.updateMany(
                    { _id: { $in: attachedNfcIds } },
                    { $set: { attached: true } }
                );

                for (let nfc of attachedNfcs) {
                    await registerEvent({
                        eventType: "NFC",
                        description: `NFC метка "${nfc.nfcName}" (NFC идентификатор: ${nfc.guid}) была привязана к станции "${oldItem.name}" (ID: ${oldItem.deviceId}).`,
                    });
                }
            }
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

app.get("/api/admin/nfc", 
    checkPermissionsMiddleware(PERMISSIONS_MODULES["Nfc"].view), 
    handleAdminRoute(Nfc, "nfc"));
app.get("/api/admin/nfc/:id", 
    handleGetOne(Nfc, "nfc"));
app.post("/api/admin/nfc", 
    checkPermissionsMiddleware(PERMISSIONS_MODULES["Nfc"].edit), 
    handleCreate(Nfc));
app.put("/api/admin/nfc/:id", 
    checkPermissionsMiddleware(PERMISSIONS_MODULES["Nfc"].edit), 
    handleUpdate(Nfc));   

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
app.delete("/api/admin/nfc/:id", 
    checkPermissionsMiddleware(PERMISSIONS_MODULES["Nfc"].edit), 
    handlePermanentDelete(Nfc));
    
app.patch("/api/admin/nfc/:id", 
    checkPermissionsMiddleware(PERMISSIONS_MODULES["Nfc"].edit), 
    handleUpdate(Nfc));
    

app.listen(8000, () => console.log('Backend running on port 8000'));