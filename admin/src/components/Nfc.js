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
  SimpleForm,
  Edit,
  Toolbar,
  SaveButton,
  required,
  Show,
  SimpleShowLayout,
  Create,
  CreateButton,
  BooleanField,
  ReferenceField,
  FunctionField
} from 'react-admin';
import { useUser } from '../context/UserContext';
import { PERMISSIONS_MODULES } from '../permissions';
import ClearLocationButton from './UI/ClearLocationButton';
import AttachedStationField from './UI/AttachedStationField';
import ExportToExcelButton from './UI/ExportToExcelButton';

const CustomToolbar = () => (
  <Toolbar>
    <SaveButton />
  </Toolbar>
);

const NfcFilter = (props) => (
  <Filter {...props}>
    {/* Selecting a column to search for */}
    <SelectInput
      label="Поле для поиска"
      source="searchField"
      choices={[
        // { id: null, name: 'Без фильтра' },
        { id: 'guid', name: 'NFC идентификатор' },
        { id: 'nfcName', name: 'Название' },
        { id: 'attachedStation', name: 'Станция' },
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

export const NfcList = () => {
  const { checkPermission } = useUser();
  const canDelete = checkPermission(PERMISSIONS_MODULES['Метки NFC'].edit);
  const canCreate = checkPermission(PERMISSIONS_MODULES['Метки NFC'].edit);

  return (
    <List 
      filters={<NfcFilter />} 
      sort={{ field: "createdAt", order: "DESC" }}    
      actions={(
        <div>
          {(canCreate) && (<CreateButton />)}
          <ExportToExcelButton 
            resource="nfc" 
            referenceFields={{attachedStation: { reference: "stations", replaceField: "name" },}} 
          />
        </div>
      )}  
    >
      <Datagrid isRowSelectable={() => canDelete}>
        <TextField source="guid" label="NFC идентификатор" />
        <TextField source="nfcName" label="Название" />
        <TextField source="nfcDescription" label="Описание" />
        <TextField source="location" label="location" /> 
        {(canDelete) && (<ClearLocationButton />)}
        <AttachedStationField source="attachedStation" label="Привязана к станции"/>   
        <DateField source="createdAt" label="Дата" showTime />
        {(canDelete) && (<DeleteButton />)}
      </Datagrid>
    </List>
  );
};

export const NfcEdit = () => (
  <Edit>
    <SimpleForm toolbar={<CustomToolbar />}>
      <TextInput
        source="guid"
        label="NFC идентификатор"
        validate={[required('Поле обязательно для заполнения')]}
      />
      <TextInput
        source="nfcName"
        label="Название"
        validate={[required('Поле обязательно для заполнения')]}
      />
      <TextInput
        source="nfcDescription"
        label="Описание"
        validate={[required('Поле обязательно для заполнения')]}
      />
      <TextInput
        source="location"
        label="location"
      />
    </SimpleForm>
  </Edit>
);

export const NfcCrete = () => (
  <Create>
    <SimpleForm toolbar={<CustomToolbar />}>
      <TextInput
        source="guid"
        label="NFC идентификатор"
        validate={[required('Поле обязательно для заполнения')]}
      />
      <TextInput
        source="nfcName"
        label="Название"
        validate={[required('Поле обязательно для заполнения')]}
      />
      <TextInput
        source="nfcDescription"
        label="Описание"
        validate={[required('Поле обязательно для заполнения')]}
      />
      <TextInput
        source="location"
        label="location"
      />
    </SimpleForm>
  </Create>
);

export const NfcShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="guid" label="NFC идентификатор" />
      <TextField source="nfcName" label="Название" />
      <TextField source="nfcDescription" label="Описание" />
      <AttachedStationField label="Привязана к станции"/>
      <DateField source="createdAt" label="Дата" showTime />
    </SimpleShowLayout>
  </Show>
);