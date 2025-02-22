import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import WebApp from '@twa-dev/sdk';
import { v4 as uuidv4 } from 'uuid';

const UserContext = createContext();
const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Receiving function `UUID`
const getDeviceId = () => {
    let deviceId = localStorage.getItem("deviceId");
    if (!deviceId) {
        deviceId = uuidv4();
        localStorage.setItem("deviceId", deviceId);
        console.log(`🆕 Новый deviceId (UUID) создан: ${deviceId}`);
    }
    return deviceId;
};

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [accessDenied, setAccessDenied] = useState(false);
    const [registrationAllowed, setRegistrationAllowed] = useState(false);
    const [verification, setVerification] = useState(false);
    const [tempUser, setTempUser] = useState(null); // Temporary user
    const [error, setError] = useState(null);
    const [deviceId, setDeviceId] = useState(null);
    const hasInitialized = useRef(false);

    useEffect(() => {
        const fetchUser = async () => {
            if (hasInitialized.current) return;
            hasInitialized.current = true;
            try {
                console.log('Init user');
                WebApp.ready();
                const tgUser = WebApp.initDataUnsafe.user || { id: 55, first_name: 'Test', last_name: 'User', username: 'test' };

                if (!tgUser) {
                    console.warn("Telegram user data not found.");
                    setAccessDenied(true);
                    return;
                }

                const storedDeviceId = getDeviceId();
                setDeviceId(storedDeviceId);

                console.log('Trying to get user');
                const userResponse = await fetch(`${apiUrl}/front/users`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        telegramId: tgUser.id,
                        firstName: tgUser.first_name,
                        lastName: tgUser.last_name,
                        username: tgUser.username,
                        deviceId: storedDeviceId,
                    }),
                });

                if (userResponse.status === 409) {
                    const errorData = await userResponse.json();
                    console.warn("⚠️ Ошибка 409:", errorData);
                    setError(errorData.error);
                    setAccessDenied(true);
                    return;
                }

                if (!userResponse.ok) {
                    throw new Error("Failed to fetch user data");
                }

                const userData = await userResponse.json();

                if (userData.isBlocked) {
                    setAccessDenied(true);
                    return;
                }

                if (userData.exists) {//We go to the application
                    setUser(userData.user);
                } else if (userData.registrationAllowed) {//We go into register
                    setTempUser(tgUser); // Saving temporary data
                    setRegistrationAllowed(true);
                } else if (userData.verification) {//We go into verification
                    setVerification(true);
                    setRegistrationAllowed(true);
                    setTempUser(tgUser); // Saving temporary data
                } else {
                    console.warn(" Пользователь не найден в базе. Доступ запрещен.");
                    setAccessDenied(true);
                }

                await fetch(`${apiUrl}/front/events`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        eventType: 'login_attempt',
                        description: `Пользователь ${tgUser.first_name} с telegramId ${tgUser.id} вошел в приложение.`,
                    }),
                });

            } catch (error) {
                console.error('Error initializing user:', error);
                setAccessDenied(true);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    return (
        <UserContext.Provider value={{ user, setUser, loading, accessDenied, registrationAllowed, verification, tempUser, deviceId }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    return useContext(UserContext);
};
