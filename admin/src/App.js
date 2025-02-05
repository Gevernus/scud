import { Admin, Resource, ListGuesser } from 'react-admin';
import dataProvider from './dataProvider';
import { Dashboard } from './components/Dashboard';
import { UserList, UserEdit, UserCreate } from './components/Users';
import { EventList } from './components/Events';
import { StationsList, StationsEdit, StationsCreate } from './components/Stations';
import { CounterpartyList, CounterpartyEdit, CounterpartyCreate } from './components/Counterparts';

import { UsersTrash } from './components/trash/UsersTrash';
import { EventsTrash } from './components/trash/EventsTrash';
import { StationsTrash } from './components/trash/StationsTrash';
import { CounterpartyTrash } from './components/trash/CounterpartyTrash';

import MyLayout from './components/UI/MyLayout';

const App = () => (
    <Admin dashboard={Dashboard} dataProvider={dataProvider} layout={MyLayout} >
        
        <Resource name="users" list={UserList} edit={UserEdit} create={UserCreate} options={{ label: 'Пользователи' }} />
        <Resource name="events" list={EventList} options={{ label: 'Журнал событий' }} />
        <Resource name="stations" list={StationsList} edit={StationsEdit} create={StationsCreate} options={{ label: 'Станции' }} />
        <Resource name="counterparts" list={CounterpartyList} edit={CounterpartyEdit} create={CounterpartyCreate} options={{ label: 'Контрагенты' }} />

        <Resource name="usersTrash" list={UsersTrash}  options={{ label: 'Корзина пользователей' }}/>
        <Resource name="eventsTrash" list={EventsTrash} options={{ label: 'Корзина событий' }} />
        <Resource name="stationsTrash" list={StationsTrash} options={{ label: 'Корзина станций' }} />
        <Resource name="counterpartyTrash" list={CounterpartyTrash} options={{ label: 'Корзина Контрагенты' }} />
        
    </Admin>
);

export default App;
