import { List, Datagrid, TextField, EmailField, DateField } from 'react-admin';
import RestoreButton from '../UI/RestoreButton';
import { useUser } from '../../context/UserContext';
import { PERMISSIONS_MODULES } from '../../permissions';
import ExportToExcelButton from '../UI/ExportToExcelButton';

export const CounterpartyTrash = () => {
  const { checkPermission } = useUser();
  const canDelete = checkPermission(PERMISSIONS_MODULES['Станции'].delete);

  return (
    <List actions={<ExportToExcelButton resource="counterpartyTrash" />}>
      <Datagrid isRowSelectable={() => canDelete}>
        <TextField source="id" label="ID Контрагента" />
        <TextField source="fullName" label="Полное название" />
        <TextField source="shortName" label="Краткое название" />
        <TextField source="inn" label="ИНН" />
        <TextField source="phone" label="Телефон" />
        <EmailField source="email" label="E-mail" />
        <TextField source="description" label="Описание" />
        <DateField source="createdAt" label="Дата создания" showTime />
        <DateField source="updatedAt" label="Дата обновления" showTime />
        {canDelete && <RestoreButton resource="counterparts" />}
      </Datagrid>
    </List>
  );
};
