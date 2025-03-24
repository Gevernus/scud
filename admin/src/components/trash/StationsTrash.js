import { 
  List, 
  Datagrid, 
  TextField, 
  ReferenceArrayField,
  SingleFieldList,
  ChipField, 
} from 'react-admin';
import RestoreButton from '../UI/RestoreButton';
import { useUser } from '../../context/UserContext';
import { PERMISSIONS_MODULES } from '../../permissions';
import ExportToExcelButton from '../UI/ExportToExcelButton';

export const StationsTrash = () => {
  const { checkPermission } = useUser();
  const canDelete = checkPermission(PERMISSIONS_MODULES['Станции'].delete);

  return (
    <List actions={<ExportToExcelButton resource="stationsTrash" />}>
      <Datagrid isRowSelectable={() => canDelete}>
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
        {canDelete && <RestoreButton resource="stations" />}       
      </Datagrid>
    </List>
  );
};
