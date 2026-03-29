import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8085',
    timeout: 15000,
});

api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        try {
            const decoded = jwtDecode(token);
            if (decoded?.userId) {
                config.headers['X-User-Id'] = decoded.userId;
            }
            if (decoded?.role) {
                config.headers['X-User-Role'] = decoded.role;
            }
        } catch {
            delete config.headers['X-User-Id'];
            delete config.headers['X-User-Role'];
        }
    }
    return config;
}, error => Promise.reject(error));

export default api;
