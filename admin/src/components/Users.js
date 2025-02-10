import {
  List,
  Edit,
  Create,
  Datagrid,
  DateField,
  TextField,
  SimpleForm,
  TextInput,
  Toolbar,
  SaveButton,
  Filter,
  SelectInput,
  DateInput,
} from 'react-admin';
import { required } from 'react-admin';
import PermissionsInput from './UI/PermissionsInput';
import PermissionsField from './UI/PermissionsField';
import { useUser } from '../context/UserContext';
import { PERMISSIONS_MODULES } from '../permissions';

const CustomToolbar = () => (
  <Toolbar>
    <SaveButton />
  </Toolbar>
);


const UserFilter = (props) => (
  <Filter {...props}>
    {/* Selecting a column to search for */}
    <SelectInput
      label="Поле для поиска"
      source="searchField"
      choices={[
        { id: null, name: 'Без фильтра' }, 
        { id: 'telegramId', name: 'ID Пользователя' },
        { id: 'firstName', name: 'Имя' },
        { id: 'lastName', name: 'Фамилия' },
        { id: 'username', name: 'Username' },
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
        { id: null, name: 'Без фильтра' }, 
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

export const UserList = () => {
  const { checkPermission } = useUser();
  const canDelete = checkPermission(PERMISSIONS_MODULES['Пользователи'].delete);

  return (
    <List filters={<UserFilter />}>
      <Datagrid rowClick="edit" isRowSelectable={() => canDelete}>
        {/* <TextField source="id" /> */}
        <TextField source="telegramId" label="ID Пользователя" />
        <TextField source="firstName" label="Имя" />
        <TextField source="lastName" label="Фамилия" />
        <TextField source="username" label="username" />
        <DateField source="createdAt" label="дата" />
        <PermissionsField source="permissions" label="Разрешения" />
      </Datagrid>
    </List>
  );
};

export const UserEdit = () => (
  <Edit>
    <SimpleForm toolbar={<CustomToolbar />}>
      <TextInput
        source="telegramId"
        validate={[required('Поле обязательно для заполнения')]}
      />
      <TextInput source="firstName" />
      <TextInput source="lastName" />
      <TextInput source="username" />
      <PermissionsInput source="permissions" />
    </SimpleForm>
  </Edit>
);

export const UserCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput
        source="telegramId"
        label="ID Пользователя"
        validate={[required('Поле обязательно для заполнения')]}
      />
      <TextInput source="firstName" label="Имя" />
      <TextInput source="lastName" label="Фамилия" />
      <TextInput source="username" label="username" />
      <PermissionsInput source="permissions" />
    </SimpleForm>
  </Create>
);
