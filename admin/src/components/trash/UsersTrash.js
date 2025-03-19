import { Datagrid, DateField, List, TextField } from 'react-admin';
import RestoreButton from '../UI/RestoreButton';
import { useUser } from '../../context/UserContext';
import { PERMISSIONS_MODULES } from '../../permissions';
import ExportToExcelButton from '../UI/ExportToExcelButton';

export const UsersTrash = () => {
  const { checkPermission } = useUser();
  const canDelete = checkPermission(PERMISSIONS_MODULES['Пользователи'].delete);

  return (
    <List actions={<ExportToExcelButton resource="usersTrash" />}>
      <Datagrid isRowSelectable={() => canDelete}>
      <TextField source="id" label="ID Пользователя" />
        <TextField source="telegramId" label="Telegram ID" />
        <TextField source="firstName" label="Имя" />
        <TextField source="lastName" label="Фамилия" />
        <TextField source="username" label="username" />
        <TextField source="company" label="Компания" />
        <DateField source="createdAt" label="Дата" />
        <TextField source="id" />
        {canDelete && <RestoreButton resource="users" />}
      </Datagrid>
    </List>
  );
};
