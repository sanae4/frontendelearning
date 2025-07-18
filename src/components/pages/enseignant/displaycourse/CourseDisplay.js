import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import './CourseDisplay.css';

// Base URL for API calls
const API_BASE_URL = 'http://localhost:8080/api';

function CourseDisplay() {
    // State variables
    const { courseId } = useParams();
    const [course, setCourse] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch all course data when component mounts
    useEffect(() => {
        const fetchCourseData = async () => {
            try {
                setLoading(true);

                // 1. Fetch basic course information
                const courseResponse = await axios.get(`${API_BASE_URL}/course/${courseId}`);
                console.log('Full course response:', courseResponse.data); // Debug the full response
                setCourse(courseResponse.data);


                // 2. Fetch lessons for this course
                const lessonsResponse = await axios.get(`${API_BASE_URL}/lecons/course/${courseId}`);

                // 3. For each lesson, fetch its chapters and quiz
                const lessonsWithDetails = await Promise.all(
                    lessonsResponse.data.map(async (lesson) => {
                        // Fetch chapters for this lesson
                        const chaptersResponse = await axios.get(`${API_BASE_URL}/chapitre/byLecon/${lesson.id}`);

                        // Try to fetch quiz for this lesson (might not exist)
                        let quiz = null;
                        try {
                            const quizResponse = await axios.get(`${API_BASE_URL}/quizz/lesson/${lesson.id}`);
                            quiz = quizResponse.data;
                            console.log('Course data:', courseResponse.data);
                            console.log('Lessons data:', lessonsWithDetails);
                            console.log('Quizzes data:', quizzesResponse.data);
                        } catch (quizError) {
                            console.log(`No quiz found for lesson ${lesson.id}`);
                        }

                        return {
                            ...lesson,
                            chapitres: chaptersResponse.data,
                            quiz: quiz
                        };
                    })
                );
                setLessons(lessonsWithDetails);

                // 4. Fetch course-level quizzes
                const quizzesResponse = await axios.get(`${API_BASE_URL}/quizz/course/${courseId}`);
                setQuizzes(quizzesResponse.data);

            } catch (err) {
                setError('Failed to load course data. Please try again later.');
                console.error('Error fetching course:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchCourseData();
    }, [courseId]);

    // Loading state
    if (loading) return <div className="loading">Loading course data...</div>;
    // Error state
    if (error) return <div className="error">{error}</div>;
    // No course found state
    if (!course) return <div className="not-found">Course not found</div>;

    // Combine all data into a single course object
    const fullCourseData = {
        ...course,
        leçons: lessons,
        quiz: quizzes.length > 0 ? quizzes[0] : null // Assuming first quiz is the main course quiz
    };

    return (
        <div className="app-container">
            <CoursePreview course={fullCourseData} />
        </div>
    );
}

// Main course preview component
const CoursePreview = ({ course }) => {
    return (
        <div className="preview-container">
            <CourseHeader course={course} />
            <CoursePreviewTabs course={course} />
        </div>
    );
};

// Course header component
// Course header component
const CourseHeader = ({ course }) => {
    const [isPublishing, setIsPublishing] = useState(false);
    const [publishError, setPublishError] = useState(null);
    const [publishSuccess, setPublishSuccess] = useState(false);

    const handlePublishCourse = async () => {
        setIsPublishing(true);
        setPublishError(null);
        setPublishSuccess(false);

        try {
            const response = await axios.put(
                `${API_BASE_URL}/course/${course.id}/publish`,
                { status: "PUBLISHED" },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (response.status === 200) {
                setPublishSuccess(true);
                // Mise à jour du statut localement
                course.status_cours = "PUBLISHED";
                course.datePublication = new Date().toISOString();

                // Auto-masquer le message de succès après 5 secondes
                setTimeout(() => {
                    setPublishSuccess(false);
                }, 5000);
            } else {
                throw new Error('Failed to publish course');
            }
        } catch (error) {
            console.error('Error publishing course:', error);
            setPublishError(error.response?.data?.message || 'Failed to publish course');
        } finally {
            setIsPublishing(false);
        }
    };

    return (
        <div className="course-header">
            {/* Messages d'alerte en haut */}
            {publishError && (
                <div className="alert alert-error mb-4">
                    <i className="fas fa-exclamation-triangle mr-2"></i>
                    {publishError}
                </div>
            )}

            {publishSuccess && (
                <div className="alert alert-success mb-4">
                    <i className="fas fa-check-circle mr-2"></i>
                    Cours publié avec succès ! Il est maintenant visible par les étudiants.
                </div>
            )}

            {/* En-tête principal avec titre et bouton */}
            <div className="course-header-main">
                <div className="course-title-section">
                    <h1 className="course-title">{course.titreCours}</h1>
                    <div className="course-status-info">

                    </div>
                </div>


            </div>

            {/* Description */}
            <div className="course-description-section">
                <p className="course-description">{course.description}</p>
            </div>
            {/* Bouton publish - affiché seulement si DRAFT */}
            {course.statusCours === "DRAFT" && (
                <div className="course-actions">
                    <button
                        className="btn btn-success btn-publish"
                        onClick={handlePublishCourse}
                        disabled={isPublishing}
                    >

                        {isPublishing ? (
                            <>
                                <i className="fas fa-spinner fa-spin btn-icon"></i>
                                Publication en cours...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-rocket btn-icon"></i>
                                Publier le cours
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

// Course info component
const CourseInfo = ({ course }) => {
    return (
        <div className="card11 mb-6">
            <div className="card1-header">
                Course Information
            </div>
            <div className="card1-body">
                <div className="info-grid">
                    <div className="info-item">
                        <span className="info-label">Level</span>
                        <span className="info-value">{course.courselevel}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Language</span>
                        <span className="info-value">{course.langage}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Price</span>
                        <span className="info-value">{course.prix} €</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Publication Date</span>
                        <span className="info-value">
                            {course.datePublication
                                ? new Date(course.datePublication).toLocaleDateString()
                                : 'Not published'}
                        </span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Instructor</span>
                        <span className="info-value">
                            {course.enseignant
                                ? `${course.enseignant.prenom || ''} ${course.enseignant.nom || ''}`.trim()
                                : 'N/A'}
                        </span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Category</span>
                        <span className="info-value">
                            {course.category
                                ? course.category.titre
                                : 'No category'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Chapter item component
const ChapterItem = ({ chapter }) => {
    const iconClass = chapter.type === "VIDEO" ? "icon-circle icon-video" : "icon-circle icon-text";
    const iconName = chapter.type === "VIDEO" ? "fa-video" : "fa-file-alt";

    return (
        <div className="chapter-item">
            <div className={iconClass}>
                <i className={`fas ${iconName}`}></i>
            </div>
            <div className="flex-1">
                <div className="font-medium">{chapter.titre}</div>
                <div className="text-sm text-gray-500">{chapter.resumer}</div>
            </div>
            <div>
                <button className="text-indigo-600 hover:text-indigo-800">
                    <i className="fas fa-edit"></i>
                </button>
            </div>
        </div>
    );
};

// Lesson component
const Lesson = ({ lesson, index }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="card1">
            <div
                className="card1-header lesson-accordion"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center">
                    <span className="mr-2">Lesson {index + 1}:</span>
                    <span>{lesson.titreLeçon}</span>
                </div>
                <i className={`fas ${isOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
            </div>
            {isOpen && (
                <div className="card1-body">
                    <p className="mb-3">{lesson.description}</p>

                    {lesson.conseilsEnseignant && (
                        <div className="bg-blue-50 p-3 rounded-md mb-4">
                            <div className="font-medium text-blue-700 mb-1">
                                <i className="fas fa-lightbulb mr-2"></i>
                                Instructor Tips
                            </div>
                            <p className="text-blue-700">{lesson.conseilsEnseignant}</p>
                        </div>
                    )}

                    <div className="mt-4">
                        <div className="font-medium mb-2">
                            Chapters ({lesson.chapitres ? lesson.chapitres.length : 0})
                        </div>
                        {lesson.chapitres && lesson.chapitres.length > 0 ? (
                            <div className="border rounded-md overflow-hidden">
                                {lesson.chapitres.map(chapter => (
                                    <ChapterItem key={chapter.id} chapter={chapter} />
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500">No chapters available for this lesson</p>
                        )}
                    </div>

                    {lesson.quiz && (
                        <div className="mt-4">
                            <div className="font-medium mb-2">Lesson Quiz</div>
                            <div className="bg-indigo-50 p-3 rounded-md">
                                <div className="font-medium text-indigo-700 mb-1">
                                    <i className="fas fa-question-circle mr-2"></i>
                                    {lesson.quiz.titre}
                                </div>
                                <div className="text-sm text-indigo-700 mb-2">
                                    Type: {lesson.quiz.quizType} • {lesson.quiz.questions ? lesson.quiz.questions.length : 0} questions
                                </div>
                                <button className="text-indigo-600 text-sm hover:text-indigo-800">
                                    <i className="fas fa-eye mr-1"></i> View Quiz
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Dans le composant QuizQuestion, remplacez le code actuel par :
const QuizQuestion = ({ question, index }) => {
    // Gestion plus robuste de la réponse correcte
    let correctAnswer = '';

    if (question.reponse_correct) {
        try {
            // Essaie de parser comme JSON
            const parsedAnswer = JSON.parse(question.reponse_correct);
            // Si c'est un objet avec une propriété "correct"
            if (parsedAnswer && typeof parsedAnswer === 'object' && 'correct' in parsedAnswer) {
                correctAnswer = parsedAnswer.correct;
            } else {
                // Sinon utilise l'objet JSON entier
                correctAnswer = JSON.stringify(parsedAnswer);
            }
        } catch (e) {
            // Si ce n'est pas du JSON valide, utilise la chaîne telle quelle
            correctAnswer = question.reponse_correct;
        }
    }

    // Gestion plus robuste des options
    let options = [];
    if (question.options) {
        try {
            // Essaie de parser comme JSON si c'est un tableau
            options = JSON.parse(question.options);
            if (!Array.isArray(options)) {
                // Si ce n'est pas un tableau, essaie de diviser la chaîne
                options = question.options.split(/,\s*/);
            }
        } catch (e) {
            // Si ce n'est pas du JSON valide, divise la chaîne
            options = question.options.split(/,\s*/);
        }
    }

    return (
        <div className="quiz-question">
            <div className="flex justify-between mb-2">
                <span className="font-medium">Question {index + 1}</span>
                <span className="badge badge-primary">{question.type}</span>
            </div>
            <p className="mb-3">{question.texte}</p>

            {question.type === "QCM" && (
                <div className="mt-2">
                    <div className="text-sm text-gray-500 mb-1">Options:</div>
                    {options.map((option, idx) => (
                        <div key={idx} className="flex items-center mb-2">
                            <input
                                type="radio"
                                name={`question-${question.id}`}
                                id={`option-${question.id}-${idx}`}
                                className="mr-2"
                                disabled
                            />
                            <label htmlFor={`option-${question.id}-${idx}`}>{option}</label>
                        </div>
                    ))}
                </div>
            )}

            {/* Reste du code inchangé... */}

            <div className="mt-3 pt-3 border-t text-sm">
                <span className="font-medium text-gray-700">Correct answer: </span>
                <span className="text-green-600">{correctAnswer}</span>
            </div>
        </div>
    );
};

// Quiz component
const Quiz = ({ quiz }) => {
    return (
        <div className="quiz-card1">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">{quiz.titre}</h3>
                <span className="badge badge-success">{quiz.quizType}</span>
            </div>

            <div className="mb-4">
                <p className="text-gray-600">
                    This quiz contains {quiz.questions ? quiz.questions.length : 0} questions.
                </p>
            </div>

            <div className="mb-4">
                {quiz.questions && quiz.questions.map((question, index) => (
                    <QuizQuestion key={question.id} question={question} index={index} />
                ))}
            </div>
        </div>
    );
};

// Course preview tabs component
const CoursePreviewTabs = ({ course }) => {
    const [activeTab, setActiveTab] = useState('about');

    return (
        <div>
            <div className="tabs">
                <div
                    className={`tab ${activeTab === 'about' ? 'active' : ''}`}
                    onClick={() => setActiveTab('about')}
                >
                    <i className="fas fa-info-circle mr-2"></i>
                    About
                </div>
                <div
                    className={`tab ${activeTab === 'content' ? 'active' : ''}`}
                    onClick={() => setActiveTab('content')}
                >
                    <i className="fas fa-book mr-2"></i>
                    Content
                </div>
                <div
                    className={`tab ${activeTab === 'quiz' ? 'active' : ''}`}
                    onClick={() => setActiveTab('quiz')}
                >
                    <i className="fas fa-question-circle mr-2"></i>
                    Quizzes
                </div>
            </div>

            <div className={`tab-content ${activeTab === 'about' ? 'active' : ''}`}>
                <div className="mb-6">
                    <h2 className="section-title">About the Course</h2>
                    <p className="whitespace-pre-line">{course.about}</p>
                </div>
                <CourseInfo course={course} />
            </div>

            <div className={`tab-content ${activeTab === 'content' ? 'active' : ''}`}>
                <h2 className="section-title">Course Content</h2>
                <div className="text-gray-600 mb-4">
                    <p>
                        This course contains {course.leçons ? course.leçons.length : 0} lessons and
                        {course.leçons ?
                            course.leçons.reduce((total, lesson) =>
                                total + (lesson.chapitres ? lesson.chapitres.length : 0), 0) : 0
                        } chapters in total.
                    </p>
                </div>

                <div className="space-y-4">
                    {course.leçons && course.leçons.map((lesson, index) => (
                        <Lesson key={lesson.id} lesson={lesson} index={index} />
                    ))}
                </div>
            </div>

            <div className={`tab-content ${activeTab === 'quiz' ? 'active' : ''}`}>
                <h2 className="section-title">Course Quizzes</h2>

                {course.quiz && (
                    <div>
                        <h3 className="text-lg font-medium mb-4">Final Quiz</h3>
                        <Quiz quiz={course.quiz} />
                    </div>
                )}

                <h3 className="text-lg font-medium mt-6 mb-4">Lesson Quizzes</h3>
                {course.leçons && course.leçons
                    .filter(lesson => lesson.quiz)
                    .map((lesson) => (
                        <div key={lesson.id} className="mb-6">
                            <h4 className="text-md font-medium mb-2">
                                Lesson: {lesson.titreLeçon}
                            </h4>
                            <Quiz quiz={lesson.quiz} />
                        </div>
                    ))
                }
            </div>
        </div>
    );
};

export default CourseDisplay;