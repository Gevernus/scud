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
      <BooleanField source="status" label="Активация регестрации" />
    </Datagrid>
  </List>
);

export const RegistrationEdit = () => (
  <Edit>
    <SimpleForm>
      <BooleanInput source="status" label="Активация регестрации" />
      <PasswordInput source="pass" label="Пароль" />
    </SimpleForm>
  </Edit>
);
