import { Admin, Resource, ListGuesser } from 'react-admin';
import dataProvider from './dataProvider';
import { Dashboard } from './components/Dashboard';
import { UserList, UserEdit, UserCreate } from './components/Users';
import { EventList } from './components/Events';
import { StationsList, StationsEdit, StationsCreate } from './components/Stations';

import { UsersTrash } from './components/trash/UsersTrash';
import { EventsTrash } from './components/trash/EventsTrash';
import { StationsTrash } from './components/trash/StationsTrash';

import { FaTrashCan, FaUsers } from 'react-icons/fa6';
import { MdOutlineEventNote } from 'react-icons/md';
import { FaServer } from 'react-icons/fa';

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
            name="stations"
            icon={FaServer}
            list={StationsList}
            edit={StationsEdit}
            create={StationsCreate}
            options={{ label: 'Stations' }}
        />
        <Resource
            name="usersTrash"
            icon={FaTrashCan}
            list={UsersTrash}
            options={{ label: 'Корзина пользователей' }}
        />
        <Resource
            name="eventsTrash"
            icon={FaTrashCan}
            list={EventsTrash}
            options={{ label: 'Корзина событий' }}
        />
        <Resource
            name="stationsTrash"
            icon={FaTrashCan}
            list={StationsTrash}
            options={{ label: 'Корзина Stations' }}
        />
        
    </Admin>
);

export default App;
