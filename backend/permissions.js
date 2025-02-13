const User = require("./models/User");

const PERMISSIONS_MODULES = {
    "Админ-доступ": { access: 1 }, 
    "Пользователи": { view: 2, create: 4, edit: 8, delete: 16 },
    "Контрагенты": { view: 32, create: 64, edit: 128, delete: 256 },
    "Станции": { view: 512, create: 1024, edit: 2048, delete: 4096 },
    "Журнал событий": { view: 8192, delete: 16384 },
};

// Функция проверки прав
const checkPermission = (userPermissions, permissionFlag) => {
    return (userPermissions & permissionFlag) === permissionFlag;
};

// Функция для модификации прав (добавление/удаление)
const modifyPermission = (userPermissions, permissionFlag) => {
    return userPermissions ^ permissionFlag;
};

// Middleware для проверки прав доступа
const checkPermissionsMiddleware = (requiredPermission) => async (req, res, next) => {
  try {
      // Получаем telegramId из заголовков
      const telegramId = req.headers["x-telegram-id"];

      if (!telegramId) {
          return res.status(403).json({ error: "Доступ запрещен. Telegram ID не указан." });
      }

      // Проверяем, есть ли пользователь
      const user = await User.findOne({ telegramId });
      if (!user) {
          return res.status(403).json({ error: "Доступ запрещен. Пользователь не найден." });
      }

      // Проверяем, является ли пользователь администратором (имеет `access: 1`)
      const ADMIN_ACCESS = 1;
      if (!checkPermission(user.permissions, ADMIN_ACCESS)) {
          return res.status(403).json({ error: "Доступ запрещен. Только администраторы могут выполнять это действие." });
      }

      // Проверяем конкретные права пользователя
      if (!checkPermission(user.permissions, requiredPermission)) {
          return res.status(403).json({ error: "Недостаточно прав для выполнения этого действия." });
      }

      // Добавляем пользователя в `req`, чтобы использовать в дальнейшем
      req.user = user;

      next();
  } catch (error) {
      console.error("Ошибка проверки прав:", error);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
};


// Экспортируем все функции и объект прав
module.exports = {
    PERMISSIONS_MODULES,
    checkPermission,
    modifyPermission,
    checkPermissionsMiddleware,
};
