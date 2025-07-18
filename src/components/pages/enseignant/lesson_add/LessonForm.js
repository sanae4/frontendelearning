import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import './LessonForm.css';

const API_URL = 'http://localhost:8080/api';

// Create axios instance with authentication
const api = axios.create({
    baseURL: API_URL
});

// Add auth token to all requests
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const LessonForm = ({ onLessonAdded }) => {
    const { id: courseId } = useParams();
    const navigate = useNavigate();
    const [lesson, setLesson] = useState({
        titreLeçon: '',
        description: '',
        conseilsEnseignant: '',
        courseId: courseId ? parseInt(courseId) : null
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [newLessonId, setNewLessonId] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [lessonsLoading, setLessonsLoading] = useState(false);
    const [lessonsError, setLessonsError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editingLessonId, setEditingLessonId] = useState(null);

    // State to store quiz information for each lesson
    const [lessonQuizInfo, setLessonQuizInfo] = useState({});
    const [quizLoading, setQuizLoading] = useState(false);

    // Nouveaux états pour la confirmation de quiz
    const [showQuizConfirmation, setShowQuizConfirmation] = useState(false);
    const [courseInfo, setCourseInfo] = useState(null);
    const [courseLoading, setCourseLoading] = useState(false);

    useEffect(() => {
        if (courseId) {
            setLesson(prev => ({
                ...prev,
                courseId: parseInt(courseId)
            }));

            // Load course lessons
            fetchLessons();
            // Charger les informations du cours
            fetchCourseInfo();
        } else {
            setError('Course ID is required');
        }
    }, [courseId]);

    const fetchCourseInfo = async () => {
        if (!courseId) return;

        setCourseLoading(true);
        try {
            const response = await api.get(`/course/${courseId}`);
            setCourseInfo(response.data);
        } catch (err) {
            console.error('Error loading course info:', err);
        } finally {
            setCourseLoading(false);
        }
    };

    const fetchLessons = async () => {
        if (!courseId) return;

        setLessonsLoading(true);
        setLessonsError('');

        try {
            const response = await api.get(`/lecons/course/${courseId}`);

            // Check if response data is an array
            if (Array.isArray(response.data)) {
                setLessons(response.data);

                // After loading lessons, check associated quizzes
                fetchQuizInfo(response.data);
            } else {
                console.error('Expected array but got:', response.data);
                setLessons([]);
                setLessonsError('Incorrect data format');
            }
        } catch (err) {
            console.error('Error loading lessons:', err);
            setLessonsError(err.response?.data?.message || err.message || 'Error loading lessons');
            setLessons([]); // Reset to empty array on error
        } finally {
            setLessonsLoading(false);
        }
    };

    // Fonction modifiée pour vérifier à la fois les quiz et les configurations de quiz
    const fetchQuizInfo = async (lessonsList) => {
        if (!lessonsList || lessonsList.length === 0) return;

        setQuizLoading(true);

        try {
            // Create an object to store quiz information by lesson ID
            const quizInfoObj = {};

            // Pour chaque leçon, vérifier s'il y a un quiz ou une configuration de quiz
            for (const lesson of lessonsList) {
                try {
                    // Check if lesson has an associated quiz
                    let hasQuiz = false;
                    let quizData = null;

                    try {
                        const quizResponse = await api.get(`/quizz/lesson/${lesson.id}`);
                        if (quizResponse.data) {
                            hasQuiz = true;
                            quizData = quizResponse.data;
                        }
                    } catch (quizErr) {
                        // No quiz found, continue to check for quiz configuration
                        console.log(`No quiz found for lesson ${lesson.id}`);
                    }

                    // NOUVEAU: Check if lesson has a quiz configuration
                    let hasQuizConfig = false;
                    let quizConfigData = null;

                    try {
                        // Appel à l'API pour vérifier si une configuration de quiz existe
                        const configResponse = await api.get(`/configquiz/lecons/${lesson.id}/quiz-configuration`);
                        if (configResponse.data && configResponse.data.id) {
                            hasQuizConfig = true;
                            quizConfigData = configResponse.data;
                        }
                    } catch (configErr) {
                        // No quiz config found
                        console.log(`No quiz configuration found for lesson ${lesson.id}`);
                    }

                    // Store the information - treat having either a quiz or config as "having a quiz"
                    quizInfoObj[lesson.id] = {
                        hasQuiz: hasQuiz || hasQuizConfig, // MODIFIÉ: Considère qu'une leçon "a un quiz" si elle a soit un quiz, soit une config
                        quizData: quizData,
                        hasQuizConfig: hasQuizConfig,
                        quizConfigData: quizConfigData
                    };

                } catch (err) {
                    console.error(`Error retrieving quiz info for lesson ${lesson.id}:`, err);
                    quizInfoObj[lesson.id] = {
                        hasQuiz: false,
                        quizData: null,
                        hasQuizConfig: false,
                        quizConfigData: null
                    };
                }
            }

            setLessonQuizInfo(quizInfoObj);
        } catch (err) {
            console.error('Error retrieving quiz information:', err);
        } finally {
            setQuizLoading(false);
        }
    };


    const resetForm = () => {
        setLesson({
            titreLeçon: '',
            description: '',
            conseilsEnseignant: '',
            courseId: courseId ? parseInt(courseId) : null,

        });
        setIsEditing(false);
        setEditingLessonId(null);
        setError('');
        setSuccess('');
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setLesson({
            ...lesson,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            // Validate required fields
            if (!lesson.titreLeçon.trim()) {
                throw new Error('Lesson title is required');
            }

            if (!lesson.courseId) {
                throw new Error('Course ID is required');
            }

            // Prepare payload with correct field names matching backend model
            const payload = {
                titreLeçon: lesson.titreLeçon.trim(),
                description: lesson.description?.trim() || '',
                conseilsEnseignant: lesson.conseilsEnseignant?.trim() || '',

                courseId: lesson.courseId
            };

            let response;

            if (isEditing && editingLessonId) {
                // Update existing lesson
                response = await api.put(`/lecons/${editingLessonId}`, payload);
                setSuccess('Lesson updated successfully!');
                setIsEditing(false);
                setEditingLessonId(null);
            } else {
                // Create new lesson
                response = await api.post(`/lecons`, payload);
                if (response.data && response.data.id) {
                    setNewLessonId(response.data.id);
                    setSuccess('Lesson created successfully!');
                } else {
                    throw new Error('Server response does not contain lesson ID');
                }
            }

            // Refresh lessons list
            await fetchLessons();

            // Reset form
            resetForm();

            if (onLessonAdded && !isEditing && response?.data) {
                onLessonAdded(response.data);
            }
        } catch (err) {
            console.error('Error:', err);
            setError(err.response?.data?.message || err.message || 'Error during operation');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditCourse = () => {
        navigate(`/course/${courseId}/edit`);
    };

    const handleEditLesson = (lessonId) => {
        // Find the lesson to edit
        const lessonToEdit = lessons.find(l => l.id === lessonId);
        if (lessonToEdit) {
            // Fill form with lesson data
            // Handle both property naming conventions (titreLeçon/titreLecon)
            setLesson({
                titreLeçon: lessonToEdit.titreLeçon || lessonToEdit.titreLecon || '',
                description: lessonToEdit.description || '',
                conseilsEnseignant: lessonToEdit.conseilsEnseignant || '',

                courseId: courseId ? parseInt(courseId) : null
            });
            setIsEditing(true);
            setEditingLessonId(lessonId);

            // Scroll to the form
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        } else {
            setError(`Lesson with ID ${lessonId} not found`);
        }
    };

    const handleAddChapter = (lessonId) => {
        navigate(`/course/${courseId}/lessons/${lessonId}/chapters`);
    };

    const handleDisplayLesson = (lessonId) => {
        // Naviguer vers le composant d'affichage de leçon avec l'ID de la leçon
        navigate(`/course/${courseId}/lessons/${lessonId}`);
    };

    const handleCancelEdit = () => {
        resetForm();
    };

    const handleDeleteLesson = async (lessonId) => {
        if (!window.confirm('Are you sure you want to delete this lesson?')) {
            return;
        }

        try {
            await api.delete(`/lecons/${lessonId}`);
            setSuccess('Lesson deleted successfully');

            // Refresh lessons list
            fetchLessons();
        } catch (err) {
            console.error('Error during deletion:', err);
            setError(err.response?.data?.message || err.message || 'Error during deletion');
        }
    };

    const handleViewQuiz = (lessonId) => {
        const quizInfo = lessonQuizInfo[lessonId];
        if (quizInfo) {
            if (quizInfo.hasQuiz && quizInfo.quizData) {
                // Si un quiz existe, naviguer vers celui-ci
                navigate(`/quizzes/${quizInfo.quizData.id}?lessonId=${lessonId}&courseId=${courseId}`);
            } else if (quizInfo.hasQuizConfig) {
                // Si seulement une configuration existe, naviguer vers la page de création/génération de quiz
                navigate(`/quiz-config/lesson/${lessonId}`);

            } else {
                setError("No quiz or quiz configuration found for this lesson");
            }
        } else {
            setError("Quiz information not available");
        }
    };


    const handleFinishCourse = () => {
        // Au lieu de naviguer directement, montrer le dialogue de confirmation
        setShowQuizConfirmation(true);
    };

    // Fonction pour gérer la réponse à la confirmation de quiz
    const handleQuizConfirmationResponse = (wantsToTakeQuiz) => {
        setShowQuizConfirmation(false);

        if (wantsToTakeQuiz) {
            // Naviguer vers le quiz final du cours
            navigate(`/course/${courseId}/createquiz`);
        } else {
            // Naviguer vers la vue du cours complet
            navigate(`/coursepreview/${courseId}`);
        }
    };

    // Fonction pour vérifier s'il y a au moins une leçon avec un quiz
    const hasAnyLessonWithQuiz = () => {
        return Object.values(lessonQuizInfo).some(info => info?.hasQuiz);
    };

    // Composant pour la confirmation de quiz
    const QuizConfirmationDialog = () => {
        return (
            <div className="quiz-confirmation-overlay">
                <div className="quiz-confirmation-dialog">
                    <h3>Final Quiz</h3>
                    <p>Congratulations on completing all lessons!</p>
                    <p>Would you like to take the final course quiz now?</p>

                    <div className="quiz-confirmation-actions">
                        <button
                            className="quiz-yes-btn"
                            onClick={() => handleQuizConfirmationResponse(true)}
                        >
                            Yes, take the final quiz
                        </button>
                        <button
                            className="quiz-no-btn"
                            onClick={() => handleQuizConfirmationResponse(false)}
                        >
                            No, view course content
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            {/* Overlay de confirmation pour le quiz */}
            {showQuizConfirmation && <QuizConfirmationDialog />}

            <div className={`lesson-page-container ${lessons.length === 0 && !lessonsLoading && !quizLoading ? 'no-lessons' : ''}`}>
                <div className={`lesson-form-sidebar ${lessons.length === 0 && !lessonsLoading && !quizLoading ? 'centered-form' : ''}`}>
                    <h2 className="lesson-form-title">
                        {isEditing ? 'Edit Lesson' : 'Add Lesson'}
                    </h2>

                    {error && <div className="error-message">{error}</div>}
                    {success && <div className="success-message">{success}</div>}

                    <form onSubmit={handleSubmit} className="lesson-form">
                        <div className="form-group">
                            <label htmlFor="titreLeçon" className="form-label">Lesson Title*</label>
                            <input
                                type="text"
                                id="titreLeçon"
                                name="titreLeçon"
                                placeholder="Lesson title"
                                className="form-control"
                                value={lesson.titreLeçon}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="description" className="form-label">Lesson Description</label>
                            <textarea
                                id="description"
                                name="description"
                                placeholder="Lesson description"
                                className="form-control"
                                rows="3"
                                value={lesson.description || ''}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="conseilsEnseignant" className="form-label">Teacher's Advice</label>
                            <textarea
                                id="conseilsEnseignant"
                                name="conseilsEnseignant"
                                placeholder="Teacher's advice"
                                className="form-control"
                                rows="3"
                                value={lesson.conseilsEnseignant || ''}
                                onChange={handleInputChange}
                            />
                        </div>


                        <div className="form-actions">
                            <button
                                type="submit"
                                className="submit-btn"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Processing...' : isEditing ? 'Update Lesson' : 'Create Lesson'}
                            </button>

                            {isEditing && (
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={handleCancelEdit}
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>

                    <div className="edit-course-button-container">
                        <button
                            className="edit-course-btn"
                            onClick={handleEditCourse}
                        >
                            Edit Course
                        </button>
                    </div>
                </div>

                {(lessons.length > 0 || lessonsLoading || quizLoading) && (
                    <div className="lessons-list-container">
                        <h2 className="lessons-list-title">
                            {courseInfo ? `${courseInfo.titreCours} 's Lessons` : 'Course Lessons'}
                        </h2>

                        {lessonsError && <div className="error-message">{lessonsError}</div>}

                        {lessonsLoading || quizLoading ? (
                            <div className="loading-message">Loading lessons...</div>
                        ) : lessons.length === 0 ? (
                            <div className="no-lessons-message">No lessons for this course</div>
                        ) : (
                            <>
                                <div className="lessons-list">
                                    {lessons.map(lesson => (
                                        <div key={lesson.id} className={`lesson-item ${editingLessonId === lesson.id ? 'editing' : ''}`}>
                                            <div className="lesson-info">
                                                <h3 className="lesson-title">{lesson.titreLeçon || lesson.titreLecon}</h3>
                                                {lesson.description && (
                                                    <p className="lesson-description">{lesson.description}</p>
                                                )}

                                                {/* Display a badge if the lesson has a quiz */}
                                                {lessonQuizInfo[lesson.id]?.hasQuiz && (
                                                    <div className="lesson-quiz-badge">Quiz Created</div>
                                                )}
                                            </div>
                                            <div className="lesson-actions">
                                                {/* N'affiche le bouton Edit que si la leçon n'a pas de quiz */}
                                                {!lessonQuizInfo[lesson.id]?.hasQuiz && (
                                                    <button
                                                        className="edit-lesson-btn"
                                                        onClick={() => handleEditLesson(lesson.id)}
                                                    >
                                                        Edit
                                                    </button>
                                                )}

                                                {/* Display buttons conditionally based on quiz presence */}
                                                {lessonQuizInfo[lesson.id]?.hasQuiz ? (
                                                    <>
                                                        <button
                                                            className="display-lesson-btn"
                                                            onClick={() => handleDisplayLesson(lesson.id)}
                                                        >
                                                            Display Lesson
                                                        </button>
                                                        <button
                                                            className="view-quiz-btn"
                                                            onClick={() => handleViewQuiz(lesson.id)}
                                                        >
                                                            View Quiz
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        className="manage-chapters-btn"
                                                        onClick={() => handleAddChapter(lesson.id)}
                                                    >
                                                        Manage Chapters
                                                    </button>
                                                )}

                                                <button
                                                    className="delete-lesson-btn"
                                                    onClick={() => handleDeleteLesson(lesson.id)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Afficher le bouton "Finish Course" à la fin de la liste s'il y a au moins une leçon avec un quiz */}
                        {hasAnyLessonWithQuiz() && (
                            <div className="finish-course-container">
                                <button
                                    className="finish-course-btn"
                                    onClick={handleFinishCourse}
                                >
                                    Finish
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default LessonForm;
