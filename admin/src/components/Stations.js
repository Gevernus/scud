import {
  List,
  Datagrid,
  TextField,
  DeleteButton,
  Create,
  SimpleForm,
  TextInput,
  Edit,
  Toolbar,
  SaveButton,
  DateField,
  Filter,
  SelectInput,
  DateInput,
  ReferenceArrayField,
  SingleFieldList,
  ChipField,
  ReferenceArrayInput,
  AutocompleteArrayInput,
} from 'react-admin';
import { required } from 'react-admin';
import { useUser } from '../context/UserContext';
import { PERMISSIONS_MODULES } from '../permissions';

const CustomToolbar = () => (
  <Toolbar>
    <SaveButton />
  </Toolbar>
);

const StationFilter = (props) => (
  <Filter {...props}>
    {/* Selecting a column to search for */}
    <SelectInput
      label="Поле для поиска"
      source="searchField"
      choices={[
        { id: null, name: 'Без фильтра' },
        { id: 'deviceId', name: 'ID станции' },
        { id: 'username', name: 'Название' },
        { id: 'location', name: 'location' },
        { id: 'nfs', name: 'NFS' },
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

export const StationsList = () => {
  const { checkPermission } = useUser();
  const canDelete = checkPermission(PERMISSIONS_MODULES['Станции'].delete);

  return (
    <List filters={<StationFilter />}>
      <Datagrid rowClick="edit"  isRowSelectable={() => canDelete}>
        <TextField source="deviceId" label="ID станции" />
        <TextField source="username" label="Название" />
        <TextField source="location" label="location" />
        <TextField source="nfs" label="NFS" />
        <ReferenceArrayField
          label="Пользователи"
          source="users"
          reference="users"
        >
          <SingleFieldList linkType="show">
            <ChipField source="username" />
          </SingleFieldList>
        </ReferenceArrayField>
        <DateField source="createdAt" label="дата" />
        {canDelete && <DeleteButton />}
      </Datagrid>
    </List>
  );
};

export const StationsEdit = () => (
  <Edit>
    <SimpleForm toolbar={<CustomToolbar />}>
      <TextInput
        source="deviceId"
        label="ID станции"
        validate={[required('Поле обязательно для заполнения')]}
      />
      <TextInput
        source="username"
        label="Название"
        validate={[required('Поле обязательно для заполнения')]}
      />
      <TextInput
        source="password"
        label="Пароль"
        validate={[required('Поле обязательно для заполнения')]}
      />
      <TextInput source="location" label="NFS" />
      <TextInput source="nfs" label="location" />
      <ReferenceArrayInput label="Users" source="users" reference="users">
        <AutocompleteArrayInput optionText="username" />
      </ReferenceArrayInput>
    </SimpleForm>
  </Edit>
);

export const StationsCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput
        source="deviceId"
        label="ID станции"
        validate={[required('Поле обязательно для заполнения')]}
      />
      <TextInput
        source="username"
        label="Название"
        validate={[required('Поле обязательно для заполнения')]}
      />
      <TextInput
        source="password"
        label="Пароль"
        validate={[required('Поле обязательно для заполнения')]}
      />
      <TextInput source="location" label="location" />
      <TextInput source="nfs" label="NFS" />
      <ReferenceArrayInput label="Users" source="users" reference="users">
        <AutocompleteArrayInput optionText="username" />
      </ReferenceArrayInput>
    </SimpleForm>
  </Create>
);
