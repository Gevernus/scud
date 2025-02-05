import {
    List,
    Datagrid,
    TextField,
    EmailField,
    DateField
    
} from 'react-admin';
import RestoreButton from '../UI/RestoreButton';

export const CounterpartyTrash = () => (
    <List>
        <Datagrid >
            <TextField source="id" label="ID Контрагента" />
            <TextField source="fullName" label="Полное название" />
            <TextField source="shortName" label="Краткое название" />
            <TextField source="inn" label="ИНН" />
            <TextField source="phone" label="Телефон" />
            <EmailField source="email" label="E-mail" />
            <TextField source="description" label="Описание" />
            <DateField source="createdAt" label="Дата создания" showTime/>
            <DateField source="updatedAt" label="Дата обновления" showTime/>         
            <RestoreButton resource="counterparts" />          
        </Datagrid>
    </List>
);