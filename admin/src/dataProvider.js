import { fetchUtils } from 'react-admin';
import simpleRestProvider from 'ra-data-simple-rest';

const apiUrl =
    process.env.REACT_APP_API_URL || 'http://localhost:8000/api/admin';

const httpClient = (url, options = {}) => {
    if (!options.headers) {
        options.headers = new Headers({ Accept: 'application/json' });
    }
    return fetchUtils.fetchJson(url, options);
};


const dataProvider = simpleRestProvider(apiUrl, httpClient);

export default dataProvider;
