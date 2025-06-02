// src/components/auth/LoginForm.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { decodeToken } from '../../../utils/jwtUtils'; // Importer l'utilitaire
import './Login.css';

const LoginForm = ({ setUser }) => {
    const [formData, setFormData] = useState({
        email: '',
        motDePasse: ''
    });
    const [errorMessage, setErrorMessage] = useState('');
    const [pendingApproval, setPendingApproval] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setPendingApproval(false);
        setErrorMessage('');

        try {
            const response = await axios.post('http://192.168.11.113:8080/api/auth/login', formData);
            console.log('API Response:', response.data);

            // Extract token directly from response.data
            const token = response.data;
            console.log('Token received:', token);

            // Decode JWT token
            const userInfo = decodeToken(token);
            console.log('User information:', userInfo);

            if (userInfo) {
                // Check if user is a teacher with status 0 (not approved)
                if (userInfo.role === 'ROLE_ENSEIGNANT') {
                    try {
                        // Store token temporarily to make the API call to check status
                        localStorage.setItem('temp-token', token);

                        // Get teacher information to check status
                        const teacherResponse = await axios.get(`http://192.168.11.113:8080/api/enseignant/${userInfo.id}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });

                        // If teacher status is false (0), show pending approval message
                        if (teacherResponse.data && teacherResponse.data.status === false) {
                            setPendingApproval(true);
                            // Remove temporary token
                            localStorage.removeItem('temp-token');
                            return;
                        }
                    } catch (statusError) {
                        console.error('Error checking teacher status:', statusError);
                    }
                }

                // If we reach here, user is either not a teacher or an approved teacher
                // Store token in localStorage
                localStorage.setItem('token', token);
                localStorage.setItem('user-token', token);

                // Update user state in App
                setUser({
                    id: userInfo.id,

                    email: userInfo.sub,
                    role: userInfo.role
                });

                // Redirect based on role
                if (userInfo.role === 'ROLE_ENSEIGNANT') {
                    navigate('/create_course');
                } else if (userInfo.role === 'ROLE_ETUDIANT') {
                    navigate('/etudiant/dashboard');
                } else {
                    navigate('/admin-dashboard');
                }
            }
        } catch (error) {
            console.error('Error during login:', error);

            // Enhanced error handling
            if (error.response) {
                if (error.response.status === 401 || error.response.status === 403) {
                    setErrorMessage("Incorrect credentials. Please check your email and password.");
                } else if (error.response.status === 500) {
                    if (error.response.data && typeof error.response.data === 'object') {
                        setErrorMessage(error.response.data.message || "Internal server error.");
                    } else if (typeof error.response.data === 'string') {
                        setErrorMessage(error.response.data);
                    } else {
                        setErrorMessage("Internal server error.");
                    }
                } else {
                    setErrorMessage("Login error. Please try again.");
                }
            } else if (error.request) {
                setErrorMessage("No response from server. Please check your connection.");
            } else {
                setErrorMessage("Error preparing request.");
            }
        }
    };

    return (
        <div className="login-container">
            {pendingApproval ? (
                <div className="pending-approval-container">
                    <h2>Account Pending Approval</h2>
                    <div className="pending-icon">
                        <i className="fas fa-clock"></i>
                    </div>
                    <p>Your teacher account is currently under review.</p>
                    <p>You will be able to access the platform once your account is approved by an administrator.</p>
                    <button
                        className="return-button"
                        onClick={() => {
                            setPendingApproval(false);
                            setFormData({ email: '', motDePasse: '' });
                        }}
                    >
                        Return to Login
                    </button>
                </div>
            ) : (
                <form className="form" onSubmit={handleSubmit}>
                    <p className="title">Login</p>
                    {errorMessage && <p className="error-message">{errorMessage}</p>}
                    <label>
                        <input
                            required
                            type="email"
                            name="email"
                            className="input"
                            value={formData.email}
                            onChange={handleChange}
                        />
                        <span>Email</span>
                    </label>
                    <label>
                        <input
                            required
                            type="password"
                            name="motDePasse"
                            className="input"
                            value={formData.motDePasse}
                            onChange={handleChange}
                        />
                        <span>Password</span>
                    </label>
                    <button type="submit" className="submit">Login</button>
                    <p className="signin">
                        Don't have an account? <Link to="/register">Signup</Link>
                    </p>
                </form>
            )}
        </div>
    );
};

export default LoginForm;
