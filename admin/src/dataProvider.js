import { fetchUtils } from "react-admin";
import simpleRestProvider from "ra-data-simple-rest";

const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8000/api/admin";

// Global Cached HTTP Client
const httpClient = (telegramId) => {
    return (url, options = {}) => {
        options.headers = new Headers({ Accept: "application/json" });

        if (telegramId) {
            options.headers.set("X-Telegram-ID", telegramId);
        }

        // Adding the time zone offset (in minutes)
        const timezoneOffset = new Date().getTimezoneOffset();
        options.headers.set("X-Timezone-Offset", timezoneOffset);

        return fetchUtils.fetchJson(url, options).catch((error) => {
            if (error.body?.error) {
                throw new Error(error.body.error);
            }
            throw error;
        });
    };
};

// Creating a dataProvider with HttpClient
const createDataProvider = (telegramId) => {
    return simpleRestProvider(apiUrl, httpClient(telegramId));
};

export default createDataProvider;
