const User = require('./models/User');

const PERMISSIONS_MODULES = {
  "Админ-доступ": { access: 1 },
  "Пользователи": { view: 2, create: 4, edit: 8, delete: 16 },
  "Контрагенты": { view: 32, create: 64, edit: 128, delete: 256 },
  "Станции": { view: 512, create: 1024, edit: 2048, delete: 4096 },
  "Журнал событий": { view: 8192, delete: 16384 },
  "Регистрация": { view: 32768, edit: 65536 },
  "Nfc": { view: 131072, edit: 262144 },
  "ОТП": { view: 524288 },
};

// Функция проверки прав
const checkPermission = (userPermissions, permissionFlag) => {
  return (userPermissions & permissionFlag) === permissionFlag;
};

// Function for rights modification (add/remove)
const modifyPermission = (userPermissions, permissionFlag) => {
  return userPermissions ^ permissionFlag;
};

// Middleware for checking access rights
const checkPermissionsMiddleware =
  (requiredPermission) => async (req, res, next) => {
    try {
      const telegramId = req.headers['x-telegram-id'];

      if (!telegramId) {
        return res
          .status(403)
          .json({ error: 'Доступ запрещен. Telegram ID не указан.' });
      }

      const user = await User.findOne({ telegramId });
      if (!user) {
        return res
          .status(403)
          .json({ error: 'Доступ запрещен. Пользователь не найден.' });
      }

      // Checking if the user is an administrator (has `access:1')
      const ADMIN_ACCESS = 1;
      if (!checkPermission(user.permissions, ADMIN_ACCESS)) {
        return res
          .status(403)
          .json({
            error:
              'Доступ запрещен. Только администраторы могут выполнять это действие.',
          });
      }

      // We check the specific user rights
      if (!checkPermission(user.permissions, requiredPermission)) {
        return res
          .status(403)
          .json({ error: 'Недостаточно прав для выполнения этого действия.' });
      }

      // Adding the user to the `req` to use in the future
      req.user = user;

      next();
    } catch (error) {
      console.error('Ошибка проверки прав:', error);
      res.status(500).json({ error: `Внутренняя ошибка сервера: ${error.message}` });
    }
  };

// Exporting all functions and the rights object
module.exports = {
  PERMISSIONS_MODULES,
  checkPermission,
  modifyPermission,
  checkPermissionsMiddleware,
};
