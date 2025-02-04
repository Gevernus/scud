import {
    Datagrid,
    DateField,
    List,
    TextField,
    DeleteButton
} from 'react-admin';

export const EventList = () => (
    <List>
        <Datagrid>
            {/* <TextField source="id" /> */}
            <TextField source="eventType" label="Тип события" />
            <TextField source="description" label="Описание" />
            <DateField source="createdAt" label="Дата" showTime />
            <DeleteButton />
            {/* 
            <ReferenceField
                label="Username"
                source="userId"
                reference="users"
                link={false}
            >
                <TextField source="username" />
            </ReferenceField> */}
        </Datagrid>
    </List>
);
