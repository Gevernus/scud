import {
    Datagrid,
    DateField,
    List,
    TextField,
} from 'react-admin';
import RestoreButton from '../RestoreButton';

export const EventsTrash = () => (
    <List >
        <Datagrid>
            {/* <TextField source="id" /> */}
            <TextField source="eventType" label="Тип события" />
            <TextField source="description" label="Описание" />
            <DateField source="createdAt" label="Дата" showTime />
            <RestoreButton resource="events" />
            {/* <ReferenceField
                label="Имя"
                source="userId"
                reference="users"
                link={false}
            >
                <TextField source="firstName" />
            </ReferenceField>
             */}
        </Datagrid>
    </List>
);
