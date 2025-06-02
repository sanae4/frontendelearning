import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { decodeToken } from '../utils/jwtUtils'; // Importer l'utilitaire

const PrivateRoute = ({ requiredRole }) => {
    const token = localStorage.getItem('user-token');

    if (!token) {
        return <Navigate to="/" />;
    }

    const userInfo = decodeToken(token);

    if (!userInfo || (requiredRole && userInfo.role !== requiredRole)) {
        return <Navigate to="/" />;
    }

    return <Outlet />;
};

export default PrivateRoute;