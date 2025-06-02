// src/pages/AdminDashboard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css'; // We'll create this CSS file next

const AdminDashboard = () => {
    const navigate = useNavigate();

    const managementOptions = [
        { title: 'Manage Courses', path: '/courses/admin', icon: '📚' },
        { title: 'Manage Categories', path: '/admin/categories', icon: '🗂️' },
        { title: 'Manage Teachers', path: '/admin/teachers', icon: '👩‍🏫' },
        { title: 'Manage Reports', path: '/admin/reports', icon: '📊' }
    ];

    return (
        <div className="admin-dashboard">
            <h1>Admin Dashboard</h1>
            <p className="welcome-message">Welcome to the Admin Control Panel</p>

            <div className="management-grid">
                {managementOptions.map((option, index) => (
                    <div
                        key={index}
                        className="management-card"
                        onClick={() => navigate(option.path)}
                    >
                        <div className="card-icon">{option.icon}</div>
                        <h3>{option.title}</h3>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminDashboard;