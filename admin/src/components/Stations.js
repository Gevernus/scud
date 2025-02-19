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
        // { id: null, name: 'Без фильтра' },
        { id: 'deviceId', name: 'ID станции' },
        { id: 'username', name: 'Название' },
        { id: 'companyPoints', name: 'Компания Точки' },
        { id: 'typePoints', name: 'Тип' },
        { id: 'statusPoints', name: 'Статус' },
        { id: 'location', name: 'Геопозиция Точки' },
        { id: 'nfc', name: 'NFC' },
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

export const StationsList = () => {
  const { checkPermission } = useUser();
  const canDelete = checkPermission(PERMISSIONS_MODULES['Станции'].delete);

  return (
    <List filters={<StationFilter />}>
      <Datagrid rowClick="edit" isRowSelectable={() => canDelete}>
        <TextField source="deviceId" label="ID станции" />
        <TextField source="username" label="Название Точки геопозиции" />
        <TextField source="companyPoints" label="Компания Точки геопозиции" />
        <TextField source="typePoints" label="Тип (APM или Точка геопозиции)" />
        <TextField
          source="statusPoints"
          label="Статус (Обслуживается, Не обслуживается, в архиве)"
        />
        <TextField source="location" label="Геопозиция Точки" />
        <ReferenceArrayField
          label="Разрешенные пользователи"
          source="users"
          reference="users"
        >
          <SingleFieldList linkType="show">
            <ChipField source="username" />
          </SingleFieldList>
        </ReferenceArrayField>
        <DateField source="createdAt" label="Дата создания" showTime />
        <DateField source="updatedAt" label="Дата обновления" showTime />
        <TextField source="nfc" label="ID Метки NFC" />
        <TextField source="resultHashFun" label="Результат хэш-функции" />
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
        label="Название Точки геопозиции"
        validate={[required('Поле обязательно для заполнения')]}
      />
      <TextInput
        source="password"
        label="Пароль"
        validate={[required('Поле обязательно для заполнения')]}
      />
      <TextInput source="companyPoints" label="Компания Точки геопозиции" />
      <TextInput source="typePoints" label="Тип (APM или Точка геопозиции)" />
      <TextInput
        source="statusPoints"
        label="Статус (Обслуживается, Не обслуживается, в архиве)"
      />
      <TextInput source="location" label="Геопозиция Точки" />
      <ReferenceArrayInput label="Users" source="users" reference="users">
        <AutocompleteArrayInput optionText="username" />
      </ReferenceArrayInput>
      <TextInput source="nfc" label="ID Метки NFC" />
      <TextInput source="resultHashFun" label="Результат хэш-функции" />
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
        label="Название Точки геопозиции"
        validate={[required('Поле обязательно для заполнения')]}
      />
      <TextInput
        source="password"
        label="Пароль"
        validate={[required('Поле обязательно для заполнения')]}
      />
      <TextInput source="companyPoints" label="Компания Точки геопозиции" />
      <TextInput source="typePoints" label="Тип (APM или Точка геопозиции)" />
      <TextInput
        source="statusPoints"
        label="Статус (Обслуживается, Не обслуживается, в архиве)"
      />
      <TextInput source="location" label="Геопозиция Точки" />
      <ReferenceArrayInput label="Users" source="users" reference="users">
        <AutocompleteArrayInput optionText="username" />
      </ReferenceArrayInput>
      <TextInput source="nfc" label="ID Метки NFC" />
      <TextInput source="resultHashFun" label="Результат хэш-функции" />
    </SimpleForm>
  </Create>
);
