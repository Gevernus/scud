import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import WebApp from '@twa-dev/sdk';

const UserContext = createContext();
const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [accessDenied, setAccessDenied] = useState(false);
    const [registrationAllowed, setRegistrationAllowed] = useState(false);
    const [tempUser, setTempUser] = useState(null); // Временный пользователь
    const [error, setError] = useState(null);
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

                console.log('Trying to get user');
                const userResponse = await fetch(`${apiUrl}/front/users`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        telegramId: tgUser.id,
                        firstName: tgUser.first_name,
                        lastName: tgUser.last_name,
                        username: tgUser.username,
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

                if (userData.exists) {
                    setUser(userData.user);
                } else if (userData.registrationAllowed) {
                    setTempUser(tgUser); // Сохраняем временные данные
                    setRegistrationAllowed(true);
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
        <UserContext.Provider value={{ user, setUser, loading, accessDenied, registrationAllowed, tempUser }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    return useContext(UserContext);
};
