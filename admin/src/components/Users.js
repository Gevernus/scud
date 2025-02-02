import {
    List,
    Edit,
    Create,
    Datagrid,
    DateField,
    TextField,
    SimpleForm,
    TextInput,
} from 'react-admin';
import { required } from 'react-admin';

export const UserList = () => (
    <List>
        <Datagrid rowClick="edit">
            {/* <TextField source="id" /> */}
            <TextField source="telegramId" label="ID Пользователя" />
            <TextField source="firstName" label="Имя" />
            <TextField source="lastName" label="Фамилия" />
            <TextField source="username" label="username" />
            <DateField source="createdAt" label="дата" />
        </Datagrid>
    </List>
);

export const UserEdit = () => (
    <Edit>
        <SimpleForm>
            {/* <TextField source="id" />  */}
            <TextInput source="telegramId" />
            <TextInput source="firstName" />
            <TextInput source="lastName" />
            <TextInput source="username" />
        </SimpleForm>
    </Edit>
);

export const UserCreate = () => (
    <Create>
        <SimpleForm>
            <TextInput
                source="telegramId"
                label="ID Пользователя"
                validate={[required('Поле обязательно для заполнения')]}
            />
            <TextInput source="firstName" label="Имя" />
            <TextInput source="lastName" label="Фамилия" />
            <TextInput source="username" label="username" />
        </SimpleForm>
    </Create>
);
