import { List, Datagrid, TextField } from 'react-admin';
import RestoreButton from '../UI/RestoreButton';
import { useUser } from '../../context/UserContext';
import { PERMISSIONS_MODULES } from '../../permissions';

export const StationsTrash = () => {
  const { checkPermission } = useUser();
  const canDelete = checkPermission(PERMISSIONS_MODULES['Станции'].delete);

  return (
    <List>
      <Datagrid isRowSelectable={() => canDelete}>
        <TextField source="name" label="Название" />
        <TextField source="nfs" label="NFS" />
        <TextField source="ip" label="IP" />
        {canDelete && <RestoreButton resource="stations" />}       
      </Datagrid>
    </List>
  );
};
