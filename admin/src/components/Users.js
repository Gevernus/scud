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
  ArrayInput,
  SimpleFormIterator,
  ReferenceArrayInput,
  AutocompleteArrayInput,
  ReferenceArrayField,
  SingleFieldList,
  ChipField,
  ReferenceManyField,
  CreateButton
} from 'react-admin';
import { required } from 'react-admin';
import PermissionsInput from './UI/PermissionsInput';
import PermissionsField from './UI/PermissionsField';
import DeviceIdField from './UI/DeviceIdField';
import { useUser } from '../context/UserContext';
import { PERMISSIONS_MODULES } from '../permissions';
import ExportToExcelButton from './UI/ExportToExcelButton';

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
        { id: 'id', name: 'ID Пользователя' },
        { id: 'telegramId', name: 'Telegram ID' },
        { id: 'firstName', name: 'Имя' },
        { id: 'lastName', name: 'Фамилия' },
        { id: 'username', name: 'Username' },
        { id: 'phone', name: 'Телефон' },
        { id: 'email', name: 'E-mail' },
        { id: 'division', name: 'Подразделение' },
        { id: 'position', name: 'Должность' },
        { id: 'stations', name: 'Станции' }
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

    {/* Filter by specific dates */}
    <DateInput label="С даты" source="startDate" />
    <DateInput label="По дату" source="endDate" />
  </Filter>
);

export const UserList = () => {
  const { checkPermission } = useUser();
  const canDelete = checkPermission(PERMISSIONS_MODULES['Пользователи'].delete);
  const canCreate = checkPermission(PERMISSIONS_MODULES['Пользователи'].create);

  return (
    <List 
      filters={<UserFilter />} 
      sort={{ field: "createdAt", order: "DESC" }} 
      actions={(
        <div style={{display:"flex"}}>
          {(canCreate) && (<CreateButton />)}
          <ExportToExcelButton 
            resource="users" 
            referenceFields={{company: { reference: "counterparts", replaceField: "fullName" }}} 
          />
        </div>
      )}
    >
      <Datagrid rowClick="edit" isRowSelectable={() => canDelete}>
        <TextField source="id" label="ID Пользователя" />
        <TextField source="telegramId" label="Telegram ID" />
        <TextField source="firstName" label="Имя" />
        <TextField source="lastName" label="Фамилия" />
        <TextField source="middleName" label="Очество" />
        <TextField source="username" label="username" />
        <TextField source="phone" label="Телефон" />
        <EmailField source="email" label="E-mail" />
        <ReferenceArrayField
          label="Компания"
          source="company"
          reference="counterparts"
        >
          <SingleFieldList linkType="show">
            <ChipField source="fullName" />
          </SingleFieldList>
        </ReferenceArrayField>
        <TextField source="division" label="Подразделение" />
        <TextField source="position" label="Должность" />
        <DeviceIdField source="deviceId" label="ID устройств" />     
        <BooleanField source="unsafe" label="Заблокированный" />
        <ReferenceManyField
          label="Разрешён на станциях"
          reference="stations"
          target="users"
          source="id"
        >
          <SingleFieldList linkType="show">
            <ChipField source="name" />
          </SingleFieldList>
        </ReferenceManyField>
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
      <ReferenceArrayInput label="Компания" source="company" reference="counterparts">
        <AutocompleteArrayInput optionText="fullName" />
      </ReferenceArrayInput>
      <TextInput source="division" label="Подразделение" />
      <TextInput source="position" label="Должность" />
      <ArrayInput source="deviceId" label="ID устройств">
        <SimpleFormIterator>
          <TextInput source="" label="Устройство" />
        </SimpleFormIterator>
      </ArrayInput>
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
      <ReferenceArrayInput label="Компания" source="company" reference="counterparts">
        <AutocompleteArrayInput optionText="fullName" />
      </ReferenceArrayInput>
      <TextInput source="division" label="Подразделение" />
      <TextInput source="position" label="Должность" />
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
      <ReferenceArrayField
          label="Компания"
          source="company"
          reference="counterparts"
        >
          <SingleFieldList linkType="show">
            <ChipField source="fullName" />
          </SingleFieldList>
        </ReferenceArrayField>
      <TextField source="division" label="Подразделение" />
      <TextField source="position" label="Должность" />
      <ReferenceManyField
        label="Разрешён на станциях"
        reference="stations"
        target="users"
      >
        <SingleFieldList linkType="show">
          <ChipField source="name" />
        </SingleFieldList>
      </ReferenceManyField>
    </SimpleShowLayout>
  </Show>
);
