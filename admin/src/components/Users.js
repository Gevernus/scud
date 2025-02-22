import {
  List,
  Edit,
  Create,
  Datagrid,
  DateField,
  TextField,
  SimpleForm,
  TextInput,
  EmailField,
  Toolbar,
  SaveButton,
  Filter,
  SelectInput,
  DateInput,
  Show,
  SimpleShowLayout,
  BooleanField,
  BooleanInput,
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
        // { id: null, name: 'Без фильтра' },
        { id: 'id', name: 'ID Пользователя' },
        { id: 'telegramId', name: 'Telegram ID' },
        { id: 'firstName', name: 'Имя' },
        { id: 'lastName', name: 'Фамилия' },
        { id: 'username', name: 'Username' },
        { id: 'phone', name: 'Телефон' },
        { id: 'email', name: 'E-mail' },
        { id: 'company', name: 'Компания' },
        { id: 'division', name: 'Подразделение' },
        { id: 'position', name: 'Должность' },
        { id: 'deviceId', name: 'ID приложения' },
        { id: 'nfcId', name: 'ID NFC' },
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

export const UserList = () => {
  const { checkPermission } = useUser();
  const canDelete = checkPermission(PERMISSIONS_MODULES['Пользователи'].delete);

  return (
    <List filters={<UserFilter />}>
      <Datagrid rowClick="edit" isRowSelectable={() => canDelete}>
        <TextField source="id" label="ID Пользователя" />
        <TextField source="telegramId" label="Telegram ID" />
        <TextField source="firstName" label="Имя" />
        <TextField source="lastName" label="Фамилия" />
        <TextField source="middleName" label="Очество" />
        <TextField source="username" label="username" />
        <TextField source="phone" label="Телефон" />
        <EmailField source="email" label="E-mail" />
        <TextField source="company" label="Компания" />
        <TextField source="division" label="Подразделение" />
        <TextField source="position" label="Должность" />
        <TextField source="deviceId" label="ID Мобильного приложения" />
        <TextField source="nfcId" label="ID NFC метки" />
        <BooleanField source="unsafe" label="Подозрительный" />
        <PermissionsField source="permissions" label="Разрешения" />
        <DateField source="createdAt" label="Дата создания" showTime />
        <DateField source="updatedAt" label="Дата обновления" showTime />
      </Datagrid>
    </List>
  );
};

export const UserEdit = () => (
  <Edit>
    <SimpleForm toolbar={<CustomToolbar />}>
      <TextInput
        source="telegramId"
        label="Telegram ID"
        validate={[required('Поле обязательно для заполнения')]}
      />
      <TextInput source="firstName" label="Имя" />
      <TextInput source="lastName" label="Фамилия" />
      <TextInput source="middleName" label="Очество" />
      <TextInput
        source="username"
        validate={[required('Поле обязательно для заполнения')]}
      />
      <TextInput source="phone" label="Телефон" />
      <TextInput source="email" label="E-mail" />
      <TextInput source="company" label="Компания" />
      <TextInput source="division" label="Подразделение" />
      <TextInput source="position" label="Должность" />
      <TextInput source="deviceId" label="ID Мобильного приложения" />
      <TextInput source="nfcId" label="ID NFC метки" />
      {/* <BooleanInput source="unsafe" label="Подозрительный" /> */}
      <PermissionsInput source="permissions" />
    </SimpleForm>
  </Edit>
);

export const UserCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput
        source="telegramId"
        label="Telegram ID"
        validate={[required('Поле обязательно для заполнения')]}
      />
      <TextInput source="firstName" label="Имя" />
      <TextInput source="lastName" label="Фамилия" />
      <TextInput source="middleName" label="Очество" />
      <TextInput
        source="username"
        validate={[required('Поле обязательно для заполнения')]}
      />
      <TextInput source="phone" label="Телефон" />
      <TextInput source="email" label="E-mail" />
      <TextInput source="company" label="Компания" />
      <TextInput source="division" label="Подразделение" />
      <TextInput source="position" label="Должность" />
      <TextInput source="deviceId" label="ID Мобильного приложения" />
      <TextInput source="nfcId" label="ID NFC метки" />
      <PermissionsInput source="permissions" />
    </SimpleForm>
  </Create>
);

export const UserShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" label="ID Пользователя" />
      <TextField source="telegramId" label="Telegram ID" />
      <TextField source="firstName" label="Имя" />
      <TextField source="lastName" label="Фамилия" />
      <TextField source="middleName" label="Очество" />
      <TextField source="username" label="username" />
      <TextField source="phone" label="Телефон" />
      <EmailField source="email" label="E-mail" />
      <TextField source="company" label="Компания" />
      <TextField source="division" label="Подразделение" />
      <TextField source="position" label="Должность" />
    </SimpleShowLayout>
  </Show>
);
