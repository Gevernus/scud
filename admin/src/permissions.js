export const PERMISSIONS_MODULES = {
  "Админ-доступ": { access:   1}, 
  "Пользователи": { view: 2, create: 4, edit: 8, delete:  16},
  "Контрагенты": { view: 32, create: 64, edit: 128, delete:  256},
  "Станции": { view: 512, create: 1024, edit: 2048, delete:  4096},
  "Журнал событий": { view: 8192, delete: 16384},
};

// The rights verification function
export const checkPermission = (userPermissions, permissionFlag) => {
  return (userPermissions & permissionFlag) === permissionFlag;
};

export const modifyPermission = (userPermissions, permissionFlag) => {
  return userPermissions ^ permissionFlag;
};