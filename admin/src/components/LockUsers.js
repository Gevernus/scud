import {
  List,
  Datagrid,
  TextField,
  DateField,
  DeleteButton,
  Filter,
  SelectInput,
  TextInput,
  DateInput,
} from 'react-admin';
import { useUser } from '../context/UserContext';
import { PERMISSIONS_MODULES } from '../permissions';
import ExportToExcelButton from './UI/ExportToExcelButton';

const LockUsersFilter = (props) => (
  <Filter {...props}>
    {/* Selecting a column to search for */}
    <SelectInput
      label="Поле для поиска"
      source="searchField"
      choices={[
        // { id: null, name: 'Без фильтра' },
        { id: 'telegramId', name: 'Telegram ID' },
        { id: 'firstName', name: 'Имя' },
        { id: 'lastName', name: 'Фамилия' },
        { id: 'username', name: 'username' },
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
        // { id: null, name: 'Без фильтра' },
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

export const LockUsersList = () => {
  const { checkPermission } = useUser();
  const canDelete = checkPermission(PERMISSIONS_MODULES['Регистрация'].edit);

  return (
    <List filters={<LockUsersFilter />} sort={{ field: "createdAt", order: "DESC" }} actions={<ExportToExcelButton resource="lockUsers" />}>
      <Datagrid isRowSelectable={() => canDelete}>
        <TextField source="telegramId" label="Telegram ID" />
        <TextField source="firstName" label="Имя" />
        <TextField source="lastName" label="Фамилия" />
        <TextField source="username" label="username" />
        <DateField source="createdAt" label="Дата блокировки" showTime />
        {canDelete ? <DeleteButton label="Разблокировать" /> : null}
      </Datagrid>
    </List>
  );
};
