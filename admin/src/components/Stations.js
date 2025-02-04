import {
    List,
    Datagrid,
    TextField,
    DeleteButton,
    Create,
    SimpleForm,
    TextInput,
    Edit,
} from 'react-admin';
import { required } from 'react-admin';

export const StationsList = () => (
    <List rowClick="edit">
        <Datagrid>
            <TextField source="name" label="Название" />
            <TextField source="nfs" label="NFS" />
            <TextField source="ip" label="IP" />
            <DeleteButton />
        </Datagrid>
    </List>
);

export const StationsEdit = () => (
    <Edit>
        <SimpleForm>
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
