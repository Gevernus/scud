import {
  List,
  Datagrid,
  TextField,
  BooleanField,
  Edit,
  SimpleForm,
  BooleanInput,
  PasswordInput,
} from 'react-admin';

export const RegistrationList = () => (
  <List>
    <Datagrid rowClick="edit" isRowSelectable={() => false}>
      <TextField source="pass" label="Пароль" />
      <BooleanField source="status" label="Активация регистрации" />
    </Datagrid>
  </List>
);

export const RegistrationEdit = () => (
  <Edit>
    <SimpleForm>
      <BooleanInput source="status" label="Активация регистрации" />
      <PasswordInput source="pass" label="Пароль" />
    </SimpleForm>
  </Edit>
);
