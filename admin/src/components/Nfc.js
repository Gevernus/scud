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
  Create
} from 'react-admin';
import { useUser } from '../context/UserContext';
import { PERMISSIONS_MODULES } from '../permissions';

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
        { id: 'id', name: 'NFC идентификатор' },
        { id: 'nfcName', name: 'Название' },
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
  const canDelete = checkPermission(PERMISSIONS_MODULES['Nfc'].edit);

  return (
    <List filters={<NfcFilter />}>
      <Datagrid isRowSelectable={() => canDelete}>
        <TextField source="id" label="NFC идентификатор" />
        <TextField source="nfcName" label="Название" />
        <TextField source="nfcDescription" label="Описание" />
        <TextField source="location" label="location" />
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
        source="id"
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
        validate={[required('Поле обязательно для заполнения')]}
      />
    </SimpleForm>
  </Edit>
);

export const NfcCrete = () => (
  <Create>
    <SimpleForm toolbar={<CustomToolbar />}>
      <TextInput
        source="id"
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
        validate={[required('Поле обязательно для заполнения')]}
      />
    </SimpleForm>
  </Create>
);

export const NfcShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="id" label="NFC идентификатор" />
      <TextField source="nfcName" label="Название" />
      <TextField source="nfcDescription" label="Описание" />
    </SimpleShowLayout>
  </Show>
);