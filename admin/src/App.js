import React, { useMemo, useCallback } from "react";
import { Admin, Resource } from "react-admin";
import createDataProvider from "./dataProvider";
import { Dashboard } from "./components/Dashboard";
import { UserList, UserEdit, UserCreate, UserShow } from "./components/Users";
import { EventList } from "./components/Events";
import {StationsList, StationsEdit, StationsCreate, StationsShow } from "./components/Stations";
import { CounterpartyList, CounterpartyEdit, CounterpartyCreate, CounterpartyShow } from "./components/Counterparts";
import { RegistrationList, RegistrationEdit } from "./components/Registration";
import { LockUsersList } from "./components/LockUsers";
import { NfcList, NfcEdit, NfcShow, NfcCrete } from "./components/Nfc";

import { UsersTrash } from "./components/trash/UsersTrash";
import { EventsTrash } from "./components/trash/EventsTrash";
import { StationsTrash } from "./components/trash/StationsTrash";
import { CounterpartyTrash } from "./components/trash/CounterpartyTrash";
import MyLayout from "./components/UI/MyLayout";

import { UserProvider, useUser } from "./context/UserContext";
import { PERMISSIONS_MODULES } from "./permissions";

const AdminWrapper = () => {
  const { user, loading, checkPermission } = useUser();

  // Оборачиваем checkPermission в useCallback, чтобы избежать лишних ререндеров
  const hasAnyViewPermission = useMemo(() => {
    return Object.keys(PERMISSIONS_MODULES).some(
      (module) =>
        PERMISSIONS_MODULES[module].view &&
        checkPermission(PERMISSIONS_MODULES[module].view)
    );
  }, [checkPermission]);

  // Используем useMemo для dataProvider, но кешируем HTTP-клиент
  const dataProvider = useMemo(() => createDataProvider(user?.telegramId), [user?.telegramId]);

  if (loading) return <p>🔄 Проверка доступа...</p>;

  if (!user || !checkPermission(PERMISSIONS_MODULES["Админ-доступ"].access)) {
    return <p>⛔ У вас нет доступа в админ-панель.</p>;
  }

  if (!hasAnyViewPermission) {
    return <p>⚠ У вас нет доступа к просмотру ни одного раздела.</p>;
  }

  const canViewUsers = checkPermission(PERMISSIONS_MODULES["Пользователи"].view);
  const canViewStations = checkPermission(PERMISSIONS_MODULES["Станции"].view);
  const canViewCounterparty = checkPermission(PERMISSIONS_MODULES["Контрагенты"].view);
  const canViewEvents = checkPermission(PERMISSIONS_MODULES["Журнал событий"].view);
  const canViewRegistration = checkPermission(PERMISSIONS_MODULES["Регистрация"].view);
  const canViewNfc = checkPermission(PERMISSIONS_MODULES["Метки NFC"].view);

  return (
    <Admin dashboard={Dashboard} dataProvider={dataProvider} layout={MyLayout}>
      {canViewUsers && (
        <Resource
          name="users"
          list={UserList}
          edit={checkPermission(PERMISSIONS_MODULES["Пользователи"].edit) ? UserEdit : null}
          create={checkPermission(PERMISSIONS_MODULES["Пользователи"].create) ? UserCreate : null}
          show={UserShow}
          options={{ label: "Пользователи" }}
        />
      )}
      {canViewStations && (
        <Resource
          name="stations"
          list={StationsList}
          edit={checkPermission(PERMISSIONS_MODULES["Станции"].edit) ? StationsEdit : null}
          show={StationsShow}
          // create={checkPermission(PERMISSIONS_MODULES["Станции"].create) ? StationsCreate : null}
          options={{ label: "Станции" }}
        />
      )}
      {canViewCounterparty && (
        <Resource
          name="counterparts"
          list={CounterpartyList}
          edit={checkPermission(PERMISSIONS_MODULES["Контрагенты"].edit) ? CounterpartyEdit : null}
          create={checkPermission(PERMISSIONS_MODULES["Контрагенты"].create) ? CounterpartyCreate : null}
          show={CounterpartyShow}
          options={{ label: "Контрагенты" }}
        />
      )}
      {canViewRegistration && (
        <Resource
          name="registration"
          list={RegistrationList}
          edit={checkPermission(PERMISSIONS_MODULES["Регистрация"].edit) ? RegistrationEdit : null}
          options={{ label: "Регистрация" }}
        />
      )}
      {canViewRegistration && (
        <Resource
          name="lockUsers"
          list={LockUsersList}
          options={{ label: "Заблокированные пользователи" }}
        />
      )}
      {canViewNfc && (
        <Resource
          name="nfc"
          list={NfcList}
          edit={checkPermission(PERMISSIONS_MODULES["Метки NFC"].edit) ? NfcEdit : null}
          // create={checkPermission(PERMISSIONS_MODULES["Метки NFC"].edit) ? NfcCrete : null}
          show={NfcShow}
          options={{ label: "Метки NFC" }}
        />
      )}
      {canViewEvents && (
        <>
          <Resource name="events" list={EventList} options={{ label: "Журнал событий" }} />
          <Resource name="eventsTrash" list={EventsTrash} options={{ label: "Корзина событий" }} />
        </>
      )}
      {canViewUsers && <Resource name="usersTrash" list={UsersTrash} options={{ label: "Корзина пользователей" }} />}
      {canViewStations && <Resource name="stationsTrash" list={StationsTrash} options={{ label: "Корзина станций" }} />}
      {canViewCounterparty && <Resource name="counterpartyTrash" list={CounterpartyTrash} options={{ label: "Корзина Контрагенты" }} />}
    </Admin>
  );
};

const App = () => (
  <UserProvider>
    <AdminWrapper />
  </UserProvider>
);

export default App;
