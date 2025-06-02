import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserIdFromToken } from '../../../../utils/jwtUtils';
import axios from 'axios';
import { CheckCircle, XCircle, ChevronLeft, ChevronRight, Award, BookOpen, RefreshCw, ArrowRight } from 'lucide-react';
import './QuizPage.css'; // Réutiliser le même CSS

const FinalQuizPage = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();

    // États principaux
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [result, setResult] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [questionsWithAnswers, setQuestionsWithAnswers] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    // États spécifiques au quiz final
    const [finalQuizId, setFinalQuizId] = useState(null);
    const [courseInfo, setCourseInfo] = useState(null);
    const [etudiantId, setEtudiantId] = useState(null);
    const [generatingQuiz, setGeneratingQuiz] = useState(true);

    useEffect(() => {
        const initializeFinalQuiz = async () => {
            try {
                setGeneratingQuiz(true);

                // Récupérer l'ID de l'étudiant
                const studentId = getCurrentStudentId();
                setEtudiantId(studentId);

                if (!studentId) {
                    setError('Impossible de récupérer votre identifiant. Veuillez vous reconnecter.');
                    setLoading(false);
                    return;
                }

                // Récupérer les informations du cours
                const courseResponse = await axios.get(`http://localhost:8080/api/cours/${courseId}`);
                setCourseInfo(courseResponse.data);
                console.log("Course info:", courseResponse.data);

                // Générer le quiz final
                await generateFinalQuiz(studentId, courseResponse.data);

            } catch (err) {
                console.error('Erreur lors de l\'initialisation du quiz final:', err);
                setError(err.response?.data?.message || 'Erreur lors du chargement du quiz final');
            } finally {
                setLoading(false);
                setGeneratingQuiz(false);
            }
        };

        if (courseId) {
            initializeFinalQuiz();
        }
    }, [courseId]);

    const getCurrentStudentId = () => {
        let studentId = localStorage.getItem('studentId');
        if (studentId) {
            return parseInt(studentId, 10);
        }
        studentId = getUserIdFromToken();
        if (studentId) {
            localStorage.setItem('studentId', studentId.toString());
            return studentId;
        }
        return null;
    };

    const generateFinalQuiz = async (studentId, course) => {
        try {
            const apiUrl = 'http://localhost:8080/api/generation/etudiants/quizzes-from-config';
            const configurationId = course?.defaultQuizConfiguration?.id;

            if (!configurationId) {
                throw new Error('Configuration de quiz final non trouvée pour ce cours');
            }

            const payload = {
                leconId: null, // null pour quiz final
                etudiantIds: [studentId],
                configurationId: configurationId
            };

            console.log("Génération du quiz final avec payload:", payload);
            const response = await axios.post(apiUrl, payload);
            const quizId = response.data?.[0]?.id;

            if (!quizId) {
                throw new Error('Impossible de générer le quiz final');
            }

            setFinalQuizId(quizId);
            console.log("Quiz final généré avec ID:", quizId);

            // Charger les questions du quiz final
            await loadQuizQuestions(quizId);

        } catch (err) {
            console.error('Erreur lors de la génération du quiz final:', err);
            throw err;
        }
    };

    const loadQuizQuestions = async (quizId) => {
        try {
            const questionsResponse = await axios.get(`http://localhost:8080/api/question/quiz-generated/${quizId}`);
            const questionsWithoutAnswers = questionsResponse.data.map(question => ({
                ...question,
                reponsCcorrect: undefined,
                explanation: undefined
            }));
            setQuestions(questionsWithoutAnswers);
            console.log("Questions du quiz final chargées:", questionsWithoutAnswers.length);
        } catch (err) {
            console.error('Erreur lors du chargement des questions:', err);
            throw err;
        }
    };

    const handleAnswerChange = (questionId, answer) => {
        setAnswers(prev => ({ ...prev, [questionId]: answer }));
    };

    const handleNextQuestion = () => {
        if (currentQuestion < questions.length - 1) setCurrentQuestion(currentQuestion + 1);
    };

    const handlePrevQuestion = () => {
        if (currentQuestion > 0) setCurrentQuestion(currentQuestion - 1);
    };

    const isQuestionAnswered = (questionId) => answers[questionId] !== undefined && answers[questionId] !== '';

    const getAnsweredQuestionsCount = () => Object.keys(answers).filter(key => answers[key] !== '').length;

    const getNormalizedQuestionType = (questionType) => {
        if (!questionType) return 'unknown';
        const type = questionType.toLowerCase();
        if (type === 'qcm' || type === 'multiplechoice' || type.includes('choix multiple')) return 'multiplechoice';
        if (type === 'vrai/faux' || type === 'boolean' || type.includes('vrai') || type.includes('faux')) return 'boolean';
        if (type === 'générative' || type === 'generative' || type.includes('génér')) return 'generative';
        return 'unknown';
    };

    const handleSubmit = async () => {
        try {
            setSubmitting(true);
            const reponses = questions.map(question => ({
                questionId: question.id,
                reponseUtilisateur: answers[question.id] || ''
            }));

            // API spécifique pour les quiz finaux
            const resultResponse = await axios.post(
                `http://localhost:8080/api/resultat/quiz-genere/${finalQuizId}/soumettre`,
                reponses
            );

            setResult(resultResponse.data);
            console.log("Résultat du quiz final:", resultResponse.data);

            // Charger les détails des questions avec les bonnes réponses
            const questionsWithAnswersPromises = questions.map(async (question) => {
                const fullQuestionResponse = await axios.get(`http://localhost:8080/api/question/${question.id}`);
                return { ...fullQuestionResponse.data, userAnswer: answers[question.id] || '' };
            });

            const fullQuestions = await Promise.all(questionsWithAnswersPromises);
            setQuestionsWithAnswers(fullQuestions);
            setSubmitted(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la soumission du quiz final');
            console.error('Erreur de soumission:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const confirmSubmit = () => {
        const answeredCount = getAnsweredQuestionsCount();
        const totalQuestions = questions.length;
        if (answeredCount < totalQuestions && !window.confirm(`Vous n'avez pas répondu à ${totalQuestions - answeredCount} question(s). Voulez-vous vraiment soumettre le quiz final ?`)) return;
        handleSubmit();
    };

    const checkAnswerCorrectness = (question, userAnswer) => {
        const questionType = getNormalizedQuestionType(question.type);
        const correctAnswer = question.reponsCcorrect;
        if (!userAnswer || !correctAnswer) return false;
        if (questionType === 'generative') return null;
        return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
    };

    const handleRetryQuiz = async () => {
        try {
            setLoading(true);
            // Réinitialiser l'état
            setAnswers({});
            setSubmitted(false);
            setResult(null);
            setQuestionsWithAnswers([]);
            setCurrentQuestion(0);
            setFinalQuizId(null);

            // Regénérer le quiz final
            await generateFinalQuiz(etudiantId, courseInfo);
        } catch (err) {
            setError('Erreur lors de la regénération du quiz final');
            console.error('Erreur:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleReturnToCourse = () => {
        navigate(`/course-view/${courseId}`);
    };

    const renderSuccessActions = () => {
        if (!result?.estpasse) return null;

        return (
            <div className="success-actions">
                <div className="final-quiz-completed">
                    <div className="congratulations">
                        <Award size={48} className="icon-award" />
                        <h3>Félicitations ! Vous avez terminé le cours !</h3>
                        <p>Vous avez réussi le quiz final avec succès. Bravo pour votre persévérance et votre engagement dans ce cours !</p>
                        {result.score && (
                            <p className="final-score">Score final : <strong>{result.score}%</strong></p>
                        )}
                    </div>
                    <button onClick={handleReturnToCourse} className="action-btn continue-btn">
                        <ArrowRight size={20} />
                        Retourner au cours
                    </button>
                </div>
            </div>
        );
    };

    const renderFailureActions = () => {
        if (result?.estpasse) return null;

        return (
            <div className="failure-actions">
                <div className="encouragement-failure">
                    <h3>Quiz final non réussi</h3>
                    <p>Ne vous découragez pas ! Vous pouvez reprendre le quiz final après avoir révisé le contenu du cours.</p>
                    {result.score && (
                        <p>Votre score : <strong>{result.score}%</strong></p>
                    )}
                </div>
                <div className="action-buttons">
                    <button onClick={handleRetryQuiz} className="action-btn retry-btn">
                        <RefreshCw size={20} />
                        Reprendre le quiz final
                    </button>
                    <button onClick={handleReturnToCourse} className="action-btn return-btn">
                        <BookOpen size={20} />
                        Retourner au cours pour réviser
                    </button>
                </div>
            </div>
        );
    };

    const renderQuestionContent = (question) => {
        const questionType = getNormalizedQuestionType(question.type);

        switch (questionType) {
            case 'multiplechoice':
                let options = [];
                try {
                    options = typeof question.options === 'string' ?
                        (question.options.includes('[') ? JSON.parse(question.options) : question.options.split('|').map(opt => opt.trim())) :
                        question.options;
                } catch (e) {
                    options = question.options.split('|').map(opt => opt.trim());
                }

                return (
                    <div className="options">
                        {options.map((option, i) => (
                            <div key={i} className="option">
                                <input
                                    type="radio"
                                    id={`q${question.id}_opt${i}`}
                                    name={`question_${question.id}`}
                                    value={option}
                                    checked={answers[question.id] === option}
                                    onChange={() => handleAnswerChange(question.id, option)}
                                />
                                <label htmlFor={`q${question.id}_opt${i}`}>{option}</label>
                            </div>
                        ))}
                    </div>
                );

            case 'boolean':
                return (
                    <div className="options">
                        <div className="option">
                            <input
                                type="radio"
                                id={`q${question.id}_true`}
                                name={`question_${question.id}`}
                                value="Vrai"
                                checked={answers[question.id] === "Vrai"}
                                onChange={() => handleAnswerChange(question.id, "Vrai")}
                            />
                            <label htmlFor={`q${question.id}_true`}>Vrai</label>
                        </div>
                        <div className="option">
                            <input
                                type="radio"
                                id={`q${question.id}_false`}
                                name={`question_${question.id}`}
                                value="Faux"
                                checked={answers[question.id] === "Faux"}
                                onChange={() => handleAnswerChange(question.id, "Faux")}
                            />
                            <label htmlFor={`q${question.id}_false`}>Faux</label>
                        </div>
                    </div>
                );

            case 'generative':
                return (
                    <div className="generative-container">
                        <textarea
                            className="generative-answer"
                            placeholder="Votre réponse..."
                            value={answers[question.id] || ''}
                            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                            rows={5}
                        />
                        <p className="hint">Saisissez votre réponse en détaillant votre pensée.</p>
                    </div>
                );

            default:
                return (
                    <div className="error-container">
                        <p className="error">Type de question non reconnu: {question.type}</p>
                        <p>Veuillez contacter l'administrateur.</p>
                    </div>
                );
        }
    };

    const renderResultsContent = () => {
        if (!result || !questionsWithAnswers.length) {
            return <div className="loading">Chargement des résultats...</div>;
        }

        return (
            <div className="simple-results-container">
                <div className="results-summary">
                    <h2>Résultats du Quiz Final</h2>
                    <div className={`result-status ${result.estpasse ? 'passed' : 'failed'}`}>
                        {result.estpasse ? (
                            <>
                                <CheckCircle size={32} className="icon-passed" />
                                <span>Quiz Final Réussi</span>
                            </>
                        ) : (
                            <>
                                <XCircle size={32} className="icon-failed" />
                                <span>Quiz Final Échoué</span>
                            </>
                        )}
                    </div>
                    <div className="score-display">
                        Votre score : <span className="score-value">{result.score}%</span>
                    </div>
                    <div className="score-breakdown">
                        <div className="correct-answers">
                            <CheckCircle size={20} className="icon-correct" />
                            {Math.round((result.score / 100) * questionsWithAnswers.length)} bonnes réponses
                        </div>
                        <div className="incorrect-answers">
                            <XCircle size={20} className="icon-incorrect" />
                            {questionsWithAnswers.length - Math.round((result.score / 100) * questionsWithAnswers.length)} mauvaises réponses
                        </div>
                    </div>
                </div>

                {/* Afficher les actions selon le résultat */}
                {result.estpasse ? renderSuccessActions() : renderFailureActions()}

                <div className="questions-review">
                    <h3>Détails des réponses</h3>
                    <div className="questions-list">
                        {questionsWithAnswers.map((question, index) => {
                            const isCorrect = checkAnswerCorrectness(question, question.userAnswer);

                            return (
                                <div key={question.id} className={`question-result ${isCorrect ? 'correct' : 'incorrect'}`}>
                                    <div className="question-header">
                                        <span className="question-number">Question {index + 1}</span>
                                        {isCorrect ? (
                                            <CheckCircle size={20} className="icon-correct" />
                                        ) : (
                                            <XCircle size={20} className="icon-incorrect" />
                                        )}
                                    </div>
                                    <div className="question-text">{question.texte}</div>
                                    <div className="answer-comparison">
                                        <div className="user-answer">
                                            <strong>Votre réponse:</strong> {question.userAnswer || <em>Aucune réponse</em>}
                                        </div>
                                        <div className="correct-answer">
                                            <strong>Réponse correcte:</strong> {question.reponsCcorrect}
                                        </div>
                                    </div>
                                    {question.explanation && (
                                        <div className="explanation">
                                            <strong>Explication:</strong> {question.explanation}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    // États de chargement
    if (loading) {
        return (
            <div className="loading">
                {generatingQuiz ? 'Génération du quiz final...' : 'Chargement du quiz final...'}
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <div className="error">{error}</div>
                <button onClick={() => navigate(`/course-view/${courseId}`)} className="action-btn return-btn">
                    <ArrowRight size={20} />
                    Retourner au cours
                </button>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="empty-quiz">
                <p>Aucune question disponible pour ce quiz final.</p>
                <button onClick={() => navigate(`/course-view/${courseId}`)} className="action-btn return-btn">
                    <ArrowRight size={20} />
                    Retourner au cours
                </button>
            </div>
        );
    }

    return (
        <div className="quiz-container">
            {/* Indicateur de quiz final */}
            <div className="final-quiz-indicator">
                <Award size={24} />
                <span>Quiz Final - {courseInfo?.titre}</span>
            </div>

            {!submitted ? (
                <div className="quiz-content">
                    <div className="question-navigator">
                        {questions.map((_, index) => (
                            <button
                                key={index}
                                className={`nav-button ${currentQuestion === index ? 'active' : ''} ${isQuestionAnswered(questions[index].id) ? 'answered' : ''}`}
                                onClick={() => setCurrentQuestion(index)}
                            >
                                {index + 1}
                            </button>
                        ))}
                    </div>

                    <div className="current-question">
                        {questions.length > 0 && (
                            <div className="question-card">
                                <h3>Question {currentQuestion + 1}: {questions[currentQuestion].texte}</h3>
                                {renderQuestionContent(questions[currentQuestion])}
                            </div>
                        )}

                        <div className="navigation-buttons">
                            <button onClick={handlePrevQuestion} disabled={currentQuestion === 0} className="nav-btn prev-btn">
                                <ChevronLeft size={20} /> Précédent
                            </button>
                            {currentQuestion < questions.length - 1 ? (
                                <button onClick={handleNextQuestion} className="nav-btn next-btn">
                                    Suivant <ChevronRight size={20} />
                                </button>
                            ) : (
                                <button onClick={confirmSubmit} disabled={submitting} className={`submit-btn ${submitting ? 'loading' : ''}`}>
                                    {submitting ? 'Soumission...' : 'Soumettre le quiz final'}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="quiz-summary">
                        <p>Questions répondues: {getAnsweredQuestionsCount()} / {questions.length}</p>
                        <button onClick={confirmSubmit} disabled={submitting} className={`submit-btn final-submit ${submitting ? 'loading' : ''}`}>
                            {submitting ? 'Soumission en cours...' : 'Terminer et soumettre le quiz final'}
                        </button>
                    </div>
                </div>
            ) : renderResultsContent()}
        </div>
    );
};

export default FinalQuizPage;
