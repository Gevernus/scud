import {
    Datagrid,
    DateField,
    List,
    TextField,
} from 'react-admin';
import RestoreButton from '../UI/RestoreButton';

export const UsersTrash = () => (
    <List>
        <Datagrid>
            <TextField source="telegramId" label="ID Пользователя" />
            <TextField source="firstName" label="Имя" />
            <TextField source="lastName" label="Фамилия" />
            <TextField source="username" label="username" />
            <DateField source="createdAt" label="Дата" />
            <TextField source="id" />
            <RestoreButton resource="users"/>
            {/* <BooleanField source="deleted" /> */}
        </Datagrid>
    </List>
);
