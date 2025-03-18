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
import AttemptedUsersInput from './UI/AttemptedUsersInput';

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
        { id: 'name', name: 'Название' },
        { id: 'company', name: 'Компания' },
        { id: 'location', name: 'Геопозиция' },
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
    <List filters={<StationFilter />} sort={{ field: "createdAt", order: "DESC" }}>
      <Datagrid rowClick="edit" isRowSelectable={() => canDelete}>
        <TextField source="deviceId" label="ID станции" />
        <TextField source="name" label="Название" />
        <TextField source="company" label="Компания" />
        <TextField source="location" label="Геопозиция" />
        <TextField source="loginMode" label="Способ входа" />
        <TextField source="nfcMode" label="Режим работы NFC" />
        <ReferenceArrayField
          label="Разрешенные пользователи"
          source="users"
          reference="users"
        >
          <SingleFieldList linkType="show">
            <ChipField source="username" />
          </SingleFieldList>
        </ReferenceArrayField>
        <TextField source="description" label="Описание" />       
        <DateField source="createdAt" label="Дата создания" showTime />
        <DateField source="updatedAt" label="Дата обновления" showTime />
        <ReferenceArrayField
          label="NFC"
          source="nfc"
          reference="nfc"
        >
          <SingleFieldList linkType="show">
            <ChipField source="nfcName" />
          </SingleFieldList>
        </ReferenceArrayField>
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
        source="name"
        label="Имя станции"
        validate={[required('Поле обязательно для заполнения')]}
      />
      {/* <TextInput
        source="username"
        label="Имя пользователя"
        validate={[required('Поле обязательно для заполнения')]}
      /> */}
      {/* <TextInput
        source="password"
        label="Пароль"
        validate={[required('Поле обязательно для заполнения')]}
      /> */}
      <TextInput source="company" label="Компания" />
      <TextInput source="location" label="Геопозиция" />
      <SelectInput
        source="loginMode"
        label="Способ входа"
        choices={[
          { id: "QR", name: "Вход по QR" },
          { id: "PASSWORD", name: "Вход по паролю" },
        ]}
        validate={[required('Выберите режим работы')]}
      />
      <SelectInput
        source="nfcMode"
        label="Режим работы NFC"
        choices={[
          { id: "always", name: "Всегда сканировать NFC" },
          { id: "geoMismatch", name: "Только при несовпадении геопозиции" },
          { id: "never", name: "Никогда" },
        ]}
        validate={[required('Выберите режим работы NFC')]}
      />
      <AttemptedUsersInput label="Выберите разрешённых пользователей" source="users" />
      <ReferenceArrayInput 
        source="nfc" 
        label="ID Метки NFC" 
        reference="nfc" 
        filter={{ attached: false }}> 
        <AutocompleteArrayInput optionText="nfcName" />
      </ReferenceArrayInput>
      <TextInput source="description" label="Описание" /> 
    </SimpleForm>
  </Edit>
);

// export const StationsCreate = () => (
//   <Create>
//     <SimpleForm>
//       <TextInput
//         source="deviceId"
//         label="ID станции"
//         validate={[required('Поле обязательно для заполнения')]}
//       />
//       <TextInput
//         source="name"
//         label="Имя станции"
//         validate={[required('Поле обязательно для заполнения')]}
//       />
//       <TextInput
//         source="username"
//         label="Имя пользователя"
//         validate={[required('Поле обязательно для заполнения')]}
//       />
//       <TextInput
//         source="password"
//         label="Пароль"
//         validate={[required('Поле обязательно для заполнения')]}
//       />
//       <TextInput source="location" label="Геопозиция" />
//       <SelectInput
//         source="nfcMode"
//         label="Режим работы NFC"
//         choices={[
//           { id: "always", name: "Всегда сканировать NFC" },
//           { id: "geoMismatch", name: "Только при несовпадении геопозиции" },
//           { id: "never", name: "Никогда" },
//         ]}
//         validate={[required('Выберите режим работы NFC')]}
//       />
//       <ReferenceArrayInput source="nfc" label="ID Метки NFC" reference="nfc">
//         <AutocompleteArrayInput optionText="nfcName" />
//       </ReferenceArrayInput>
//     </SimpleForm>
//   </Create>
// );
