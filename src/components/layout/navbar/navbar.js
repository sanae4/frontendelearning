// src/components/navbar/Navbar.jsx
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './navbar.css';

const Navbar = ({ user, setUser }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        setUser(null);
        navigate('/');
    };

    const isActive = (path) => {
        return location.pathname === path ? 'active' : '';
    };

    return (
        <header>
            <nav className="navbar">
                <div className="logo">
                    <Link to={
                        user && user.role === 'ROLE_ENSEIGNANT' ? '/create_course' :
                            user && user.role === 'ROLE_ADMIN' ? '/admin-dashboard' : '/'
                    }>
                        <span className="logo-icon">E</span>
                        <span className="logo-text">learning</span>
                    </Link>
                </div>



                <ul className="nav-links">
                    {/* Home link changes based on user role */}
                    <li>
                        {user && user.role === 'ROLE_ENSEIGNANT' ? (
                            <Link to="/create_course" className={`nav-link ${isActive('/addcourse')}`}>Home</Link>
                        ) : user && user.role === 'ROLE_ADMIN' ? (
                            <Link to="/admin-dashboard" className={`nav-link ${isActive('/admin-dashboard')}`}>Home</Link>
                        ) : (
                            <Link to="/" className={`nav-link ${isActive('/')}`}>Home</Link>
                        )}
                    </li>
                    {user ? (
                        // Liens pour les utilisateurs connectés selon leur rôle
                        <>
                            {user.role === 'ROLE_ADMIN' ? (
                                // Liens pour l'administrateur
                                <>
                                    <li><Link to="/courses/admin" className={`nav-link ${isActive('/courses/admin')}`}>Manage Courses</Link></li>
                                    <li><Link to="/admin/categories" className={`nav-link ${isActive('/admin/categories')}`}>Manage Categories</Link></li>
                                    <li><Link to="/admin/teachers" className={`nav-link ${isActive('/admin/teachers')}`}>Manage Teachers</Link></li>
                                    <li><Link to="/admin/reports" className={`nav-link ${isActive('/admin/reports')}`}>Manage Reports</Link></li>
                                </>
                            ) : user.role === 'ROLE_ENSEIGNANT' ? (
                                // Links for teacher
                                <>
                                    <li><Link to="/coursesteacher" className={`nav-link ${isActive('/coursesteacher')}`}>Profile</Link></li>
                                    <li><Link to="/create_course" className={`nav-link ${isActive('/create_course')}`}>Create Course</Link></li>
                                    <li><Link to="/report" className={`nav-link ${isActive('/report')}`}>Report</Link></li>
                                </>
                            ) : user.role === 'ROLE_ETUDIANT' ? (
                                // Liens pour l'étudiant
                                <>
                                    <li><Link to="/categories" className={`nav-link ${isActive('/categories')}`}>Categories</Link></li>
                                    <li><Link to="/profile" className={`nav-link ${isActive('/profile')}`}>Profile</Link></li>
                                    <li><Link to="/report" className={`nav-link ${isActive('/report')}`}>Report</Link></li>
                                </>
                            ) : null}
                        </>
                    ) : (
                        // Liens pour l'utilisateur non connecté
                        <>
                            <li><Link to="/categories" className={`nav-link ${isActive('/categories')}`}>Categories</Link></li>
                            <li><Link to="/about" className={`nav-link ${isActive('/about')}`}>About</Link></li>
                        </>
                    )}
                </ul>

                {/* Barre de recherche améliorée */}
                {!user || (user.role !== 'ROLE_ENSEIGNANT' && user.role !== 'ROLE_ADMIN') ? (
                    <div className="search">
                        <input
                            placeholder="Search"
                            className="search__input"
                            type="text"
                        />
                        <button className="search__button">
                            <svg
                                viewBox="0 0 16 16"
                                className="bi bi-search"
                                fill="currentColor"
                                height="16"
                                width="16"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0"
                                ></path>
                            </svg>
                        </button>
                    </div>

                ) : null}

                {/* Bouton "Login" ou "Logout" à droite */}
                {user ? (
                    <button onClick={handleLogout} className="logout-btn">Logout</button>
                ) : (
                    <Link to="/login" className="login-btn">Login</Link>
                )}
            </nav>
        </header>
    );
};

export default Navbar;
