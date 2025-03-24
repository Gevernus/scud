import {
  Datagrid,
  DateField,
  List,
  TextField,
  DeleteButton,
  Filter,
  SelectInput,
  DateInput,
  TextInput
} from 'react-admin';
import { useUser } from '../context/UserContext';
import { PERMISSIONS_MODULES } from '../permissions';
import ExportToExcelButton from './UI/ExportToExcelButton';


const EventFilter = (props) => (
  <Filter {...props} defaultValues={{ eventType: '', dateRange: '', startDate: '', endDate: '' }}>
    {/* Filter by event type */}
    <SelectInput
      label="Тип события"
      source="eventType"
      choices={[
        { id: 'login_attempt', name: 'Вход в приложение' },
        { id: 'soft_delete', name: 'Перенесли в корзину' },
        { id: 'full_delete', name: 'Полное удаление' },
        { id: 'incident', name: 'Инцидент' },
        { id: 'registration', name: 'Регистрация' },
        { id: 'authorization', name: 'Авторизация' },
        { id: 'NFC', name: 'NFC' },
      ]}
      alwaysOn
    />

    {/* Selecting a column to search for */}
    <SelectInput
      label="Поле для поиска"
      source="searchField"
      choices={[
        { id: 'userName', name: 'Пользователь' },
        { id: 'stationName', name: 'Название станции' },
        { id: 'nfcName', name: 'Название Nfc' },
        { id: 'userId', name: 'ID пользователя' },
        { id: 'stationDeviceId', name: 'ID станции' },
        { id: 'nfcGuid', name: 'ID Nfc' },
        
      ]}
      alwaysOn
    />

    {/* Full-text search */}
    <TextInput label="Значение" source="q" resettable={true} alwaysOn />

    {/* Filter by period */}
    <SelectInput
      label="Период"
      source="dateRange"
      choices={[
        { id: 'today', name: 'Сегодня' },
        { id: 'week', name: 'Эта неделя' },
        { id: 'month', name: 'Этот месяц' },
        { id: 'custom', name: 'Произвольный' },
      ]}
      alwaysOn
    />

    {/* Filter by specific dates  */}
    <DateInput label="С даты" source="startDate" />
    <DateInput label="По дату" source="endDate" />
  </Filter>
);

export const EventList = () => {
  const { checkPermission } = useUser();
  const canDelete = checkPermission(PERMISSIONS_MODULES['Журнал событий'].delete);
  
  return (
    <List filters={<EventFilter />} sort={{ field: "createdAt", order: "DESC" }} actions={<ExportToExcelButton resource="events" />}>
      <Datagrid isRowSelectable={() => canDelete}>
        <TextField source="eventType" label="Тип события" />
        <TextField source="description" label="Описание" />
        <TextField source="userName" label="Пользователь" />
        <TextField source="stationName" label="Название станции" />
        <TextField source="nfcName" label="Название Nfc" />
        <TextField source="userId" label="ID пользователя" />
        <TextField source="stationDeviceId" label="ID станции" />
        <TextField source="nfcGuid" label="ID Nfc" />
        <DateField source="createdAt" label="Дата" showTime />
        {(canDelete) && (
          <DeleteButton />
        )}
      </Datagrid>
    </List>
  );
};
