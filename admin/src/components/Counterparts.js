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
  SaveButton
} from 'react-admin';
import { required } from 'react-admin';
import { useUser } from '../context/UserContext';
import { PERMISSIONS_MODULES } from '../permissions';

const CustomToolbar = () => (
  <Toolbar>
    <SaveButton />
  </Toolbar>
);

export const CounterpartyList = () => {
  const { checkPermission } = useUser();
  const canDelete = checkPermission(PERMISSIONS_MODULES['Контрагенты'].delete);

  return (
    <List>
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
