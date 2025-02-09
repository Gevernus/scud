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
  SaveButton
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
        <TextField source="name" label="Название" />
        <TextField source="nfs" label="NFS" />
        <TextField source="ip" label="IP" />
        {canDelete && <DeleteButton />}
      </Datagrid>
    </List>
  );
};

export const StationsEdit = () => (
  <Edit >
    <SimpleForm toolbar={<CustomToolbar />}>
      <TextInput source="name" label="Название" />
      <TextInput source="nfs" label="NFS" />
      <TextInput source="ip" label="IP" />
    </SimpleForm>
  </Edit>
);

export const StationsCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput
        source="name"
        label="Название"
        validate={[required('Поле обязательно для заполнения')]}
      />
      <TextInput source="nfs" label="NFS" />
      <TextInput source="ip" label="IP" />
    </SimpleForm>
  </Create>
);
