import {
  Datagrid,
  DateField,
  List,
  TextField,
  DeleteButton,
} from 'react-admin';
import { useUser } from '../context/UserContext';
import { PERMISSIONS_MODULES } from '../permissions';

export const EventList = () => {
  const { checkPermission } = useUser();
  const canDelete = checkPermission(PERMISSIONS_MODULES['Журнал событий'].delete);
  
  return (
    <List >
      <Datagrid isRowSelectable={() => canDelete}>
        <TextField source="eventType" label="Тип события" />
        <TextField source="description" label="Описание" />
        <DateField source="createdAt" label="Дата" showTime />
        {(canDelete) && (
          <DeleteButton />
        )}
      </Datagrid>
    </List>
  );
};
