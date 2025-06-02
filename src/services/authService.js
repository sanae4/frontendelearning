// src/services/AuthService.js
import axios from 'axios';
import { decodeToken } from '../utils/jwtUtils';

const API_URL = 'http://localhost:8080/api';

const AuthService = {
    login: async (credentials) => {
        try {
            const response = await axios.post(`${API_URL}/auth/login`, credentials);
            const token = response.data;

            // Stocker le token dans localStorage
            localStorage.setItem('token', token);

            return decodeToken(token);
        } catch (error) {
            console.error('Erreur lors de la connexion:', error);
            throw error;
        }
    },

    logout: () => {
        localStorage.removeItem('token');
    },

    getCurrentUser: () => {
        const token = localStorage.getItem('token');
        if (!token) return null;

        return decodeToken(token);
    },

    isAuthenticated: () => {
        return localStorage.getItem('token') !== null;
    },

    getToken: () => {
        return localStorage.getItem('token');
    }
};

export default AuthService;
