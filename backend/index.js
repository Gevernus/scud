require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require("cors");
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Event = require('./models/Event');

const app = express();
app.use(cors({
    exposedHeaders: ['Content-Range']
}));
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));

app.post("/api/users", async (req, res) => {
    const { telegramId, firstName, lastName, username, linkHash } = req.body;

    try {
        // Check if user exists
        let user = await User.findOne({ telegramId });

        if (!user) {
            // Create new user
            user = new User({
                telegramId,
                firstName,
                lastName,
                username,
            });
            await user.save();

            // // Update referrer's referrals array if referral exists
            // if (linkHash) {
            //     const shareLink = await ShareLink.findOne({
            //         hash: linkHash,
            //     });

            //     if (shareLink) {
            //         await User.findByIdAndUpdate(shareLink.userId, {
            //             $push: {
            //                 referrals: {
            //                     userId: user._id,
            //                     createdAt: new Date()
            //                 }
            //             }
            //         });
            //     }
            // }
        }

        res.json(user);
    } catch (error) {
        console.error("Error in /users:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Универсальная функция для регистрации события
const registerEvent = async ({ telegramId, userId, eventType, description }) => {
    try {
        let resolvedUserId = userId;
        // Если передан telegramId и userId не указан, попробуем найти пользователя по telegramId
        if (telegramId && !userId) {
            const user = await User.findOne({ telegramId });
            if (!user) {
                throw new Error("User not found");
            }
            resolvedUserId = user._id;
        }
        if (!resolvedUserId) {
            throw new Error("User identifier not provided");
        }
        const event = new Event({
            userId: resolvedUserId,
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
app.post("/api/events", async (req, res) => {
    const { telegramId, eventType, description } = req.body;
    try {
        // В данном случае функция самостоятельно найдёт пользователя по telegramId
        const event = await registerEvent({ telegramId, eventType, description });
        res.status(201).json({ message: "Event recorded successfully", event });
    } catch (error) {
        console.error("Error in /api/events:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Функция для обработки маршрутов администратора
const handleAdminRoute = (Model, resourceName, additionalFilter = {}) => async (req, res) => {
    try {
        // Разбираем фильтр из запроса
        let filter = req.query.filter ? JSON.parse(req.query.filter) : {};
        // Применяем дополнительные условия (например, для корзины: { deleted: true })
        filter = { ...filter, ...additionalFilter };

        // Если фильтр не содержит явное условие по deleted, то добавляем deleted: false
        if (typeof filter.deleted === 'undefined') {
            filter.deleted = false;
        }

        // Преобразование id в _id, если присутствует
        if (filter.id) {
            filter._id = filter.id;
            delete filter.id;
        }

        // Разбираем диапазон записей и сортировку
        const [start, end] = req.query.range ? JSON.parse(req.query.range) : [0, 9];
        let [sortField, sortOrder] = req.query.sort ? JSON.parse(req.query.sort) : ["id", "ASC"];
        if (sortField === "id") {
            sortField = "_id";
        }

        const total = await Model.countDocuments(filter);
        const items = await Model.find(filter)
            .sort({ [sortField]: sortOrder === "ASC" ? 1 : -1 })
            .skip(start)
            .limit(end - start + 1);

        res.set('Content-Range', `${resourceName} ${start}-${Math.min(end, total)}/${total}`);
        res.set('Access-Control-Expose-Headers', 'Content-Range');
        res.json(items);
    } catch (error) {
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
        res.status(400).json({ error: error.message });
    }
};

const handleUpdate = (Model) => async (req, res) => {
    try {
        const item = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!item) return res.status(404).json({ error: "Not found" });
        res.json(item);
    } catch (error) {
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

        // Если модель не Event, регистрируем событие удаления
        if (Model.modelName !== "Event") {
            
            const telegramId = item.telegramId || "неизвестно";
            await registerEvent({
                telegramId,
                eventType: "soft_delete",
                description: `Пользователь с telegramId ${telegramId} был перенесен в корзину. `
            });
        }

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
        const telegramId = item.telegramId || "неизвестно";
        
        // Удаляем объект окончательно из базы
        await Model.findByIdAndDelete(req.params.id);
        
        // передаём и telegramId, и userId, чтобы функция registerEvent не искала пользователя по telegramId.
        if (Model.modelName !== "Event") {
            await registerEvent({
                telegramId,
                userId: item._id,  // передаем явный userId
                eventType: "full_delete",
                description: `Пользователь с telegramId ${telegramId} был полностью удалён`
            });
        }
        
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

// Эндпоинты для работы с корзиной (только удалённые объекты)
app.get("/api/admin/UsersTrash", handleAdminRoute(User, "users", { deleted: true }));
app.get("/api/admin/EventsTrash", handleAdminRoute(Event, "events", { deleted: true }));

// Эндпоинты для восстановления объектов из корзины
app.post("/api/admin/trash/users/:id/restore", handleRestore(User));
app.post("/api/admin/trash/events/:id/restore", handleRestore(Event));

// Эндпоинты для окончательного удаления из корзины
app.delete("/api/admin/UsersTrash/:id", handlePermanentDelete(User));
app.delete("/api/admin/EventsTrash/:id", handlePermanentDelete(Event));


app.listen(8000, () => console.log('Backend running on port 8000'));