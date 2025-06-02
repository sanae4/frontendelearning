import axios from 'axios';

// Configuration globale d'Axios
const axiosInstance = axios.create({
    baseURL: 'https://192.168.11.113:8443',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Pour ignorer les certificats SSL en développement
if (process.env.NODE_ENV === 'development') {
    // Cette configuration est pour Node.js (si vous utilisez SSR)
    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
}

// Intercepteur pour ajouter le token automatiquement
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Intercepteur pour gérer les erreurs de réponse
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expiré, rediriger vers login
            localStorage.removeItem('token');
            localStorage.removeItem('user-token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
