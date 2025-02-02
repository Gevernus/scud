import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import WebApp from '@twa-dev/sdk';

const UserContext = createContext();
const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const hasInitialized = useRef(false);

    useEffect(() => {
        const fetchUser = async () => {
            if (hasInitialized.current) return;
            hasInitialized.current = true;
            try {
                
                WebApp.ready();
                const tgUser = WebApp.initDataUnsafe.user || { id: 1, first_name: 'Test', last_name: 'User', username: 'test' };

                if (!tgUser) {
                    console.warn("Telegram user data not found.");
                    return;
                }

                const linkHash = WebApp.initDataUnsafe?.start_param;

                // Have we created or are we getting a user
                const userResponse = await fetch(`${apiUrl}/users`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        telegramId: tgUser.id,
                        firstName: tgUser.first_name,
                        lastName: tgUser.last_name,
                        username: tgUser.username,
                        linkHash: linkHash,
                    }),
                });

                if (!userResponse.ok) {
                    throw new Error("Failed to fetch user data");
                }

                const userData = await userResponse.json();
                setUser(userData);

                // After successful creation, the user sends a message
                await fetch(`${apiUrl}/events`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        telegramId: tgUser.id,
                        eventType: 'login_attempt',
                        description: 'User opened the app',
                    }),
                });
            } catch (error) {
                console.error('Error initializing user:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    return (
        <UserContext.Provider value={{ user, setUser, loading }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    return useContext(UserContext);
};
