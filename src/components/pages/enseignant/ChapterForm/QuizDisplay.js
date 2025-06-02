import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import './QuizDisplay.css';

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

const QuizDisplay = () => {
    const { quizId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const lessonId = new URLSearchParams(location.search).get('lessonId');
    const courseId = new URLSearchParams(location.search).get('courseId');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [quiz, setQuiz] = useState(null);
    const [quizTitle, setQuizTitle] = useState('');
    const [quizQuestions, setQuizQuestions] = useState([]);
    const [quizTypes, setQuizTypes] = useState([]);

    useEffect(() => {
        if (quizId) {
            fetchQuiz();
        }
    }, [quizId]);

    const fetchQuiz = async () => {
        setIsLoading(true);
        try {
            const response = await api.get(`/quizz/${quizId}`);
            if (response.data) {
                setQuiz(response.data);
                setQuizTitle(response.data.titre);

                // Set quiz types
                if (response.data.quizType) {
                    const types = response.data.quizType.split(',').map(type => mapBackendTypeToUI(type));
                    setQuizTypes(types);
                }

                // Set questions if available
                if (response.data.questions && Array.isArray(response.data.questions)) {
                    setQuizQuestions(response.data.questions.map(q => ({
                        ...q,
                        id: q.id || Date.now(), // Ensure each question has an id
                        type: mapBackendTypeToUI(q.type)
                    })));
                }
            }
        } catch (err) {
            console.error('Error fetching quiz:', err);
            setError('Failed to load quiz. ' + (err.response?.data?.message || err.message || 'Unknown error'));
        } finally {
            setIsLoading(false);
        }
    };

    // Map backend quiz type to UI format
    const mapBackendTypeToUI = (backendType) => {
        switch (backendType) {
            case 'TRUE_FALSE': return 'True/False';
            case 'MULTIPLE_CHOICE': return 'Multiple Choice';
            case 'GENERATIVE': return 'Generative';
            default: return backendType;
        }
    };

    const navigateBack = () => {
        const params = new URLSearchParams(location.search);
        const lessonId = params.get('lessonId');
        const courseId = params.get('courseId');

        if (lessonId && courseId) {
            navigate(`/course/${courseId}/lessons`);

        } else {
            // Navigate to a default location if lessonId is not available
            navigate('/dashboard');
        }
    };

    if (isLoading) {
        return (
            <div className="quiz-container">
                <div className="loading-indicator">Loading quiz...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="quiz-container">
                <div className="error-message">{error}</div>
                <button className="back-btn" onClick={navigateBack}>Back</button>
            </div>
        );
    }

    if (!quiz) {
        return (
            <div className="quiz-container">
                <div className="error-message">Quiz not found</div>
                <button className="back-btn" onClick={navigateBack}>Back</button>
            </div>
        );
    }

    return (
        <div className="quiz-container">
            <h2 className="quiz-title">{quizTitle}</h2>

            <div className="quiz-types-badges">
                {quizTypes.map((type, index) => (
                    <span key={index} className={`quiz-type-badge ${type.toLowerCase().replace('/', '-')}`}>
                        {type}
                    </span>
                ))}
            </div>

            <div className="quiz-questions">
                <h3>Questions ({quizQuestions.length})</h3>
                {quizQuestions.map((question, index) => (
                    <div key={question.id} className="question-card">
                        <div className="question-card-header">
                            <span className="question-number">{index + 1}</span>
                            <span className={`question-type-badge ${question.type.toLowerCase().replace('/', '-')}`}>
                                {question.type}
                            </span>
                        </div>
                        <div className="question-card-body">
                            <p className="question-text">{question.texte}</p>

                            {question.type === 'Multiple Choice' && (
                                <div className="question-options-list">
                                    <h5>Options:</h5>
                                    <ul>
                                        {question.options.split(',').map((option, optIndex) => (
                                            <li key={optIndex} className={option.trim() === question.reponse_correct.trim() ? 'correct-option' : ''}>
                                                {option.trim()}
                                                {option.trim() === question.reponse_correct.trim() && <span className="correct-badge">✓</span>}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {question.type === 'True/False' && (
                                <div className="question-tf-answer">
                                    <h5>Correct Answer:</h5>
                                    <div className="tf-options">
                                        <span className={question.reponse_correct === 'True' ? 'selected' : ''}>True</span>
                                        <span className={question.reponse_correct === 'False' ? 'selected' : ''}>False</span>
                                    </div>
                                </div>
                            )}

                            {question.type === 'Generative' && (
                                <div className="question-generative-answer">
                                    <h5>Expected Keywords:</h5>
                                    <p>{question.reponse_correct}</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="quiz-actions">
                <button className="back-btn" onClick={navigateBack}>
                    Back
                </button>
            </div>
        </div>
    );
};

export default QuizDisplay;
