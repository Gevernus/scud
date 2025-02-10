require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require("cors");
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Event = require('./models/Event');
const Station = require('./models/Station')
const Counterparty = require('./models/Counterparty')
const { startOfDay, endOfDay, startOfWeek, startOfMonth, toDate } = require("date-fns");

const app = express();
app.use(cors({
    exposedHeaders: ['Content-Range']
}));
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

// app.post("/api/front/users", async (req, res) => {
//     const { telegramId, firstName, lastName, username, linkHash } = req.body;

//     try {
//         // Check if user exists
//         let user = await User.findOne({ telegramId });

//         if (!user) {
//             // Create new user
//             user = new User({
//                 telegramId,
//                 firstName,
//                 lastName,
//                 username,
//             });
//             await user.save();

//             // // Update referrer's referrals array if referral exists
//             // if (linkHash) {
//             //     const shareLink = await ShareLink.findOne({
//             //         hash: linkHash,
//             //     });

//             //     if (shareLink) {
//             //         await User.findByIdAndUpdate(shareLink.userId, {
//             //             $push: {
//             //                 referrals: {
//             //                     userId: user._id,
//             //                     createdAt: new Date()
//             //                 }
//             //             }
//             //         });
//             //     }
//             // }
//         }

//         res.json(user);
//     } catch (error) {
//         console.error("Error in /api/front/users:", error);
//         res.status(500).json({ error: "Internal server error" });
//     }
// });


app.post("/api/front/users", async (req, res) => {
    const { telegramId, firstName, lastName, username } = req.body;

    try {
        // Проверяем количество пользователей в базе
        const userCount = await User.countDocuments();

        // Проверяем, существует ли пользователь
        let user = await User.findOne({ telegramId });

        if (!user) {
            // Первый пользователь получает админские права
            user = new User({
                telegramId,
                firstName,
                lastName,
                username,
                permissions: userCount === 0 ? 98303 : 0, 
            });

            await user.save();
        }

        res.json(user);
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

        // 📌 Получаем смещение от клиента (в минутах) и переводим в миллисекунды
        const timezoneOffset = req.headers["x-timezone-offset"] ? parseInt(req.headers["x-timezone-offset"]) * 60000 : 0;

        // 📌 Корректируем дату один раз!
        const toUTC = (date) => new Date(date.getTime() + timezoneOffset); // Сдвигаем время назад в UTC

        // 🔹 Фильтрация по предустановленным диапазонам (сегодня, неделя, месяц)
        if (filter.dateRange) {
            let start, end;
            switch (filter.dateRange) {
                case 'today':
                    start = toUTC(startOfDay(now)).toISOString(); // Начало дня в UTC
                    end = toUTC(endOfDay(now)).toISOString(); // Конец дня в UTC
                    break;
                case 'week':
                    start = toUTC(startOfWeek(now, { weekStartsOn: 1 })).toISOString();
                    end = toUTC(endOfDay(now)).toISOString();
                    break;
                case 'month':
                    start = toUTC(startOfMonth(now)).toISOString();
                    end = toUTC(endOfDay(now)).toISOString();
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
            let startDate = filter.startDate ? toUTC(startOfDay(new Date(filter.startDate))).toISOString() : null;
            let endDate = filter.endDate ? toUTC(endOfDay(new Date(filter.endDate))).toISOString() : null;

            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = startDate;
            if (endDate) filter.createdAt.$lte = endDate;

            delete filter.startDate;
            delete filter.endDate;
        }

        // 🔹 Логируем фильтр, чтобы проверить, что даты верные
        console.log("Фильтр по датам (UTC):", filter.createdAt);

        // Динамический поиск по выбранному столбцу
        if (filter.q && filter.searchField) {
            filter[filter.searchField] = { $regex: filter.q, $options: "i" };
            delete filter.q;
            delete filter.searchField;
        }

        // Преобразование id в _id
        if (filter.id) {
            filter._id = filter.id;
            delete filter.id;
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
app.get("/api/admin/users", handleAdminRoute(User, "users"));
app.get("/api/admin/users/:id", handleGetOne(User, "users"));
app.post("/api/admin/users", handleCreate(User));
app.put("/api/admin/users/:id", handleUpdate(User));
app.delete("/api/admin/users/:id", handleDelete(User));  // Мягкое удаление

app.get("/api/admin/events", handleAdminRoute(Event, "events"));
app.get("/api/admin/events/:id", handleGetOne(Event, "events"));
app.delete("/api/admin/events/:id", handleDelete(Event));  // Мягкое удаление

app.get("/api/admin/stations", handleAdminRoute(Station, "stations"));
app.get("/api/admin/stations/:id", handleGetOne(Station));
app.post("/api/admin/stations", handleCreate(Station));
app.put("/api/admin/stations/:id", handleUpdate(Station));
app.delete("/api/admin/stations/:id", handleDelete(Station));  // Мягкое удаление

app.get("/api/admin/counterparts", handleAdminRoute(Counterparty, "counterparts"));
app.get("/api/admin/counterparts/:id", handleGetOne(Counterparty));
app.post("/api/admin/counterparts", handleCreate(Counterparty));
app.put("/api/admin/counterparts/:id", handleUpdate(Counterparty));
app.delete("/api/admin/counterparts/:id", handleDelete(Counterparty));  // Мягкое удаление

// Эндпоинты для работы с корзиной (только удалённые объекты)
app.get("/api/admin/UsersTrash", handleAdminRoute(User, "users", { deleted: true }));
app.get("/api/admin/EventsTrash", handleAdminRoute(Event, "events", { deleted: true }));
app.get("/api/admin/StationsTrash", handleAdminRoute(Station, "stations", { deleted: true }));
app.get("/api/admin/counterpartyTrash", handleAdminRoute(Counterparty, "counterparts", { deleted: true }));

// Эндпоинты для восстановления объектов из корзины
app.post("/api/admin/trash/users/:id/restore", handleRestore(User));
app.post("/api/admin/trash/events/:id/restore", handleRestore(Event));
app.post("/api/admin/trash/stations/:id/restore", handleRestore(Station));
app.post("/api/admin/trash/counterparts/:id/restore", handleRestore(Counterparty));

// Эндпоинты для окончательного удаления из корзины
app.delete("/api/admin/usersTrash/:id", handlePermanentDelete(User));
app.delete("/api/admin/eventsTrash/:id", handlePermanentDelete(Event));
app.delete("/api/admin/stationsTrash/:id", handlePermanentDelete(Station));
app.delete("/api/admin/counterpartyTrash/:id", handlePermanentDelete(Counterparty));

app.listen(8000, () => console.log('Backend running on port 8000'));