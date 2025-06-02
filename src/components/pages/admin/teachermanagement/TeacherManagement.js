import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

import 'react-toastify/dist/ReactToastify.css';
import './TeacherManagement.css';

const TeacherManagement = () => {
    const [pendingTeachers, setPendingTeachers] = useState([]);
    const [allTeachers, setAllTeachers] = useState([]);
    const [teacherCourses, setTeacherCourses] = useState({});
    const [loading, setLoading] = useState(true);
    const [coursesLoading, setCoursesLoading] = useState({});
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [authError, setAuthError] = useState(false);
    const [viewMode, setViewMode] = useState('pending'); // 'pending', 'all', 'courses', 'course-details'
    const [selectedCourses, setSelectedCourses] = useState(null); // Pour afficher tous les cours d'un enseignant
    const [selectedCourseDetails, setSelectedCourseDetails] = useState(null); // Pour afficher les détails d'un cours
    // État pour le débogage
    const [debugInfo, setDebugInfo] = useState({
        receivedTeachers: [],
        approvedTeachers: [],
        error: null
    });
    const navigate = useNavigate();
    // Charger les enseignants en attente
    useEffect(() => {
        const fetchPendingTeachers = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');

                if (!token) {
                    toast.error('Authentication token not found. Please login again.');
                    setAuthError(true);
                    setLoading(false);
                    return;
                }

                const response = await axios.get('http://192.168.11.113:8080/api/enseignant/pending', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                setPendingTeachers(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error loading pending teachers:', error);

                // Gestion spécifique de l'erreur d'authentification
                if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                    toast.error('Authentication failed. Please login again.');
                    setAuthError(true);
                } else {
                    toast.error('Error loading pending teachers. Please try again later.');
                }

                setLoading(false);
            }
        };

        // Fonction pour charger tous les enseignants - AVEC DÉBOGAGE
        const fetchAllTeachers = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');

                if (!token) {
                    toast.error('Authentication token not found. Please login again.');
                    setAuthError(true);
                    setLoading(false);
                    return;
                }

                console.log("Tentative de récupération des enseignants");

                const response = await axios.get('http://192.168.11.113:8080/api/enseignant', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                console.log("Réponse de l'API - Tous les enseignants:", response.data);

                // Pour le débogage
                const approvedTeachers = response.data.filter(teacher => teacher.approuve === true);
                console.log("Enseignants avec approuve=true:", approvedTeachers);

                setAllTeachers(response.data);

                // Mettre à jour les informations de débogage
                setDebugInfo({
                    receivedTeachers: response.data,
                    approvedTeachers: approvedTeachers,
                    error: null
                });

                // Initialiser le chargement des cours pour chaque enseignant
                const loadingState = {};
                response.data.forEach(teacher => {
                    loadingState[teacher.id] = false;
                });
                setCoursesLoading(loadingState);

                setLoading(false);
            } catch (error) {
                console.error('Error loading all teachers:', error);

                // Pour le débogage
                setDebugInfo({
                    receivedTeachers: [],
                    approvedTeachers: [],
                    error: error.response?.data || error.message
                });

                if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                    toast.error('Authentication failed. Please login again.');
                    setAuthError(true);
                } else {
                    toast.error('Error loading all teachers. Please try again later.');
                }

                setLoading(false);
            }
        };

        if (viewMode === 'pending') {
            fetchPendingTeachers();
        } else if (viewMode === 'all') {
            fetchAllTeachers();
        }
    }, [refreshKey, viewMode]);

    // Fonction pour récupérer les cours d'un enseignant
    const fetchTeacherCourses = async (teacherId) => {
        // Si les cours de cet enseignant sont déjà chargés, ne rien faire
        if (teacherCourses[teacherId]) {
            return teacherCourses[teacherId];
        }

        try {
            setCoursesLoading(prev => ({ ...prev, [teacherId]: true }));
            const token = localStorage.getItem('token');

            if (!token) {
                toast.error('Authentication token not found. Please login again.');
                setAuthError(true);
                return [];
            }

            // URL pour correspondre au contrôleur backend
            const response = await axios.get(`http://192.168.11.113:8080/api/course/enseignant/${teacherId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            console.log(`Cours pour l'enseignant ${teacherId}:`, response.data);
            const courses = response.data;

            setTeacherCourses(prev => ({
                ...prev,
                [teacherId]: courses
            }));

            return courses;
        } catch (error) {
            console.error(`Error loading courses for teacher ${teacherId}:`, error);

            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                toast.error('Authentication failed. Please login again.');
                setAuthError(true);
            } else {
                toast.error(`Error loading courses for this teacher. Please try again later.`);
            }
            return [];
        } finally {
            setCoursesLoading(prev => ({ ...prev, [teacherId]: false }));
        }
    };

    // Fonction pour récupérer les détails d'un cours spécifique
    const fetchCourseDetails = async (courseId) => {
        try {
            const token = localStorage.getItem('token');

            if (!token) {
                toast.error('Authentication token not found. Please login again.');
                setAuthError(true);
                return null;
            }

            const response = await axios.get(`http://192.168.11.113:8080/api/course/${courseId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            console.log(`Détails du cours ${courseId}:`, response.data);
            return response.data;
        } catch (error) {
            console.error(`Error loading details for course ${courseId}:`, error);

            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                toast.error('Authentication failed. Please login again.');
                setAuthError(true);
            } else {
                toast.error(`Error loading course details. Please try again later.`);
            }
            return null;
        }
    };

    // Fonction pour voir les détails d'un enseignant
    const handleViewDetails = (teacher) => {
        setSelectedTeacher(teacher);
        setSelectedCourses(null); // Réinitialiser la vue des cours
        setSelectedCourseDetails(null); // Réinitialiser les détails du cours
    };

    // Fonction pour voir les cours d'un enseignant
    const handleViewCourses = async (teacher) => {
        setSelectedCourses(null);
        setSelectedCourseDetails(null); // Réinitialiser les détails du cours

        // Charger les cours si ce n'est pas déjà fait
        let courses = teacherCourses[teacher.id];
        if (!courses) {
            courses = await fetchTeacherCourses(teacher.id);
        }

        // Définir l'enseignant et ses cours comme sélectionnés
        setSelectedCourses({
            teacher: teacher,
            courses: courses || []
        });

        // Passer en mode d'affichage des cours
        setViewMode('courses');
    };

    const handleViewCourseDetails = async (course) => {
        // Rediriger vers la page CourseContent avec l'ID du cours
        navigate(`/course-content/${course.id}`);
    };

    const handleCloseModal = () => {
        setSelectedTeacher(null);
    };

    const handleApproveTeacher = async (teacherId) => {
        try {
            const token = localStorage.getItem('token');

            if (!token) {
                toast.error('Authentication token not found. Please login again.');
                setAuthError(true);
                return;
            }

            await axios.put(`http://192.168.11.113:8080/api/enseignant/${teacherId}/approve`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            toast.success('Teacher approved successfully');

            if (selectedTeacher && selectedTeacher.id === teacherId) {
                handleCloseModal();
            }

            setRefreshKey(prev => prev + 1);
        } catch (error) {
            console.error('Error approving teacher:', error);

            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                toast.error('Authentication failed. Please login again.');
                setAuthError(true);
            } else {
                toast.error('Error approving teacher. Please try again later.');
            }
        }
    };

    // Fonction pour changer le mode d'affichage
    const toggleViewMode = (mode) => {
        setViewMode(mode);
        setSelectedTeacher(null);
        setSelectedCourses(null);
        setSelectedCourseDetails(null);
    };

    // Fonction pour revenir à la liste des cours depuis les détails d'un cours
    const handleBackToCourses = () => {
        setViewMode('courses');
        setSelectedCourseDetails(null);
    };

    const renderAddress = (adresse) => {
        if (!adresse) return null;

        if (typeof adresse === 'object' && adresse.rue && adresse.ville && adresse.pays) {
            return (
                <p><strong>Address:</strong> {adresse.rue}, {adresse.ville}, {adresse.pays}</p>
            );
        }

        return null;
    };

    // Fonction pour rendre l'image du cours
    const renderCourseImage = (imageData) => {
        if (!imageData) return null;

        // Si l'image est déjà une URL
        if (imageData.startsWith('http') || imageData.startsWith('data:image')) {
            return <img src={imageData} alt="Course" className="course-image" />;
        }

        // Si l'image est encodée en base64
        return <img src={`data:image/jpeg;base64,${imageData}`} alt="Course" className="course-image" />;
    };

    // Si une erreur d'authentification est détectée, afficher un message approprié
    if (authError) {
        return (
            <div className="teacher-management-container">
                <ToastContainer position="top-right" autoClose={3000} />
                <div className="auth-error-container">
                    <h2>Authentication Error</h2>
                    <p>Your session has expired or is invalid. Please login again to continue.</p>
                    <button
                        className="login-btn"
                        onClick={() => window.location.href = '/login'}
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="teacher-management-container">
            <ToastContainer position="top-right" autoClose={3000} />

            <div className="teacher-management-header">
                <h1>
                    {viewMode === 'pending' ? 'Pending Teacher Approvals' :
                        viewMode === 'all' ? 'All Teachers' :
                            viewMode === 'courses' && selectedCourses ? `Courses by ${selectedCourses.teacher.prenom} ${selectedCourses.teacher.nom}` :
                                viewMode === 'course-details' && selectedCourseDetails ? `${selectedCourseDetails.titreCours}` :
                                    'Teacher Management'}
                </h1>

                {/* Boutons de navigation */}
                {viewMode === 'pending' || viewMode === 'all' ? (
                    <div className="view-toggle-buttons">
                        <button
                            className={`view-toggle-btn ${viewMode === 'pending' ? 'active' : ''}`}
                            onClick={() => toggleViewMode('pending')}
                        >
                            Pending Teachers
                        </button>
                        <button
                            className={`view-toggle-btn ${viewMode === 'all' ? 'active' : ''}`}
                            onClick={() => toggleViewMode('all')}
                        >
                            All Teachers
                        </button>
                    </div>
                ) : viewMode === 'courses' ? (
                    <button
                        className="back-btn"
                        onClick={() => toggleViewMode('all')}
                    >
                        Back to Teachers
                    </button>
                ) : viewMode === 'course-details' ? (
                    <button
                        className="back-btn"
                        onClick={handleBackToCourses}
                    >
                        Back to Courses
                    </button>
                ) : null}
            </div>

            {loading ? (
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading teachers...</p>
                </div>
            ) : (
                <>
                    {/* Vue des enseignants en attente */}
                    {viewMode === 'pending' && (
                        <div className="teachers-list">
                            {pendingTeachers.length > 0 ? (
                                pendingTeachers.map(teacher => (
                                    <div key={teacher.id} className="teacher-card">
                                        <div className="teacher-info">
                                            <h3>{teacher.prenom} {teacher.nom}</h3>
                                            <p><strong>Email:</strong> {teacher.email}</p>
                                            <p><strong>Speciality:</strong> {teacher.specialite}</p>
                                            <p><strong>Experience:</strong> {teacher.anneesExperience} years</p>
                                        </div>

                                        <div className="teacher-actions">
                                            <button
                                                className="view-details-btn"
                                                onClick={() => handleViewDetails(teacher)}
                                            >
                                                View Details
                                            </button>
                                            <button
                                                className="approve-btn"
                                                onClick={() => handleApproveTeacher(teacher.id)}
                                            >
                                                Approve
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-state">
                                    <i className="fas fa-user-check empty-icon"></i>
                                    <p>No pending teacher approvals</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Vue de tous les enseignants (MODIFIÉE POUR DÉBOGAGE) */}
                    {viewMode === 'all' && (
                        <div className="teachers-list">



                            {/* AFFICHAGE MODIFIÉ: Affiche tous les enseignants sans filtrage pour le débogage */}
                            {allTeachers.length > 0 ? (
                                allTeachers.map(teacher => (
                                    <div key={teacher.id} className="teacher-card">
                                        <div className="teacher-info">
                                            <h3>{teacher.prenom} {teacher.nom}</h3>
                                            <p><strong>Email:</strong> {teacher.email}</p>
                                            <p><strong>Speciality:</strong> {teacher.specialite}</p>
                                            <p><strong>Experience:</strong> {teacher.anneesExperience} years</p>
                                            <p><strong>Status (Debug):</strong> {
                                                teacher.approuve !== undefined
                                                    ? `approuve=${JSON.stringify(teacher.approuve)} (Type: ${typeof teacher.approuve})`
                                                    : "approuve=undefined"
                                            }</p>
                                        </div>

                                        <div className="teacher-actions">
                                            <button
                                                className="view-details-btn"
                                                onClick={() => handleViewDetails(teacher)}
                                            >
                                                See Details
                                            </button>
                                            <button
                                                className="view-courses-btn"
                                                onClick={() => handleViewCourses(teacher)}
                                            >
                                                See Courses
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-state">
                                    <i className="fas fa-users empty-icon"></i>
                                    <p>No teachers found</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Vue des cours d'un enseignant */}
                    {viewMode === 'courses' && selectedCourses && (
                        <div className="courses-page">
                            <div className="teacher-info-banner">
                                <h3>{selectedCourses.teacher.prenom} {selectedCourses.teacher.nom}</h3>
                                <p>{selectedCourses.teacher.specialite} - {selectedCourses.teacher.anneesExperience} years of experience</p>
                            </div>

                            {coursesLoading[selectedCourses.teacher.id] ? (
                                <div className="course-loading">
                                    <div className="spinner"></div>
                                    <p>Loading courses...</p>
                                </div>
                            ) : selectedCourses.courses.length > 0 ? (
                                <div className="all-courses-grid">
                                    {selectedCourses.courses.map(course => (
                                        <div key={course.id} className="course-card">
                                            <div className="course-header">
                                                {course.image && renderCourseImage(course.image)}
                                                <h3>{course.titreCours}</h3>
                                            </div>
                                            <div className="course-body">
                                                <p><strong>About:</strong> {course.about ? course.about.substring(0, 100) + '...' : 'N/A'}</p>
                                                <p><strong>Level:</strong> {course.courselevel || 'N/A'}</p>
                                                <p><strong>Language:</strong> {course.langage || 'N/A'}</p>
                                                <p><strong>Price:</strong> {course.prix} €</p>
                                                <p><strong>Status:</strong> {course.statusCours || 'N/A'}</p>
                                                <p><strong>Category:</strong> {course.category?.nom || 'N/A'}</p>
                                                <p><strong>Publication Date:</strong> {course.datePublication ? new Date(course.datePublication).toLocaleDateString() : 'N/A'}</p>
                                                <button
                                                    className="view-course-details-btn"
                                                    onClick={() => handleViewCourseDetails(course)}
                                                >
                                                    See the content of the course
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-courses">
                                    <i className="fas fa-book empty-icon"></i>
                                    <p>This teacher has no courses yet.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Vue détaillée d'un cours spécifique */}
                    {viewMode === 'course-details' && selectedCourseDetails && (
                        <div className="course-details-page">
                            <div className="course-header-banner">
                                {selectedCourseDetails.image && renderCourseImage(selectedCourseDetails.image)}
                                <h2>{selectedCourseDetails.titreCours}</h2>
                                <p className="course-meta">
                                    Level: {selectedCourseDetails.courselevel} |
                                    Language: {selectedCourseDetails.langage} |
                                    Price: {selectedCourseDetails.prix} € |
                                    Status: {selectedCourseDetails.statusCours}
                                </p>
                            </div>

                            <div className="course-content">
                                <div className="course-section">
                                    <h3>About the Course</h3>
                                    <div className="course-description">
                                        {selectedCourseDetails.about || 'No description available'}
                                    </div>
                                </div>

                                <div className="course-section">
                                    <h3>Course Description</h3>
                                    <div className="course-description">
                                        {selectedCourseDetails.description || 'No description available'}
                                    </div>
                                </div>

                                {/* Section des leçons */}
                                <div className="course-section">
                                    <h3>Lessons</h3>
                                    {selectedCourseDetails.leçons && selectedCourseDetails.leçons.length > 0 ? (
                                        <div className="lessons-list">
                                            {selectedCourseDetails.leçons.map((lesson, index) => (
                                                <div key={lesson.id} className="lesson-item">
                                                    <h4>Lesson {index + 1}: {lesson.titre}</h4>
                                                    <p>{lesson.description}</p>
                                                    {/* Vous pouvez ajouter plus de détails de la leçon ici */}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p>No lessons available for this course.</p>
                                    )}
                                </div>

                                {/* Section du quiz */}
                                <div className="course-section">
                                    <h3>Quiz</h3>
                                    {selectedCourseDetails.quiz ? (
                                        <div className="quiz-info">
                                            <h4>{selectedCourseDetails.quiz.titre}</h4>
                                            <p>Quiz Type: {selectedCourseDetails.quiz.quizType}</p>
                                            {/* Vous pouvez ajouter plus de détails du quiz ici */}
                                        </div>
                                    ) : (
                                        <p>No quiz available for this course.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Modal pour afficher les détails de l'enseignant */}
            {selectedTeacher && (
                <div className="teacher-modal-overlay" onClick={handleCloseModal}>
                    <div className="teacher-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Teacher Details</h2>
                            <button className="close-btn" onClick={handleCloseModal}>×</button>
                        </div>

                        <div className="modal-body">
                            <div className="teacher-detail-section">
                                <h3>Personal Information</h3>
                                <p><strong>Name:</strong> {selectedTeacher.prenom} {selectedTeacher.nom}</p>
                                <p><strong>Email:</strong> {selectedTeacher.email}</p>
                                <p><strong>Phone:</strong> {selectedTeacher.numtele}</p>
                                {renderAddress(selectedTeacher.adresse)}
                                {selectedTeacher.genre && (
                                    <p><strong>Gender:</strong> {selectedTeacher.genre}</p>
                                )}
                                {selectedTeacher.datenaissance && (
                                    <p><strong>Date of Birth:</strong> {new Date(selectedTeacher.datenaissance).toLocaleDateString()}</p>
                                )}
                            </div>

                            <div className="teacher-detail-section">
                                <h3>Professional Information</h3>
                                <p><strong>Speciality:</strong> {selectedTeacher.specialite}</p>
                                <p><strong>Experience:</strong> {selectedTeacher.anneesExperience} years</p>
                                <p><strong>Status:</strong> {selectedTeacher.approuve ? 'Approved' : 'Pending'}</p>
                                <p><strong>Status raw value (Debug):</strong> {
                                    selectedTeacher.approuve !== undefined
                                        ? JSON.stringify(selectedTeacher.approuve)
                                        : "undefined"
                                }</p>
                                <p><strong>Biography:</strong></p>
                                <div className="biography-box">
                                    {selectedTeacher.biographie}
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            {!selectedTeacher.approuve && (
                                <button
                                    className="approve-btn-large"
                                    onClick={() => handleApproveTeacher(selectedTeacher.id)}
                                >
                                    Approve Teacher
                                </button>
                            )}

                            <button
                                className="view-courses-btn-large"
                                onClick={() => {
                                    handleCloseModal();
                                    handleViewCourses(selectedTeacher);
                                }}
                            >
                                View Teacher's Courses
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherManagement;
