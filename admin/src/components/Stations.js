import {
  List,
  Datagrid,
  TextField,
  DeleteButton,
  Create,
  SimpleForm,
  TextInput,
  Edit,
  Toolbar,
  SaveButton,
  DateField,
} from 'react-admin';
import { required } from 'react-admin';
import { useUser } from '../context/UserContext';
import { PERMISSIONS_MODULES } from '../permissions';

const CustomToolbar = () => (
  <Toolbar>
    <SaveButton />
  </Toolbar>
);

export const StationsList = () => {
  const { checkPermission } = useUser();
  const canDelete = checkPermission(PERMISSIONS_MODULES['Станции'].delete);

  return (
    <List rowClick="edit">
      <Datagrid isRowSelectable={() => canDelete}>
        <TextField source="deviceId" label="ID станции" />
        <TextField source="username" label="Название" />
        <TextField source="location" label="location" />
        <TextField source="nfs" label="NFS" />
        <DateField source="createdAt" label="дата" />
        {canDelete && <DeleteButton />}
      </Datagrid>
    </List>
  );
};

export const StationsEdit = () => (
  <Edit>
    <SimpleForm toolbar={<CustomToolbar />}>
      <TextInput
        source="username"
        label="Название"
        validate={[required('Поле обязательно для заполнения')]}
      />
      <TextInput
        source="password"
        label="Пароль"
        validate={[required('Поле обязательно для заполнения')]}
      />
      <TextInput source="location" label="NFS" />
      <TextInput source="nfs" label="location" />
    </SimpleForm>
  </Edit>
);

export const StationsCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput
        source="username"
        label="Название"
        validate={[required('Поле обязательно для заполнения')]}
      />
      <TextInput
        source="password"
        label="Пароль"
        validate={[required('Поле обязательно для заполнения')]}
      />
      <TextInput source="location" label="location" />
      <TextInput source="nfs" label="NFS" />
    </SimpleForm>
  </Create>
);
