import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './TeacherCoursesPage.css';
import TeacherProfileCard from './TeacherProfileCard';
import CourseCard from './CourseCard';
import StatusFilter from './StatusFilter';
import EmptyState from './EmptyState';
import EditProfileModal from './EditProfileModal';

const API_BASE_URL = 'http://192.168.11.132:8080/api';

const TeacherCoursesPage = () => {
    // Récupérer l'ID depuis l'URL
    const params = useParams();
    const navigate = useNavigate();

    // Déclaration de tous les états en premier
    const [userInfo, setUserInfo] = useState(null);
    const [teacher, setTeacher] = useState(null);
    const [courses, setCourses] = useState([]);
    const [filteredCourses, setFilteredCourses] = useState([]);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [storageChanged, setStorageChanged] = useState(false);

    // Obtenir les informations utilisateur du localStorage au chargement
    useEffect(() => {
        try {
            const storedUserInfo = JSON.parse(localStorage.getItem('userInfo'));
            console.log('UserInfo from localStorage:', storedUserInfo); // Débogage
            setUserInfo(storedUserInfo);
        } catch (error) {
            console.error('Erreur lors de la récupération des données utilisateur:', error);
            setUserInfo(null);
        }
    }, []);

    // Définir l'ID de l'enseignant après avoir chargé userInfo
    const enseignantId = params.enseignantId || (userInfo && userInfo.id) || 1;
    // Ajouter un log pour déboguer l'ID
    useEffect(() => {
        console.log('ID enseignant utilisé:', enseignantId);
    }, [enseignantId]);

    // Rediriger si aucun ID n'est disponible après le chargement initial
    useEffect(() => {
        if (!enseignantId && userInfo === null && !loading) {
            console.log('Aucun ID disponible et userInfo chargé - redirection');
            navigate('/login', {
                state: { message: 'Veuillez vous connecter pour accéder à votre profil enseignant' }
            });
        }
    }, [enseignantId, userInfo, loading, navigate]);

    // Écouteur pour les changements de localStorage
    useEffect(() => {
        const handleStorageChange = () => {
            console.log('Storage changed, reloading user data');
            try {
                const newUserInfo = JSON.parse(localStorage.getItem('userInfo'));
                setUserInfo(newUserInfo);
                setStorageChanged(prev => !prev); // Inverser pour déclencher une réexécution
            } catch (error) {
                console.error('Erreur lors de la mise à jour des données utilisateur:', error);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        // Écouter également un événement personnalisé qui sera déclenché lors de la déconnexion
        window.addEventListener('userLoggedOut', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('userLoggedOut', handleStorageChange);
        };
    }, []);

    // Logs pour le débogage
    console.log('Params:', params);
    console.log('UserInfo from localStorage:', userInfo);
    console.log('Enseignant ID being used:', enseignantId);

    // Fonction de récupération des données
    const fetchTeacherData = async () => {
        // Vérifier si nous avons un ID valide
        if (!enseignantId) {
            console.log('Pas d\'ID enseignant valide, impossible de charger les données');
            setLoading(false);
            setError('Aucun ID enseignant valide. Veuillez vous connecter ou vérifier l\'URL.');
            return;
        }

        console.log('Démarrage de la récupération des données pour ID:', enseignantId);
        try {
            setLoading(true);
            setError(null);

            // Timeout de sécurité pour garantir que setLoading(false) sera appelé
            const timeoutId = setTimeout(() => {
                console.log('Timeout de sécurité déclenché');
                setLoading(false);
                setError('Requête expirée. Veuillez vérifier votre connexion.');
            }, 10000); // 10 secondes de timeout

            // Récupérer les informations de l'enseignant
            console.log('Récupération des données enseignant...');
            const teacherResponse = await axios.get(`${API_BASE_URL}/enseignant/${enseignantId}`, {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 8000,
            });
            console.log('Données enseignant reçues:', teacherResponse.data);
            setTeacher(teacherResponse.data);

            // Récupérer les cours de l'enseignant
            console.log('Récupération des cours...');
            const coursesResponse = await axios.get(`${API_BASE_URL}/course/enseignant/${enseignantId}`, {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 8000,
            });
            console.log('Cours reçus:', coursesResponse.data);
            setCourses(coursesResponse.data);
            setFilteredCourses(coursesResponse.data);

            // Annuler le timeout de sécurité car tout s'est bien passé
            clearTimeout(timeoutId);
            setLoading(false);

        } catch (err) {
            console.error('Erreur détaillée:', err);

            if (err.response) {
                // Réponse du serveur avec un code d'erreur
                console.error('Erreur API:', err.response.status, err.response.data);
                setError(`Erreur ${err.response.status}: ${JSON.stringify(err.response.data)}`);
            } else if (err.request) {
                // Pas de réponse du serveur
                console.error('Pas de réponse du serveur:', err.request);
                setError('Serveur non répondant. Veuillez vérifier votre connexion API.');
            } else {
                // Erreur dans la configuration de la requête
                console.error('Erreur de configuration:', err.message);
                setError(`Erreur lors de la récupération des données: ${err.message}`);
            }

            setLoading(false);
        }
    };

    // Exécuter la fonction uniquement si nous avons un ID
    useEffect(() => {
        if (enseignantId) {
            fetchTeacherData();
        } else if (userInfo !== null) {
            // Si userInfo est chargé mais qu'il n'y a pas d'ID, afficher une erreur
            setLoading(false);
            setError('Aucun ID enseignant trouvé. Si vous êtes enseignant, vérifiez votre connexion.');
        }
        // Si userInfo est toujours en cours de chargement, nous attendons

        // Retourner une fonction de nettoyage
        return () => {
            console.log('Nettoyage du composant');
            // Ajouter ici toute logique de nettoyage (annulation des requêtes, etc.)
        };
    }, [enseignantId, storageChanged, userInfo]); // Ajout de userInfo comme dépendance

    // Filtre les cours en fonction du statut sélectionné
    useEffect(() => {
        if (statusFilter === 'ALL') {
            setFilteredCourses(courses);
        } else {
            setFilteredCourses(courses.filter(course => course.statusCours === statusFilter));
        }
    }, [statusFilter, courses]);

    // Gestionnaire pour le changement de filtre
    const handleFilterChange = (status) => {
        setStatusFilter(status);
    };

    // Gestionnaire pour l'édition du cours
    const handleEditCourse = (courseId) => {
        navigate(`/course/${courseId}/edit`);
    };

    // Gestionnaire pour créer un nouveau cours
    const handleCreateCourse = () => {
        navigate('/courseform');
    };

    // Gestionnaire pour l'ouverture/fermeture du modal d'édition du profil
    const toggleEditModal = () => {
        setShowEditModal(!showEditModal);
    };

    // Gestionnaire pour la sauvegarde du profil
    const handleSaveProfile = async (updatedProfile) => {
        try {
            await axios.put(`${API_BASE_URL}/enseignant/${enseignantId}`, updatedProfile, {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 8000,
            });

            // Mettre à jour l'état local avec les nouvelles informations
            setTeacher(prev => ({ ...prev, ...updatedProfile }));
            setShowEditModal(false);

            // Mettre à jour les informations utilisateur dans le localStorage si nécessaire
            if (userInfo && userInfo.id === enseignantId) {
                const updatedUserInfo = { ...userInfo, ...updatedProfile };
                localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
                setUserInfo(updatedUserInfo);

                // Déclencher l'événement de stockage pour informer les autres composants
                window.dispatchEvent(new Event('storage'));
            }

            // Afficher un message de succès
            alert('Profil mis à jour avec succès');
        } catch (err) {
            console.error('Erreur lors de la mise à jour du profil:', err);

            let errorMessage = 'Erreur lors de la mise à jour du profil. Veuillez réessayer.';
            if (err.response) {
                errorMessage += ` (Erreur ${err.response.status})`;
            } else if (err.request) {
                errorMessage += ' (Serveur non répondant)';
            } else {
                errorMessage += ` (${err.message})`;
            }

            alert(errorMessage);
        }
    };

    // Affichage de l'état de chargement avec plus d'informations
    if (loading) {
        return (
            <div className="loading-container">
                <div className="loader"></div>
                <p>Chargement des données enseignant {enseignantId ? `(ID: ${enseignantId})` : ''}...</p>
                <p className="loading-details">Consultez la console pour plus de détails</p>
            </div>
        );
    }

    // Affichage d'erreur plus détaillé
    if (error) {
        return (
            <div className="error-container">
                <h3>Erreur</h3>
                <p>{error}</p>
                <div className="error-actions">
                    <button className="btn btn-primary" onClick={() => window.location.reload()}>Réessayer</button>
                    <button className="btn btn-secondary" onClick={() => navigate('/')}>Retour à l'accueil</button>
                    <button className="btn btn-secondary" onClick={() => navigate('/login')}>Se connecter</button>
                </div>
            </div>
        );
    }

    // Cas où l'enseignant n'a pas été trouvé, mais pas d'erreur
    if (!teacher) {
        return (
            <div className="error-container">
                <p>Enseignant {enseignantId ? `(ID: ${enseignantId})` : ''} non trouvé</p>
                <button className="btn btn-primary" onClick={() => navigate('/')}>Retour à l'accueil</button>
            </div>
        );
    }

    return (
        <div className="teacher-courses-page">
            <div className="page-header">
                <h1>Teacher Profile</h1>
            </div>

            {/* Profil de l'enseignant */}
            <div className="profile-section">
                <TeacherProfileCard
                    teacher={teacher}
                    onEdit={toggleEditModal}
                    isCurrentUser={userInfo && userInfo.id === enseignantId}
                />
            </div>

            {/* Section des cours */}
            <div className="courses-section">
                <div className="courses-header">
                    <h2>Mes Cours</h2>
                    {userInfo && userInfo.id === enseignantId && (
                        <button className="btn btn-primary create-course-btn" onClick={handleCreateCourse}>
                            Créer un nouveau cours
                        </button>
                    )}
                </div>

                {/* Filtres de statut */}
                <StatusFilter activeFilter={statusFilter} onFilterChange={handleFilterChange} />

                {/* Grille de cours */}
                {filteredCourses.length > 0 ? (
                    <div className="courses-grid">
                        {filteredCourses.map(course => (
                            <CourseCard
                                key={course.id}
                                course={course}
                                onEdit={() => handleEditCourse(course.id)}
                                isCurrentUser={userInfo && userInfo.id === enseignantId}
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        message={`Aucun cours ${statusFilter !== 'ALL' ? `avec le statut ${statusFilter}` : ''}`}
                        subMessage="Créez un nouveau cours ou changez le filtre"
                        actionButton={
                            userInfo && userInfo.id === enseignantId && (
                                <button className="btn btn-primary" onClick={handleCreateCourse}>
                                    Créer un cours
                                </button>
                            )
                        }
                    />
                )}
            </div>

            {/* Modal d'édition du profil */}
            {showEditModal && (
                <EditProfileModal
                    teacher={teacher}
                    onSave={handleSaveProfile}
                    onCancel={toggleEditModal}
                />
            )}
        </div>
    );
};

export default TeacherCoursesPage;
