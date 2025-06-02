import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './CourseContent.css';

const CourseContent = () => {
    const { courseId } = useParams();
    const [course, setCourse] = useState(null);
    const [activeTab, setActiveTab] = useState('about');
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCourseDetails = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');

                if (!token) {
                    toast.error('Authentication token not found. Please login again.');
                    setAuthError(true);
                    setLoading(false);
                    return;
                }

                const response = await axios.get(`http://192.168.11.113:8080/api/course/${courseId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                setCourse(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error loading course details:', error);

                if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                    toast.error('Authentication failed. Please login again.');
                    setAuthError(true);
                } else {
                    toast.error('Error loading course details. Please try again later.');
                }

                setLoading(false);
            }
        };

        fetchCourseDetails();
    }, [courseId]);

    // Fonction pour rendre l'image du cours
    const renderCourseImage = (imageData) => {
        if (!imageData) return null;

        // Si l'image est déjà une URL
        if (imageData.startsWith('http') || imageData.startsWith('data:image')) {
            return <img src={imageData} alt="Course" className="course-banner-image" />;
        }

        // Si l'image est encodée en base64
        return <img src={`data:image/jpeg;base64,${imageData}`} alt="Course" className="course-banner-image" />;
    };

    const handleBackClick = () => {
        navigate(-1);
    };

    // Si une erreur d'authentification est détectée, afficher un message approprié
    if (authError) {
        return (
            <div className="auth-error-container">
                <ToastContainer position="top-right" autoClose={3000} />
                <div className="card">
                    <div className="card-body text-center">
                        <h2 className="card-title mb-4">Authentication Error</h2>
                        <p className="card-text">Your session has expired or is invalid. Please login again to continue.</p>
                        <button
                            className="btn btn-primary mt-3"
                            onClick={() => window.location.href = '/login'}
                        >
                            Go to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="course-content-container">
            <ToastContainer position="top-right" autoClose={3000} />

            {loading ? (
                <div className="loading-container">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3">Loading course content...</p>
                </div>
            ) : course ? (
                <>
                    <div className="course-header">
                        <button className="btn btn-outline-secondary back-button" onClick={handleBackClick}>
                            <i className="fas fa-arrow-left me-2"></i>Back
                        </button>
                    </div>

                    <div className="course-banner">
                        {course.image && renderCourseImage(course.image)}
                        <div className="course-banner-overlay">
                            <div className="course-banner-content">
                                <h1 className="course-title">{course.titreCours}</h1>
                                <div className="course-meta">
                                    <span className="badge bg-primary me-2">{course.courselevel}</span>
                                    <span className="badge bg-secondary me-2">{course.langage}</span>
                                    <span className="badge bg-success">{course.prix} €</span>
                                    {course.category && (
                                        <span className="badge bg-info ms-2">{course.category.nom}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="course-content-tabs">
                        <ul className="nav nav-tabs" id="courseTabs" role="tablist">
                            <li className="nav-item" role="presentation">
                                <button
                                    className={`nav-link ${activeTab === 'about' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('about')}
                                >
                                    About
                                </button>
                            </li>
                            <li className="nav-item" role="presentation">
                                <button
                                    className={`nav-link ${activeTab === 'content' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('content')}
                                >
                                    Content
                                </button>
                            </li>
                            <li className="nav-item" role="presentation">
                                <button
                                    className={`nav-link ${activeTab === 'quiz' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('quiz')}
                                >
                                    Quiz
                                </button>
                            </li>
                        </ul>

                        <div className="tab-content p-4" id="courseTabsContent">
                            {/* About Tab */}
                            <div className={`tab-pane fade ${activeTab === 'about' ? 'show active' : ''}`}>
                                <div className="card">
                                    <div className="card-body">
                                        <h3 className="card-title">About this course</h3>
                                        <p className="card-text">{course.about || 'No course description available.'}</p>

                                        <div className="mt-4">
                                            <h4>Course Details</h4>
                                            <p>{course.description || 'No details available.'}</p>
                                        </div>

                                        <div className="mt-4">
                                            <h4>Publication Information</h4>
                                            <p><strong>Status:</strong> {course.statusCours}</p>
                                            <p><strong>Publication Date:</strong> {course.datePublication ? new Date(course.datePublication).toLocaleDateString() : 'Not published yet'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Content Tab */}
                            <div className={`tab-pane fade ${activeTab === 'content' ? 'show active' : ''}`}>
                                <div className="card">
                                    <div className="card-body">
                                        <h3 className="card-title">Course Lessons</h3>

                                        {course.leçons && course.leçons.length > 0 ? (
                                            <div className="accordion" id="lessonsAccordion">
                                                {course.leçons.map((lesson, index) => (
                                                    <div className="accordion-item" key={lesson.id}>
                                                        <h2 className="accordion-header">
                                                            <button
                                                                className="accordion-button collapsed"
                                                                type="button"
                                                                data-bs-toggle="collapse"
                                                                data-bs-target={`#lesson${lesson.id}`}
                                                            >
                                                                <span className="lesson-number me-2">Lesson {index + 1}:</span> {lesson.titre}
                                                            </button>
                                                        </h2>
                                                        <div
                                                            id={`lesson${lesson.id}`}
                                                            className="accordion-collapse collapse"
                                                            data-bs-parent="#lessonsAccordion"
                                                        >
                                                            <div className="accordion-body">
                                                                <p>{lesson.description}</p>

                                                                {/* Afficher d'autres détails de la leçon si disponibles */}
                                                                {lesson.contenu && (
                                                                    <div className="mt-3">
                                                                        <h5>Lesson Content</h5>
                                                                        <div className="lesson-content">{lesson.contenu}</div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="alert alert-info">
                                                No lessons are available for this course yet.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Quiz Tab */}
                            <div className={`tab-pane fade ${activeTab === 'quiz' ? 'show active' : ''}`}>
                                <div className="card">
                                    <div className="card-body">
                                        <h3 className="card-title">Course Quiz</h3>

                                        {course.quiz ? (
                                            <div className="quiz-container">
                                                <div className="quiz-header">
                                                    <h4>{course.quiz.titre}</h4>
                                                    <p className="quiz-type">Type: {course.quiz.quizType}</p>
                                                </div>

                                                {/* Ici, vous pouvez ajouter d'autres détails du quiz si disponibles */}
                                                <div className="alert alert-warning mt-3">
                                                    <i className="fas fa-lightbulb me-2"></i>
                                                    Start this quiz to test your knowledge about the course content.
                                                </div>

                                                <button className="btn btn-primary mt-3">
                                                    Start Quiz
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="alert alert-info">
                                                No quiz is available for this course yet.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="error-container text-center">
                    <i className="fas fa-exclamation-triangle text-danger fa-3x"></i>
                    <h2 className="mt-3">Course Not Found</h2>
                    <p>The course you are looking for doesn't exist or may have been removed.</p>
                    <button className="btn btn-primary mt-3" onClick={handleBackClick}>
                        Go Back
                    </button>
                </div>
            )}
        </div>
    );
};

export default CourseContent;