import {
    List,
    Datagrid,
    TextField,
} from 'react-admin';
import RestoreButton from '../UI/RestoreButton';

export const StationsTrash = () => (
    <List>
        <Datagrid>
            <TextField source="name" label="Название" />
            <TextField source="nfs" label="NFS" />
            <TextField source="ip" label="IP" />
            <RestoreButton resource="stations"/>
        </Datagrid>
    </List>
);