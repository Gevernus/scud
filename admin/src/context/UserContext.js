import React, { createContext, useContext, useEffect, useState } from "react";
import WebApp from "@twa-dev/sdk";
import { checkPermission, PERMISSIONS_MODULES } from "../permissions";

const UserContext = createContext();
const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8000/api/admin";

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        WebApp.ready();

        const fetchUser = async () => {
            try {
                const tgUser = WebApp.initDataUnsafe.user || { id: 55, first_name: 'Test', last_name: 'User', username: 'test' };
                
                if (!tgUser) {
                    console.warn("⚠️ Пользователь Telegram не найден. Работаем без авторизации.");
                    setLoading(false); // Completing the download if there is no user
                    return;
                }

                const response = await fetch(`${apiUrl}/auth/check`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ telegramId: tgUser.id }),
                });

                if (!response.ok) {
                    console.error("❌ Ошибка авторизации:", response.statusText);
                    throw new Error("Ошибка авторизации");
                }

                const userData = await response.json();
                setUser(userData);
            } catch (error) {
                console.error("🚨 Ошибка при получении данных пользователя:", error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    return (
        <UserContext.Provider value={{ 
            user, 
            setUser, 
            loading,
            checkPermission: (permissionFlag) => user ? checkPermission(user.permissions, permissionFlag) : false
        }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);