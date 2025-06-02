import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getUserIdFromToken } from '../../../../utils/jwtUtils';
import axios from 'axios';
import { CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight, Award, BookOpen, RefreshCw, ArrowRight, RotateCcw } from 'lucide-react';
import './QuizPage.css';
import CertificateButton from '../certification/CertificateButton';

const QuizPage = () => {
    const location = useLocation();
    const { isFinalQuiz } = location.state || {};
    const { lessonId } = location.state || {};
    const { quizId } = useParams();
    const navigate = useNavigate();
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [result, setResult] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [questionsWithAnswers, setQuestionsWithAnswers] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [courseInfo, setCourseInfo] = useState(null);
    const [studentInfo, setStudentInfo] = useState(null);
    // États pour gérer les informations du quiz et de l'avancement
    const [quizInfo, setQuizInfo] = useState(null);
    const [avancementInfo, setAvancementInfo] = useState(null);
    const [isLessonQuiz, setIsLessonQuiz] = useState(false);
    const [courseId, setCourseId] = useState(null);
    const [etudiantId, setEtudiantId] = useState(null);
    const [courseConfigQuiz, setCourseConfigQuiz] = useState(null);
    const [generatingFinalQuiz, setGeneratingFinalQuiz] = useState(false);

    // Nouvel état pour suivre le nombre d'échecs au quiz
    const [echecs, setEchecs] = useState(0);

    useEffect(() => {
        // Récupérer le nombre d'échecs précédent depuis localStorage
        const quizEchecsKey = `quiz_echecs_${quizId}`;
        const echecsPrecedents = localStorage.getItem(quizEchecsKey);

        if (echecsPrecedents) {
            setEchecs(parseInt(echecsPrecedents));
        }

        const fetchQuizData = async () => {
            try {
                // Récupérer les informations du quiz
                const quizResponse = await axios.get(`http://192.168.11.113:8080/api/question/quiz-generated/${quizId}`);
                const quizData = quizResponse.data;
                setQuizInfo(quizData);
                console.log("Quiz data:", quizData);

                // Déterminer si c'est un quiz de leçon et récupérer les IDs nécessaires
                if (lessonId) {
                    setIsLessonQuiz(true);
                    console.log("C'est un quiz de leçon avec ID:", lessonId);

                    try {
                        // Récupérer les informations de la leçon
                        const lessonResponse = await axios.get(`http://192.168.11.113:8080/api/lecons/${lessonId}`);
                        const lessonData = lessonResponse.data;
                        console.log("Lesson data:", lessonData);

                        // Récupérer directement le courseId depuis lessonData
                        if (lessonData.courseId) {
                            console.log("Course ID trouvé dans lessonData:", lessonData.courseId);
                            setCourseId(lessonData.courseId);

                            // Récupérer l'ID de l'étudiant
                            const studentId = getCurrentStudentId();
                            setEtudiantId(studentId);

                            // Récupérer les informations du cours avec sa configuration de quiz
                            try {
                                const courseResponse = await axios.get(`http://192.168.11.113:8080/api/course/${lessonData.courseId}`);
                                const courseData = courseResponse.data;
                                console.log("Course data:", courseData);

                                // Récupérer la configuration de quiz par défaut du cours
                                if (courseData.defaultQuizConfigurationId
                                ) {
                                    setCourseConfigQuiz(courseData.defaultQuizConfigurationId
                                    );
                                    console.log("Course quiz config:", courseData.defaultQuizConfigurationId
                                    );
                                } else {
                                    console.warn("Aucune configuration de quiz par défaut trouvée pour le cours");
                                }
                            } catch (courseError) {
                                console.error("Erreur lors de la récupération des données du cours:", courseError);
                            }

                            // Récupérer les informations d'avancement
                            const avancementResponse = await axios.get(`http://192.168.11.113:8080/api/avancement/${studentId}/${lessonData.courseId}`);
                            const avancementData = avancementResponse.data;
                            console.log("Avancement data:", avancementData);
                            setAvancementInfo(avancementData);
                        } else {
                            console.error("Pas de courseId trouvé dans les données de la leçon:", lessonData);
                        }
                    } catch (error) {
                        console.error("Erreur lors de la récupération des données de la leçon:", error);
                    }

                } else {
                    console.log("Ce n'est pas un quiz de leçon");
                    const isFinalQuiz = true;
                }

                // Récupérer les questions
                const questionsResponse = await axios.get(`http://192.168.11.113:8080/api/question/quiz-generated/${quizId}`);
                const questionsWithoutAnswers = questionsResponse.data.map(question => ({
                    ...question,
                    reponsCcorrect: undefined,
                    explanation: undefined
                }));
                setQuestions(questionsWithoutAnswers);
            } catch (err) {
                setError(err.response?.data?.message || 'Erreur lors du chargement du quiz');
                console.error('Erreur:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchQuizData();
    }, [quizId]);
    const getStudentName = () => {
        return studentInfo?.nom && studentInfo?.prenom
            ? `${studentInfo.prenom} ${studentInfo.nom}`
            : 'Étudiant';
    };

    const getCourseName = () => {
        return courseInfo?.titre || 'Cours';
    };

    const getTeacherName = () => {
        return courseInfo?.enseignant?.nom && courseInfo?.enseignant?.prenom
            ? `${courseInfo.enseignant.prenom} ${courseInfo.enseignant.nom}`
            : 'Enseignant';
    };
    // Fonction pour récupérer l'ID de l'étudiant
    const getCurrentStudentId = () => {
        // D'abord essayer de récupérer depuis localStorage
        let studentId = getUserIdFromToken();

        if (studentId) {
            console.log('StudentId trouvé dans localStorage:', studentId);
            return parseInt(studentId, 10);
        }

        // Si pas trouvé, essayer de le récupérer depuis le token


        if (studentId) {
            console.log('StudentId récupéré depuis le token:', studentId);
            // Le stocker pour les prochaines fois
            localStorage.setItem('studentId', studentId.toString());
            return studentId;
        }

        console.warn('Aucun studentId trouvé');
        return null;
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

            const resultResponse = await axios.post(
                `http://192.168.11.113:8080/api/resultat/quiz-genere/${quizId}/soumettre`,
                reponses
            );

            setResult(resultResponse.data);

            // Si le quiz est échoué, incrémenter le compteur d'échecs
            if (!resultResponse.data.estpasse && isLessonQuiz) {
                const nouveauNombreEchecs = echecs + 1;
                setEchecs(nouveauNombreEchecs);

                // Sauvegarder le nombre d'échecs dans localStorage
                localStorage.setItem(`quiz_echecs_${quizId}`, nouveauNombreEchecs.toString());
            }

            const questionsWithAnswersPromises = questions.map(async (question) => {
                const fullQuestionResponse = await axios.get(`http://192.168.11.113:8080/api/question/${question.id}`);
                return { ...fullQuestionResponse.data, userAnswer: answers[question.id] || '' };
            });

            const fullQuestions = await Promise.all(questionsWithAnswersPromises);
            setQuestionsWithAnswers(fullQuestions);
            setSubmitted(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la soumission du quiz');
            console.error('Erreur de soumission:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const confirmSubmit = () => {
        const answeredCount = getAnsweredQuestionsCount();
        const totalQuestions = questions.length;
        if (answeredCount < totalQuestions && !window.confirm(`Vous n'avez pas répondu à ${totalQuestions - answeredCount} question(s). Voulez-vous vraiment soumettre le quiz ?`)) return;
        handleSubmit();
    };

    const checkAnswerCorrectness = (question, userAnswer) => {
        const questionType = getNormalizedQuestionType(question.type);
        const correctAnswer = question.reponsCcorrect;
        if (!userAnswer || !correctAnswer) return false;
        if (questionType === 'generative') return null;
        return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
    };

    const handleRetryQuiz = () => {
        // Réinitialiser l'état du quiz
        setAnswers({});
        setSubmitted(false);
        setResult(null);
        setQuestionsWithAnswers([]);
        setCurrentQuestion(0);
    };

    const handleReturnToCourse = () => {
        if (courseId) {
            navigate(`/course-view/${courseId}`);
        } else {
            navigate('/');
        }
    };

    const handleGoToFinalQuiz = async () => {
        // Vérifications préliminaires
        if (!courseId || !etudiantId) {
            console.error("Missing required data for final quiz");
            setError("Impossible de générer le quiz final. Données manquantes.");
            return;
        }

        try {
            setGeneratingFinalQuiz(true);
            console.log("Génération du quiz final avec:", {
                courseId,
                etudiantId,
                configurationId: courseConfigQuiz.id
            });

            // Payload pour générer le quiz final
            const payload = {
                coursId: courseId,
                etudiantIds: [etudiantId],
                configurationId: courseConfigQuiz.id
            };

            // Appel API pour générer le quiz final
            const response = await axios.post(
                'http://192.168.11.113:8080/api/generation/etudiants/quizzes-from-config',
                payload
            );

            console.log("Réponse de génération de quiz:", response.data);

            const generatedQuizId = response.data?.[0]?.id;

            if (generatedQuizId) {
                console.log("Quiz final généré avec ID:", generatedQuizId);
                // Rediriger vers la page du quiz final
                navigate(`/quiz/${generatedQuizId}`, {
                    state: {
                        isFinalQuiz: true,
                        courseId: courseId
                    }
                });
                // Recharger la page après un court délai
                setTimeout(() => {
                    window.location.reload();
                }, 100); // 100ms de délai pour s'assurer que la navigation est complète
            } else {
                throw new Error("No quiz ID returned from API");
            }
        } catch (err) {
            console.error("Erreur lors de la génération du quiz final:", err);
            const errorMessage = err.response?.data?.message || "Erreur lors de la génération du quiz final";
            setError(errorMessage);
        } finally {
            setGeneratingFinalQuiz(false);
        }
    };

    // Nouvelle fonction pour gérer la réinitialisation de l'apprentissage
    const handleRestartLearning = async () => {
        try {
            if (etudiantId && courseId) {
                // Réinitialiser l'avancement de l'étudiant pour ce cours
                await axios.post(`http://192.168.11.113:8080/api/avancement/${etudiantId}/${courseId}/restart`);

                // Réinitialiser le compteur d'échecs dans localStorage
                localStorage.removeItem(`quiz_echecs_${quizId}`);

                // Rediriger vers la première leçon du cours
                navigate(`/course-view/${courseId}`);
            }
        } catch (err) {
            console.error("Erreur lors de la réinitialisation de l'apprentissage:", err);
            setError("Une erreur est survenue lors de la réinitialisation de votre apprentissage. Veuillez réessayer.");
        }
    };

    const renderSuccessActions = () => {
        if (!result?.estpasse) {

            return null;
        }
        const isFinalQuiz = location.state?.isFinalQuiz;
        console.log("Debug - isFinalQuiz:", isFinalQuiz, "result.estpasse:", result?.estpasse);

        if (isFinalQuiz) {
            return (

                <div className="certificate-success">
                    <div className="final-congratulations">
                        <Award size={48} className="icon-award" />
                        <h3>🎉 Congratulations! You've completed the course!</h3>
                        <p>You can now obtain your certificate of completion.</p>
                    </div>
                    <CertificateButton
                        studentId={etudiantId}
                        courseId={courseId}
                    />

                </div>
            );
        }
        return (
            <div className="success-actions">
                {avancementInfo?.autorisationQuizFinal ? (
                    <div className="final-quiz-ready">
                        <div className="congratulations">
                            <Award size={48} className="icon-award" />
                            <h3>Congratulations! You're ready for the final quiz!</h3>
                            <p>You've completed all the lessons in the course. You can now take the final quiz.</p>
                        </div>
                        <button
                            onClick={handleGoToFinalQuiz}
                            className="action-btn final-quiz-btn"
                            disabled={generatingFinalQuiz || !courseConfigQuiz}
                        >
                            {generatingFinalQuiz ? (
                                <span>Loading quiz...</span>
                            ) : (
                                <>
                                    <Award size={20} />
                                    Take final quiz
                                </>
                            )}
                        </button>

                    </div>
                ) : (
                    <div className="continue-learning">
                        <div className="encouragement">
                            <BookOpen size={48} className="icon-book" />
                            <h3>Great work!</h3>
                            <p>Continue your learning by returning to the course.</p>
                        </div>
                        <button onClick={handleReturnToCourse} className="action-btn continue-btn">
                            <ArrowRight size={20} />
                            Return to course
                        </button>
                    </div>
                )}

            </div>
        );
    };

    const renderFailureActions = () => {
        // Si le quiz est réussi, ne rien afficher
        if (result?.estpasse) {
            return (
                isLessonQuiz && (
                    <button onClick={handleReturnToCourse} className="action-btn return-btn">
                        <BookOpen size={20} />
                        Return to course
                    </button>
                )
            );
        }

        return (
            <div className="failure-actions">
                <div className="encouragement-failure">
                    <h3>Don't get discouraged!</h3>
                    {/* Afficher un message spécifique si l'étudiant a échoué 3 fois ou plus */}
                    {echecs >= 3 ? (
                        <p>You've failed this quiz multiple times. It might be helpful to restart your learning from the beginning.</p>
                    ) : (
                        <p>You can retake the quiz or return to the course to review.</p>
                    )}
                </div>
                <div className="action-buttons">
                    {/* Afficher le bouton de reprise à zéro uniquement après 3 échecs */}
                    {echecs >= 3 && isLessonQuiz && (
                        <button onClick={handleRestartLearning} className="action-btn restart-btn">
                            <RotateCcw size={20} />
                            Restart learning
                        </button>
                    )}
                    {/* Ne montrer le bouton "Reprendre le quiz" que si moins de 3 échecs */}
                    {echecs < 3 && (
                        <button onClick={handleRetryQuiz} className="action-btn retry-btn">
                            <RefreshCw size={20} />
                            Retake quiz
                        </button>
                    )}
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
        if (!result || !questionsWithAnswers.length) return <div className="loading">Chargement des résultats...</div>;

        return (
            <div className="simple-results-container">
                <div className="results-summary">
                    <h2>Quiz Resultsz</h2>
                    <div className={`result-status ${result.estpasse ? 'passed' : 'failed'}`}>
                        {result.estpasse ? (
                            <>
                                <CheckCircle size={32} className="icon-passed" />
                                <span>Quiz Passed</span>
                            </>
                        ) : (
                            <>
                                <XCircle size={32} className="icon-failed" />
                                <span>Quiz Failed</span>
                            </>
                        )}
                    </div>
                    <div className="score-display">
                        Your score: <span className="score-value">{result.score}%</span>
                    </div>
                    <div className="score-breakdown">
                        <div className="correct-answers">
                            <CheckCircle size={20} className="icon-correct" />
                            {Math.round((result.score / 100) * questionsWithAnswers.length)}  correct answers
                        </div>
                        <div className="incorrect-answers">
                            <XCircle size={20} className="icon-incorrect" />
                            {questionsWithAnswers.length - Math.round((result.score / 100) * questionsWithAnswers.length)} incorrect answers
                        </div>
                    </div>
                </div>

                {/* Afficher les actions selon le résultat */}
                {result.estpasse ? renderSuccessActions() : renderFailureActions()}

                <div className="questions-review">
                    <h3>Answer Details</h3>
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
                                            <strong>Your answer:</strong> {question.userAnswer || <em>Aucune réponse</em>}
                                        </div>
                                        <div className="correct-answer">
                                            <strong>Correct answer:</strong> {question.reponsCcorrect}
                                        </div>
                                    </div>
                                    {question.explanation && (
                                        <div className="explanation">
                                            <strong>Explanation:</strong> {question.explanation}
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

    if (loading) return <div className="loading">Loading quiz...</div>;
    if (error) return <div className="error">{error}</div>;
    if (questions.length === 0) return <div className="empty-quiz">No questions available for this quiz.</div>;

    return (
        <div className="quiz-container">
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
                                    {submitting ? 'Soumission...' : 'Soumettre le quiz'}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="quiz-summary">
                        <p>Questions répondues: {getAnsweredQuestionsCount()} / {questions.length}</p>
                        <button onClick={confirmSubmit} disabled={submitting} className={`submit-btn final-submit ${submitting ? 'loading' : ''}`}>
                            {submitting ? 'Soumission en cours...' : 'Terminer et soumettre'}
                        </button>
                    </div>
                </div>
            ) : renderResultsContent()}
        </div>
    );
};

export default QuizPage;
