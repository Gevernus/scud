import { Datagrid, DateField, List, TextField } from 'react-admin';
import RestoreButton from '../UI/RestoreButton';
import { useUser } from '../../context/UserContext';
import { PERMISSIONS_MODULES } from '../../permissions';

export const UsersTrash = () => {
  const { checkPermission } = useUser();
  const canDelete = checkPermission(PERMISSIONS_MODULES['Пользователи'].delete);

  return (
    <List>
      <Datagrid isRowSelectable={() => canDelete}>
        <TextField source="telegramId" label="ID Пользователя" />
        <TextField source="firstName" label="Имя" />
        <TextField source="lastName" label="Фамилия" />
        <TextField source="username" label="username" />
        <DateField source="createdAt" label="Дата" />
        <TextField source="id" />
        {canDelete && <RestoreButton resource="users" />}
      </Datagrid>
    </List>
  );
};
