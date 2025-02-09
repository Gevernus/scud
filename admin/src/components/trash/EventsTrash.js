import { Datagrid, DateField, List, TextField } from 'react-admin';
import RestoreButton from '../UI/RestoreButton';
import { useUser } from '../../context/UserContext';
import { PERMISSIONS_MODULES } from '../../permissions';

export const EventsTrash = () => {
  const { checkPermission } = useUser();
  const canDelete = checkPermission(
    PERMISSIONS_MODULES['Журнал событий'].delete
  );

  return (
    <List>
      <Datagrid isRowSelectable={() => canDelete}>
        <TextField source="eventType" label="Тип события" />
        <TextField source="description" label="Описание" />
        <DateField source="createdAt" label="Дата" showTime />
        {canDelete && <RestoreButton resource="events" />}    
      </Datagrid>
    </List>
  );
};
