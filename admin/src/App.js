import { Admin, Resource, ListGuesser } from 'react-admin';
import dataProvider from './dataProvider';
import { Dashboard } from './components/Dashboard';
import { UserList, UserEdit, UserCreate } from './components/Users';
import { EventList } from './components/Events';
import { UsersTrash } from './components/UsersTrash';
import { EventsTrash } from './components/EventsTrash';
import { FaTrashCan, FaUsers } from 'react-icons/fa6';
import { MdOutlineEventNote } from 'react-icons/md';

const App = () => (
    <Admin dashboard={Dashboard} dataProvider={dataProvider}>
        <Resource
            name="users"
            icon={FaUsers}
            list={UserList}
            edit={UserEdit}
            create={UserCreate}
            options={{ label: 'Пользователи' }}
        />
        <Resource
            name="events"
            icon={MdOutlineEventNote}
            list={EventList}
            options={{ label: 'Журнал событий' }}
        />

        <Resource
            name="UsersTrash"
            icon={FaTrashCan}
            list={UsersTrash}
            options={{ label: 'Корзина пользователей' }}
        />
        <Resource
            name="EventsTrash"
            icon={FaTrashCan}
            list={EventsTrash}
            options={{ label: 'Корзина событий' }}
        />
    </Admin>
);

export default App;
