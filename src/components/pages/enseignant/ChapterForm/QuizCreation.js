import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import './QuizCreation.css';

const API_URL = 'http://localhost:8080/api';

const api = axios.create({
    baseURL: API_URL
});

// Déplacez les appels useState à l'intérieur du composant fonctionnel
const QuizCreator = () => {
    const { courseId: courseIdParam, lessonId } = useParams();
    const courseId = courseIdParam ? parseInt(courseIdParam) : null;
    const navigate = useNavigate();

    // States
    const [showCompletionOptions, setShowCompletionOptions] = useState(false);
    const [createdQuizId, setCreatedQuizId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [entityName, setEntityName] = useState('');
    const [entityType, setEntityType] = useState('');

    // Quiz creation
    const [quizCreationMethod, setQuizCreationMethod] = useState('');
    const [quizTypes, setQuizTypes] = useState([]);
    const [quizTitle, setQuizTitle] = useState('');
    const [quizQuestions, setQuizQuestions] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState({
        texte: '',
        type: '',
        options: '',
        reponse_correct: ''
    });

    // UI states
    const [showQuizPreview, setShowQuizPreview] = useState(false);
    const [quizPreviewData, setQuizPreviewData] = useState(null);
    const [showAutoQuizModal, setShowAutoQuizModal] = useState(false);
    const [autoQuizTitle, setAutoQuizTitle] = useState('');
    const [autoQuizTypes, setAutoQuizTypes] = useState([]);

    // Nouveaux états pour la configuration de quiz
    const [existingQuizConfig, setExistingQuizConfig] = useState(null);
    const [quizConfig, setQuizConfig] = useState({
        nombreQuestions: 5,
        typesQuestions: [],
        niveauDifficulte: 'hard'
    });

    // Fetch entity info and quiz configuration
    useEffect(() => {
        if (!courseId && !lessonId) {
            setError('Either course ID or lesson ID is required');
            return;
        }

        const fetchEntityInfo = async () => {
            try {
                let response;
                let endpoint = '';
                let nameField = '';

                if (lessonId) {
                    endpoint = `/lessons/${lessonId}`;
                    nameField = 'lessonTitle';
                    setEntityType('lesson');
                } else {
                    endpoint = `/course/${courseId}`;
                    nameField = 'courseTitle';
                    setEntityType('course');
                }

                response = await api.get(endpoint);

                if (response.data) {
                    const name = response.data[nameField] || response.data.title;
                    setEntityName(name);
                    const defaultTitle = `Quiz for ${name}`;
                    setAutoQuizTitle(defaultTitle);
                    setQuizTitle(defaultTitle);
                } else {
                    setError(`${entityType === 'lesson' ? 'Lesson' : 'Course'} not found`);
                }

                // Récupérer la configuration existante de quiz
                await fetchExistingQuizConfig();
            } catch (err) {
                console.error('Error fetching information:', err);
                if (err.response?.status === 401) {
                    setError('Authentication error. Please log in again.');
                    setTimeout(() => navigate('/login'), 2000);
                } else {
                    setError(`Failed to fetch information: ${err.message || 'Unknown error'}`);
                }
            }
        };

        fetchEntityInfo();
    }, [courseId, lessonId, navigate]);

    // Fonction pour récupérer la configuration existante
    const fetchExistingQuizConfig = async () => {
        try {
            let endpoint = '';
            if (lessonId) {
                endpoint = `/configquiz/lecons/${lessonId}/quiz-configuration`;
            } else if (courseId) {
                endpoint = `/configquiz/cours/${courseId}/quiz-configuration`;
            } else {
                return; // Pas d'ID disponible
            }

            const configResponse = await api.get(endpoint);
            if (configResponse.data) {
                setExistingQuizConfig(configResponse.data);
                setQuizConfig({
                    nombreQuestions: configResponse.data.nombreQuestions || 5,
                    typesQuestions: configResponse.data.typesQuestions ? configResponse.data.typesQuestions.split(',') : [],
                    niveauDifficulte: configResponse.data.niveauDifficulte || 'hard'
                });

                // Mise à jour des autoQuizTypes basé sur la configuration existante
                if (configResponse.data.typesQuestions) {
                    const types = configResponse.data.typesQuestions.split(',');
                    const mappedTypes = types.map(type => {
                        switch (type.trim()) {
                            case 'MULTIPLE_CHOICE': return 'MULTIPLE_CHOICE';
                            case 'TRUE_FALSE': return 'TRUE_FALSE';
                            case 'GENERATIVE': return 'GENERATIVE';
                            default: return type.trim();
                        }
                    });
                    setAutoQuizTypes(mappedTypes);
                }
            }
        } catch (error) {
            console.error("Erreur lors de la récupération de la configuration du quiz:", error);
            // Configuration non trouvée, on utilise les valeurs par défaut
        }
    };

    const handleQuizCreationMethodChange = (method) => {
        setQuizCreationMethod(method);
        if (method === 'auto') {
            // Set default title based on entity name
            setAutoQuizTitle(`Quiz for ${entityName}`);

            // Utiliser la configuration existante si disponible
            if (existingQuizConfig) {
                setAutoQuizTypes(existingQuizConfig.typesQuestions ?
                    existingQuizConfig.typesQuestions.split(',') : []);
            } else {
                setAutoQuizTypes([]); // Reset to empty array for multiple selection
            }

            setShowAutoQuizModal(true);
        }
    };

    const handleQuizTypeChange = (type) => {
        setQuizTypes(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );

        if (!currentQuestion.type) {
            setCurrentQuestion(prev => ({ ...prev, type }));
        }
    };

    const handleAutoQuizTypeChange = (type) => {
        setAutoQuizTypes(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
    };

    const handleAutoQuizTitleChange = (e) => {
        setAutoQuizTitle(e.target.value);
    };

    const cancelAutoQuizModal = () => {
        setShowAutoQuizModal(false);
        setQuizCreationMethod('');
    };

    const addQuestion = () => {
        if (!currentQuestion.texte.trim()) {
            setError('Question texte cannot be empty');
            return;
        }

        if (currentQuestion.type === 'Multiple Choice' && !currentQuestion.options.trim()) {
            setError('Options cannot be empty for Multiple Choice questions');
            return;
        }

        if (!currentQuestion.reponse_correct.trim()) {
            setError('Correct answer cannot be empty');
            return;
        }

        setQuizQuestions([...quizQuestions, {
            ...currentQuestion,
            id: Date.now()
        }]);

        setCurrentQuestion({
            texte: '',
            type: currentQuestion.type,
            options: '',
            reponse_correct: ''
        });

        setSuccess('Question added successfully');
        setError('');
    };

    const removeQuestion = (id) => {
        setQuizQuestions(quizQuestions.filter(q => q.id !== id));
    };

    const proceedWithAutoGeneration = async () => {
        if (autoQuizTypes.length === 0) {
            setError('Please select at least one quiz type');
            return;
        }

        setShowAutoQuizModal(false);
        setIsLoading(true);
        setError(''); // Reset error
        setSuccess(''); // Reset success

        try {
            if (!autoQuizTitle.trim()) {
                throw new Error('Quiz title is required');
            }

            // Sauvegarder la configuration
            const configData = {
                nombreQuestions: quizConfig.nombreQuestions,
                typesQuestions: autoQuizTypes.join(','),
                niveauDifficulte: quizConfig.niveauDifficulte
            };

            let configResponse;
            if (entityType === 'course') {
                configResponse = await api.put(`/configquiz/cours/${courseId}/quiz-configuration`, configData);
            } else if (entityType === 'lesson') {
                configResponse = await api.put(`/configquiz/lecons/${lessonId}/quiz-configuration`, configData);
            }

            // Ici nous utilisons directement la réponse de configuration
            if (configResponse.data) {
                setSuccess('Quiz configuration saved successfully!');
                setShowCompletionOptions(true);

                // Vous pouvez aussi stocker l'ID de configuration si nécessaire
                setCreatedQuizId(configResponse.data.id);

                console.log('Configuration response:', configResponse.data);
            } else {
                throw new Error('Failed to save quiz configuration');
            }

            // Optionnel: vous pouvez toujours générer le quiz après, mais sans attendre la réponse
            const quizData = {
                title: autoQuizTitle,
                quizType: autoQuizTypes.join(','),
                courseId,
                lessonId,
                isDeleted: false,
                quizConfigId: configResponse.data.id,
                config: configData
            };



        } catch (err) {
            console.error('Error saving configuration:', err);
            setError(err.response?.data?.message || err.message || 'Error saving quiz configuration');
        } finally {
            setIsLoading(false);
        }
    };

    const previewQuiz = () => {
        if (!quizTitle.trim()) {
            setError('Quiz title is required');
            return;
        }

        if (quizQuestions.length === 0) {
            setError('At least one question is required to create a quiz');
            return;
        }

        setQuizPreviewData({
            title: quizTitle,
            types: quizTypes,
            questions: quizQuestions
        });
        setShowQuizPreview(true);
    };

    const handleCreateManualQuiz = async () => {
        setIsLoading(true);

        try {
            const quizData = {
                title: quizTitle,
                courseId,
                lessonId,
                quizType: quizTypes.join(','),
                isDeleted: false,
                questions: quizQuestions.map(q => ({
                    texte: q.texte,
                    type: q.type,
                    options: q.options,
                    reponse_correct: q.reponse_correct
                }))
            };

            const response = await api.post('/quizz', quizData);

            if (response.data?.id) {
                setCreatedQuizId(response.data.id);
                setShowCompletionOptions(true);
                setShowQuizPreview(false);
            } else {
                throw new Error('Invalid server response');
            }
        } catch (err) {
            console.error('Error creating quiz:', err);
            setError(err.response?.data?.message || err.message || 'Error creating quiz');
        } finally {
            setIsLoading(false);
        }
    };

    const cancelQuizCreation = () => {
        if (window.confirm('Are you sure you want to cancel quiz creation? All entered data will be lost.')) {
            navigate(courseId ? `/course/${courseId}` : '/');
        }
    };

    const navigateToQuiz = () => {
        if (createdQuizId) {
            navigate(`/quizz/${createdQuizId}`);
        }
    };

    const navigateToPublish = () => {
        if (courseId) {
            navigate(`/coursedisplay/${courseId}/`);
        } else {
            setError("Course ID is missing. Cannot navigate to publish page.");
        }
    };

    const navigateToEntity = () => {
        if (courseId) {
            navigate(`/course/${courseId}/lessons`);
        }
    };

    const renderAutoQuizModal = () => {
        if (!showAutoQuizModal) return null;

        return (
            <div className="modal-overlay">
                <div className="modal-content auto-quiz-modal">
                    <div className="modal-header">
                        <h3>Auto Quiz Settings</h3>
                        <button className="close-modal-btn" onClick={cancelAutoQuizModal}>×</button>
                    </div>
                    <div className="modal-body">
                        <div className="form-group">
                            <label>Quiz Title</label>
                            <input
                                type="text"
                                className="form-control"
                                value={autoQuizTitle}
                                onChange={handleAutoQuizTitleChange}
                                placeholder="Enter quiz title"
                            />
                        </div>
                        <div className="form-group">
                            <label>Quiz Type(s) - Select one or more</label>
                            <div className="type-options checkbox-options">
                                <label>
                                    <input
                                        type="checkbox"
                                        name="autoQuizType"
                                        value="TRUE_FALSE"
                                        checked={autoQuizTypes.includes('TRUE_FALSE')}
                                        onChange={() => handleAutoQuizTypeChange('TRUE_FALSE')}
                                    />
                                    True/False
                                </label>
                                <label>
                                    <input
                                        type="checkbox"
                                        name="autoQuizType"
                                        value="MULTIPLE_CHOICE"
                                        checked={autoQuizTypes.includes('MULTIPLE_CHOICE')}
                                        onChange={() => handleAutoQuizTypeChange('MULTIPLE_CHOICE')}
                                    />
                                    Multiple Choice
                                </label>
                                <label>
                                    <input
                                        type="checkbox"
                                        name="autoQuizType"
                                        value="GENERATIVE"
                                        checked={autoQuizTypes.includes('GENERATIVE')}
                                        onChange={() => handleAutoQuizTypeChange('GENERATIVE')}
                                    />
                                    Generative
                                </label>
                            </div>
                        </div>
                        {/* Options supplémentaires */}
                        <div className="form-group">
                            <label>Number of Questions</label>
                            <input
                                type="number"
                                className="form-control"
                                value={quizConfig.nombreQuestions}
                                onChange={(e) => setQuizConfig({ ...quizConfig, nombreQuestions: e.target.value })}
                                min="1"
                                max="20"
                            />
                        </div>

                    </div>
                    <div className="modal-footer">
                        <button className="cancel-btn" onClick={cancelAutoQuizModal}>Cancel</button>
                        <button
                            className="generate-btn"
                            onClick={proceedWithAutoGeneration}
                            disabled={isLoading || autoQuizTypes.length === 0}
                        >
                            {isLoading ? 'Saving...' : '"Save Settings'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderQuizPreview = () => {
        if (!showQuizPreview || !quizPreviewData) return null;

        return (
            <div className="quiz-preview-container">
                <h2 className="quiz-preview-title">Quiz Preview</h2>
                <div className="quiz-preview-header">
                    <h3>{quizPreviewData.title}</h3>
                    <div className="quiz-types-badges">
                        {quizPreviewData.types.map((type, index) => (
                            <span key={index} className={`quiz-type-badge ${type.toLowerCase().replace('/', '-')}`}>
                                {type}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="quiz-preview-questions">
                    <h4>Questions ({quizPreviewData.questions.length})</h4>
                    {quizPreviewData.questions.map((question, index) => (
                        <div key={question.id} className="preview-question-card">
                            <div className="preview-question-header">
                                <span className="question-number1">{index + 1}</span>
                                <span className={`question-type-badge ${question.type.toLowerCase().replace('/', '-')}`}>
                                    {question.type}
                                </span>
                            </div>
                            <div className="preview-question-body">
                                <p className="question-texte">{question.texte}</p>

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
                                            <span className={question.reponse_correct === 'True' ? 'selected' : ''}>
                                                {question.reponse_correct === 'True' ? '✓ ' : ''}
                                                True
                                            </span>
                                            <span className={question.reponse_correct === 'False' ? 'selected' : ''}>
                                                {question.reponse_correct === 'False' ? '✓ ' : ''}
                                                False
                                            </span>
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

                <div className="quiz-preview-actions">
                    <button className="edit-quiz-btn" onClick={() => setShowQuizPreview(false)}>
                        Edit Quiz
                    </button>
                    <button
                        className="confirm-quiz-btn"
                        onClick={handleCreateManualQuiz}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Creating...' : 'Confirm and Create Quiz'}
                    </button>
                </div>
            </div>
        );
    };
    const renderCompletionOptions = () => {
        if (!showCompletionOptions) return null;

        return (
            <div className="completion-options-container">
                <div className="completion-message">
                    <div className="success-message">
                        <h2>Congratulations!</h2>
                        <p>The quiz has been created successfully.</p>
                    </div>
                </div>

                <div className="completion-actions">
                    <div className="action-card">
                        <h3>Publish Course</h3>
                        <p>Is your content ready? Publish it to make it available to learners.</p>
                        <button
                            className="publish-btn"
                            onClick={navigateToPublish}
                        >
                            Finish and Publish
                        </button>
                    </div>

                    <div className="action-card">
                        <h3>Edit Course</h3>
                        <p>Need to make changes? Return to course management.</p>
                        <button
                            className="modify-entity-btn"
                            onClick={navigateToEntity}
                        >
                            Edit Course
                        </button>
                    </div>
                </div>

                <div className="additional-actions">
                    <button
                        className="view-quiz-btn"
                        onClick={navigateToQuiz}
                    >
                        View Created Quiz
                    </button>
                </div>
            </div>
        );
    };

    const renderQuizOptions = () => {
        if (showQuizPreview) {
            return renderQuizPreview();
        }

        return (
            <div className="quiz-options-container">
                <h2 className="quiz-options-title">Create Quiz for: {entityName}</h2>

                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                <div className="quiz-method-selection">
                    <h3>Choose how to create your quiz:</h3>
                    <div className="method-options">
                        <button
                            className={`method-btn ${quizCreationMethod === 'auto' ? 'selected' : ''}`}
                            onClick={() => handleQuizCreationMethodChange('auto')}
                        >
                            <div className="method-icon auto-icon">🤖</div>
                            <div className="method-info">
                                <span className="method-title">Generate Automatically</span>
                                <span className="method-description">
                                    Our AI will create questions based on your content
                                </span>
                            </div>
                        </button>
                        <button
                            className={`method-btn ${quizCreationMethod === 'manual' ? 'selected' : ''}`}
                            onClick={() => handleQuizCreationMethodChange('manual')}
                        >
                            <div className="method-icon manual-icon">✏️</div>
                            <div className="method-info">
                                <span className="method-title">Create Manually</span>
                                <span className="method-description">
                                    Create and customize each question yourself
                                </span>
                            </div>
                        </button>
                    </div>
                </div>

                {quizCreationMethod === 'manual' && (
                    <div className="manual-quiz-section">
                        {/* ... reste du code pour la création manuelle (inchangé) ... */}
                        <div className="quiz-basic-info">
                            <div className="form-group">
                                <label>Quiz Title*</label>
                                <input
                                    type="text"
                                    placeholder="Enter quiz title"
                                    className="form-control"
                                    value={quizTitle}
                                    onChange={(e) => setQuizTitle(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Question Types* (Select one or more)</label>
                                <div className="type-options checkbox-options">
                                    {['True/False', 'Multiple Choice', 'Generative'].map(type => (
                                        <label key={type}>
                                            <input
                                                type="checkbox"
                                                checked={quizTypes.includes(type)}
                                                onChange={() => handleQuizTypeChange(type)}
                                            />
                                            {type}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {quizTypes.length > 0 && (
                            <div className="questions-section">
                                <h3>Add Questions</h3>

                                <div className="question-form">
                                    {/* ... contenu inchangé ... */}
                                </div>

                                {quizQuestions.length > 0 && (
                                    <div className="questions-list">
                                        {/* ... contenu inchangé ... */}
                                    </div>
                                )}

                                <div className="create-quiz-actions">
                                    <button
                                        className="preview-quiz-btn"
                                        onClick={previewQuiz}
                                        disabled={isLoading || quizQuestions.length === 0}
                                    >
                                        Preview Quiz
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="quiz-options-actions">
                    <button
                        className="cancel-btn"
                        onClick={cancelQuizCreation}
                    >
                        Cancel
                    </button>
                    <button
                        className="back-to-entity-btn"
                        onClick={navigateToEntity}
                    >
                        Back to {entityType === 'lesson' ? 'Lesson' : 'Lessons'}
                    </button>
                </div>
            </div>
        );
    };

    if (showCompletionOptions) {
        return renderCompletionOptions();
    }

    return (
        <div className="quiz-creator-container">
            {renderQuizOptions()}
            {renderAutoQuizModal()}
        </div>
    );
};

export default QuizCreator;