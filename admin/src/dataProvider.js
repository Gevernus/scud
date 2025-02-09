import { fetchUtils } from "react-admin";
import simpleRestProvider from "ra-data-simple-rest";

const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8000/api/admin";

// Глобальный кешируемый HTTP-клиент
const httpClient = (telegramId) => {
    return (url, options = {}) => {
        options.headers = new Headers({ Accept: "application/json" });

        if (telegramId) {
            options.headers.set("X-Telegram-ID", telegramId);
        }

        return fetchUtils.fetchJson(url, options).catch((error) => {
            if (error.body?.error) {
                throw new Error(error.body.error);
            }
            throw error;
        });
    };
};

// Создаём dataProvider с httpClient
const createDataProvider = (telegramId) => {
    return simpleRestProvider(apiUrl, httpClient(telegramId));
};

export default createDataProvider;
