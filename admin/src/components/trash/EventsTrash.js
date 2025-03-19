import {
  Datagrid,
  DateField,
  List,
  TextField,
  Filter,
  SelectInput,
  DateInput,
} from 'react-admin';
import RestoreButton from '../UI/RestoreButton';
import { useUser } from '../../context/UserContext';
import { PERMISSIONS_MODULES } from '../../permissions';
import ExportToExcelButton from '../UI/ExportToExcelButton';

const EventFilter = (props) => (
  <Filter {...props}>
    {/* Filter by event type */}
    <SelectInput
      label="Тип события"
      source="eventType"
      choices={[
        { id: '', name: 'Без фильтра' },
        { id: 'login_attempt', name: 'Вход в приложение' },
        { id: 'soft_delete', name: 'Перенесли в корзину' },
        { id: 'full_delete', name: 'Полное удаление' },
        // { id: 'incident', name: 'Инцидент' },
      ]}
      alwaysOn
    />

    {/* Filter by period */}
    <SelectInput
      label="Период"
      source="dateRange"
      choices={[
        { id: '', name: 'Без фильтра' },
        { id: 'today', name: 'Сегодня' },
        { id: 'week', name: 'Эта неделя' },
        { id: 'month', name: 'Этот месяц' },
        { id: 'custom', name: 'Произвольный' },
      ]}
      alwaysOn
    />

    {/* Filter by specific dates */}
    <DateInput label="С даты" source="startDate" />
    <DateInput label="По дату" source="endDate" />
  </Filter>
);

export const EventsTrash = () => {
  const { checkPermission } = useUser();
  const canDelete = checkPermission(
    PERMISSIONS_MODULES['Журнал событий'].delete
  );

  return (
    <List filters={<EventFilter />} actions={<ExportToExcelButton resource="eventsTrash" />}>
      <Datagrid isRowSelectable={() => canDelete}>
        <TextField source="eventType" label="Тип события" />
        <TextField source="description" label="Описание" />
        <DateField source="createdAt" label="Дата" showTime />
        {canDelete && <RestoreButton resource="events" />}
      </Datagrid>
    </List>
  );
};
