import {
  List,
  Datagrid,
  TextField,
  EmailField,
  DeleteButton,
  Edit,
  Create,
  SimpleForm,
  TextInput,
  DateField,
  Toolbar,
  SaveButton,
  Filter,
  SelectInput,
  DateInput,
  Show,
  SimpleShowLayout,
  CreateButton
} from 'react-admin';
import { required } from 'react-admin';
import { useUser } from '../context/UserContext';
import { PERMISSIONS_MODULES } from '../permissions';
import ExportToExcelButton from './UI/ExportToExcelButton';

const CustomToolbar = () => (
  <Toolbar>
    <SaveButton />
  </Toolbar>
);

const CounterpartyFilter = (props) => (
  <Filter {...props}>
    {/* Selecting a column to search for */}
    <SelectInput
      label="Поле для поиска"
      source="searchField"
      choices={[
        // { id: null, name: 'Без фильтра' },
        { id: 'fullName', name: 'Полное название' },
        { id: 'shortName', name: 'Краткое название' },
        { id: 'inn', name: 'ИНН' },
        { id: 'phone', name: 'Телефон' },
        { id: 'email', name: 'E-mail' },
        { id: 'createdBy', name: 'Создатель записи' },
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

export const CounterpartyList = () => {
  const { checkPermission } = useUser();
  const canDelete = checkPermission(PERMISSIONS_MODULES['Контрагенты'].delete);
  const canCreate = checkPermission(PERMISSIONS_MODULES['Контрагенты'].create);

  return (
    <List 
      filters={<CounterpartyFilter />} 
      sort={{ field: "createdAt", order: "DESC" }} 
      actions={(
        <div>
          {(canCreate) && (<CreateButton />)}
          <ExportToExcelButton resource="counterparts" />
        </div>
      )}
    >
      <Datagrid rowClick="edit" isRowSelectable={() => canDelete}>
        <TextField source="id" label="ID Контрагента" />
        <TextField source="fullName" label="Полное название" />
        <TextField source="shortName" label="Краткое название" />
        <TextField source="inn" label="ИНН" />
        <TextField source="phone" label="Телефон" />
        <EmailField source="email" label="E-mail" />
        <TextField source="description" label="Описание" />
        <TextField source="createdBy" label="Создатель записи" />
        <DateField source="createdAt" label="Дата создания" showTime />
        <DateField source="updatedAt" label="Дата обновления" showTime />
        {canDelete && <DeleteButton />}
      </Datagrid>
    </List>
  );
};

export const CounterpartyEdit = () => (
  <Edit>
    <SimpleForm toolbar={<CustomToolbar />}>
      <TextInput
        source="fullName"
        label="Полное название"
        validate={[required('Поле обязательно для заполнения')]}
      />
      <TextInput source="shortName" label="Краткое название" />
      <TextInput
        source="inn"
        label="ИНН"
        validate={[required('Поле обязательно для заполнения')]}
      />
      <TextInput source="phone" label="Телефон" />
      <TextInput source="email" label="E-mail" />
      <TextInput multiline source="description" label="Описание" />
      <TextInput
        source="createdBy"
        label="Создатель записи"
        validate={[required('Поле обязательно для заполнения')]}
      />
    </SimpleForm>
  </Edit>
);

export const CounterpartyCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput
        source="fullName"
        label="Полное название"
        validate={[required('Поле обязательно для заполнения')]}
      />
      <TextInput source="shortName" label="Краткое название" />
      <TextInput
        source="inn"
        label="ИНН"
        validate={[required('Поле обязательно для заполнения')]}
      />
      <TextInput source="phone" label="Телефон" />
      <TextInput source="email" label="E-mail" />
      <TextInput multiline source="description" label="Описание" />
      <TextInput
        source="createdBy"
        label="Создатель записи"
        validate={[required('Поле обязательно для заполнения')]}
      />
    </SimpleForm>
  </Create>
);


export const CounterpartyShow = () => (
  <Show>
    <SimpleShowLayout>
    <TextField source="id" label="ID Контрагента" />
        <TextField source="fullName" label="Полное название" />
        <TextField source="shortName" label="Краткое название" />
        <TextField source="inn" label="ИНН" />
        <TextField source="phone" label="Телефон" />
        <EmailField source="email" label="E-mail" />
        <TextField source="description" label="Описание" />
        <TextField source="createdBy" label="Создатель записи" />
    </SimpleShowLayout>
  </Show>
);