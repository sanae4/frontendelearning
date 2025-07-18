import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import './ChapterForm.css';

const API_URL = 'http://192.168.11.109:8080/api';
const FLASK_API_URL = 'http://localhost:5000'; // Flask API URL

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

const ChapterForm = () => {
    const { courseId: courseIdParam, lessonId } = useParams();
    // Ensure courseId is properly parsed as a number or null if undefined
    const courseId = courseIdParam ? parseInt(courseIdParam) : null;
    const navigate = useNavigate();
    const [showCompletionOptions, setShowCompletionOptions] = useState(false);
    const [createdQuizId, setCreatedQuizId] = useState(null);
    const [chapter, setChapter] = useState({
        title: '',
        type: '',
        file: null,
        videoFile: null,
        videoUrl: '',
        lessonId: lessonId,
        summary: ''
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isEditingSummary, setIsEditingSummary] = useState(false);
    const [chapters, setChapters] = useState([]);
    const [lessonName, setLessonName] = useState('');
    const [showChaptersList, setShowChaptersList] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [contentCol, setContentCol] = useState(''); // Content storage
    const [isProcessingContent, setIsProcessingContent] = useState(false);
    const [contentProcessed, setContentProcessed] = useState(false); // Track if content has been processed
    const [isRegeneratingSummary, setIsRegeneratingSummary] = useState(false); // MODIFIÉ: État pour le bouton de régénération

    // Summary modal states
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [summaryTitle, setSummaryTitle] = useState('');
    const [summaryType, setSummaryType] = useState('standard');
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

    // Quiz states
    const [showQuizOptions, setShowQuizOptions] = useState(false);
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

    // New state for quiz preview
    const [showQuizPreview, setShowQuizPreview] = useState(false);
    const [quizPreviewData, setQuizPreviewData] = useState(null);

    // Auto quiz modal
    const [showAutoQuizModal, setShowAutoQuizModal] = useState(false);
    const [autoQuizTitle, setAutoQuizTitle] = useState('');
    const [autoQuizTypes, setAutoQuizTypes] = useState([]);

    // MODIFIÉ: Ajout des états pour la configuration du quiz
    const [quizConfig, setQuizConfig] = useState({
        nombreQuestions: 5,
        typesQuestions: [],
        niveauDifficulte: 'hard'
    });
    const [existingQuizConfig, setExistingQuizConfig] = useState(null);

    useEffect(() => {
        if (!lessonId) {
            setError('Lesson ID is required');
            return;
        }

        // Fetch lesson name and existing chapters
        const fetchLessonInfo = async () => {
            try {
                console.log(`Fetching lesson info for ID: ${lessonId}`);

                // Get lesson information
                const lessonResponse = await api.get(`/lecons/${lessonId}`);
                console.log('Lesson response:', lessonResponse.data);

                if (lessonResponse.data) {
                    setLessonName(lessonResponse.data.titreLeçon || lessonResponse.data.titreLecon);
                } else {
                    setError('Lesson not found');
                    return;
                }

                // Get chapters for this lesson
                await fetchChapters();

                // MODIFIÉ: Récupérer la configuration de quiz existante
                try {
                    const configResponse = await api.get(`/configquiz/lecons/${lessonId}/quiz-configuration`);
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
                } catch (configErr) {
                    console.log('No existing quiz configuration, using defaults');
                }
            } catch (err) {
                console.error('Error fetching lesson info:', err);

                if (err.response && err.response.status === 401) {
                    setError('Authentication error. Please log in again.');
                    // Redirect to login page after a short delay
                    setTimeout(() => navigate('/login'), 2000);
                } else {
                    setError(`Failed to fetch lesson information: ${err.message || 'Unknown error'}`);
                }
            }
        };

        fetchLessonInfo();
    }, [lessonId, navigate]);

    const fetchChapters = async () => {
        try {
            const response = await api.get(`/chapitre/byLecon/${lessonId}`);
            if (Array.isArray(response.data)) {
                setChapters(response.data);
            } else {
                console.error('Expected array but got:', response.data);
                setChapters([]);
                setError('Invalid data format received for chapters');
            }
        } catch (err) {
            console.error('Error fetching chapters:', err);
            setError('Failed to fetch chapters: ' + (err.message || 'Unknown error'));
            setChapters([]);
        }
    };

    const resetForm = () => {
        setChapter({
            title: '',
            type: '',
            file: null,
            videoFile: null,
            videoUrl: '',
            lessonId: lessonId,
            summary: ''
        });
        setContentCol('');
        setContentProcessed(false);
        setIsEditing(false);
        setEditingId(null);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setChapter({
            ...chapter,
            [name]: value
        });
    };

    const handleTypeChange = (e) => {
        setChapter({
            ...chapter,
            type: e.target.value,
            file: null,
            videoFile: null,
            videoUrl: ''
        });
        setContentCol('');
        setContentProcessed(false);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];

        // Basic file validation
        if (file) {
            if (chapter.type === 'TEXT' && !['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
                setError('Please upload a valid document file (PDF, DOC, DOCX)');
                return;
            }

            // Maximum file size (10MB)
            if (file.size > 10 * 1024 * 1024) {
                setError('File size exceeds the maximum limit (10MB)');
                return;
            }

            setError(''); // Clear error if validation passes
            setContentProcessed(false); // Reset content processing state
        }

        setChapter({
            ...chapter,
            file: file,
            videoUrl: '' // Reset URL if file is selected
        });
    };

    const handleVideoChange = (e) => {
        const file = e.target.files[0];

        // Basic video validation
        if (file) {
            if (!file.type.startsWith('video/')) {
                setError('Please upload a valid video file');
                return;
            }

            // Maximum file size (100MB for video)
            if (file.size > 100 * 1024 * 1024) {
                setError('Video size exceeds the maximum limit (100MB)');
                return;
            }

            setError(''); // Clear error if validation passes
            setContentProcessed(false); // Reset content processing state
        }

        setChapter({
            ...chapter,
            videoFile: file,
            videoUrl: '' // Reset URL if file is selected
        });
    };

    // Handle video URL changes
    const handleVideoUrlChange = (e) => {
        const url = e.target.value;
        setChapter({
            ...chapter,
            videoUrl: url,
            videoFile: null // Reset file if URL is entered
        });
        setContentProcessed(false); // Reset content processing state
    };

    // Process content via Flask API
    const processContent = async () => {
        setIsProcessingContent(true);
        setError('');
        setSuccess('');

        try {
            let response;

            if (chapter.type === 'TEXT' && chapter.file) {
                // Process PDF file
                const formData = new FormData();
                formData.append('fichier', chapter.file);

                response = await axios.post(`${FLASK_API_URL}/traiter-contenu`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });

                if (response.data && response.data.type === 'pdf') {
                    setContentCol(response.data.texte);
                    setChapter({
                        ...chapter,
                        summary: response.data.resume || ''
                    });
                    setSuccess('Summary generated successfully!');
                    setContentProcessed(true);
                }
            }
            else if (chapter.type === 'VIDEO') {
                if (chapter.videoFile) {
                    // Process local video file
                    const formData = new FormData();
                    formData.append('fichier', chapter.videoFile);

                    response = await axios.post(`${FLASK_API_URL}/traiter-contenu`, formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    });

                    if (response.data && response.data.type === 'video') {
                        setContentCol(response.data.transcription);
                        setChapter({
                            ...chapter,
                            summary: response.data.resume || ''
                        });
                        setSuccess('Summary generated successfully!');
                        setContentProcessed(true);
                    }
                }
                else if (chapter.videoUrl) {
                    // Process YouTube video URL
                    response = await axios.post(`${FLASK_API_URL}/traiter-contenu`, {
                        url: chapter.videoUrl
                    }, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.data && response.data.type === 'video_youtube') {
                        setContentCol(response.data.transcription);
                        setChapter({
                            ...chapter,
                            summary: response.data.resume || ''
                        });
                        setSuccess('Summary generated successfully!');
                        setContentProcessed(true);
                    }
                }
                else {
                    setError('Please upload a video file or provide a YouTube URL');
                }
            }
            else {
                setError('Please select a content type and upload a file or provide a URL');
            }
        } catch (err) {
            console.error('Error processing content:', err);
            setError('Failed to process content: ' + (err.response?.data?.erreur || err.message || 'Unknown error'));
        } finally {
            setIsProcessingContent(false);
        }
    };

    const regenerateSummary = async () => {
        setIsRegeneratingSummary(true);
        setError('');
        setSuccess('');

        try {
            if (!contentCol) {
                setError('No content available to regenerate summary from');
                return;
            }

            // Limit content to a reasonable size (10,000 characters)
            const contentToSend = contentCol.substring(0, 10000);

            // Make the request to the new endpoint
            const response = await axios.post(
                `${FLASK_API_URL}/regenerer-resume`,
                {
                    content: contentToSend,
                    langue: 'fr'
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    timeout: 30000  // 30 seconds timeout
                }
            );

            if (response.data && response.data.resume) {
                setChapter({
                    ...chapter,
                    summary: response.data.resume
                });
                setSuccess('Summary regenerated successfully!');
            } else {
                throw new Error("Summary regeneration failed: No resume in response");
            }
        } catch (err) {
            console.error('Error regenerating summary:', err);
            let errorMessage = 'Failed to regenerate summary: ';
            if (err.response) {
                errorMessage += `Server responded with ${err.response.status}`;
                if (err.response.data && err.response.data.erreur) {
                    errorMessage += ` - ${err.response.data.erreur}`;
                }
            } else if (err.request) {
                errorMessage += 'No response from server';
            } else {
                errorMessage += err.message || 'Unknown error';
            }
            setError(errorMessage);
        } finally {
            setIsRegeneratingSummary(false);
        }
    };

    // Close summary modal
    const closeSummaryModal = () => {
        setShowSummaryModal(false);
    };

    // Generate summary with API if content is available, otherwise use template
    const generateSummary = async () => {
        setIsGeneratingSummary(true);

        try {
            if (contentCol) {
                // Use API to generate summary from extracted content
                const response = await axios.post(`${FLASK_API_URL}/generer-quiz`, {
                    content: contentCol.substring(0, 30000), // Limit to 30,000 characters
                    num_questions: 0, // No questions needed
                    language: 'en'  // Changed to English
                }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (response.data && response.data.titre) {
                    // Use quiz title as summary
                    setChapter({
                        ...chapter,
                        summary: response.data.titre
                    });
                    setSuccess('Summary generated successfully!');
                } else {
                    throw new Error("Summary generation failed");
                }
            } else {
                // Use basic template if no content is available
                let generatedSummary = '';

                if (summaryType === 'standard') {
                    generatedSummary = `This chapter titled "${summaryTitle}" covers important concepts and details on the subject.
                    It provides comprehensive information that will help learners understand the key aspects of ${summaryTitle}.
                    The content is designed to be engaging and educational, suitable for all learning levels.`;
                } else if (summaryType === 'detailed') {
                    generatedSummary = `This comprehensive chapter titled "${summaryTitle}" examines in detail the fundamental concepts and practical applications of the subject.
                    It presents an in-depth analysis of theories, methodologies, and concrete examples related to ${summaryTitle}.
                    Learners will find detailed explanations, case studies, and practical exercises to reinforce their understanding.
                    This content is suitable for learners seeking to develop advanced mastery of the subject.`;
                } else if (summaryType === 'brief') {
                    generatedSummary = `Quick overview of chapter "${summaryTitle}".
                    This chapter presents the essential points that every learner should know about this topic.
                    A concise introduction perfect for beginners or as a reminder for advanced learners.`;
                }

                setChapter({
                    ...chapter,
                    summary: generatedSummary
                });

                setSuccess('Summary generated successfully!');
            }
        } catch (err) {
            console.error('Error generating summary:', err);
            setError('Failed to generate summary: ' + (err.response?.data?.error || err.message || 'Unknown error'));
        } finally {
            setIsGeneratingSummary(false);
            setShowSummaryModal(false);
        }
    };

    const toggleEditSummary = () => {
        setIsEditingSummary(!isEditingSummary);
    };

    const handleSummaryChange = (e) => {
        setChapter({
            ...chapter,
            summary: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            // Validate required fields
            if (!chapter.title.trim()) {
                throw new Error('Chapter title is required');
            }

            if (!chapter.type) {
                throw new Error('Please select a content type');
            }

            // Create chapterDTO for backend
            const chapitreDTO = {
                titre: chapter.title,
                type: chapter.type,
                resumer: chapter.summary,
                contentCol: contentCol, // Add extracted content
                leconId: parseInt(lessonId),
                videoUrl: chapter.videoUrl // Add video URL
            };

            // Create FormData for files
            const formData = new FormData();
            formData.append('chapitre', JSON.stringify(chapitreDTO));

            if (chapter.type === 'TEXT' && chapter.file) {
                formData.append('file', chapter.file);
            }

            if (chapter.type === 'VIDEO' && chapter.videoFile) {
                formData.append('videoFile', chapter.videoFile);
            }

            let response;

            if (isEditing) {
                // API call for editing
                response = await api.put(`/chapitre/${editingId}`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                setSuccess('Chapter updated successfully!');
            } else {
                // API call for creation
                response = await api.post(`/chapitre`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                setSuccess('Chapter created successfully!');
            }

            // Update chapters list
            await fetchChapters();

            // Reset form
            resetForm();

            // Show chapters list
            setShowChaptersList(true);

        } catch (err) {
            console.error('Error with chapter:', err);
            setError(err.response?.data?.message || err.message || 'Error during operation');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddAnother = () => {
        setShowChaptersList(false);
        setSuccess('');
        // Reset form
        resetForm();
    };

    const handleFinish = () => {
        // Show quiz options
        setShowQuizOptions(true);
    };

    // Navigate to lessons page
    const navigateToLessons = () => {
        // Add check to ensure courseId is defined
        if (courseId) {
            navigate(`/course/${courseId}/lessons`);
        } else {
            setError("Course ID is missing. Cannot navigate to lessons page.");
        }
    };

    // Edit chapter
    const handleEditChapter = (chapterId) => {
        // Find chapter to edit
        const chapterToEdit = chapters.find(c => c.id === chapterId);
        if (chapterToEdit) {
            // Convert backend data to frontend format
            setChapter({
                title: chapterToEdit.titre,
                type: chapterToEdit.type,
                file: null, // Can't retrieve file, just content
                videoFile: null,
                videoUrl: chapterToEdit.videoUrl || '', // Get video URL if it exists
                lessonId: lessonId,
                summary: chapterToEdit.resumer || ''
            });

            // Set content if available
            if (chapterToEdit.contentCol) {
                setContentCol(chapterToEdit.contentCol);
                setContentProcessed(true);
            }

            // Hide list and show form for editing
            setShowChaptersList(false);
            setIsEditing(true);
            setEditingId(chapterId);
        }
    };

    // Delete chapter
    const handleDeleteChapter = async (chapterId) => {
        if (window.confirm('Are you sure you want to delete this chapter?')) {
            try {
                await api.delete(`/chapitre/${chapterId}`);
                // Update local list after deletion
                setChapters(chapters.filter(c => c.id !== chapterId));
                setSuccess('Chapter deleted successfully');
            } catch (err) {
                console.error('Error deleting chapter:', err);
                setError('Error deleting chapter: ' + (err.message || 'Unknown error'));
            }
        }
    };

    // Quiz creation method change
    const handleQuizCreationMethodChange = (method) => {
        setQuizCreationMethod(method);
        if (method === 'auto') {
            // Show auto quiz modal for title and type selection
            setAutoQuizTitle(`Quiz for ${lessonName}`);

            // MODIFIÉ: Utiliser la configuration existante si disponible
            if (existingQuizConfig) {
                setAutoQuizTypes(existingQuizConfig.typesQuestions ?
                    existingQuizConfig.typesQuestions.split(',') : []);
            } else {
                setAutoQuizTypes([]); // Reset to empty array for multiple selection
            }

            setShowAutoQuizModal(true);
        }
    };

    // Quiz type change to handle multiple selections
    const handleQuizTypeChange = (type) => {
        // Check if the type is already selected
        if (quizTypes.includes(type)) {
            // If selected, remove it
            setQuizTypes(quizTypes.filter(t => t !== type));
        } else {
            // If not selected, add it
            setQuizTypes([...quizTypes, type]);
        }

        // Update current question type to the first selected type or empty if none
        if (currentQuestion.type === '') {
            setCurrentQuestion({
                ...currentQuestion,
                type: quizTypes.length > 0 ? quizTypes[0] : type
            });
        }
    };

    // Navigation functions
    const navigateToQuiz = () => {
        if (createdQuizId) {
            navigate(`/quizzes/${createdQuizId}?lessonId=${lessonId}`);
        }
    };

    const navigateToPublish = () => {
        if (courseId) {
            navigate(`/course/${courseId}/publish`);
        } else {
            setError("Course ID is missing. Cannot navigate to publish page.");
        }
    };

    // Render completion options after quiz creation
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
                        <h3>Publish the course</h3>
                        <p>Your content is ready? Publish your course to make it accessible to learners.</p>
                        <button
                            className="publish-btn"
                            onClick={navigateToPublish}
                        >
                            Finish and publish the course
                        </button>
                    </div>

                    <div className="action-card">
                        <h3>Edit lessons</h3>
                        <p>Need to make changes? Go back to lesson management.</p>
                        <button
                            className="modify-lessons-btn"
                            onClick={navigateToLessons}
                        >
                            Modify lessons
                        </button>
                    </div>
                </div>

                <div className="additional-actions">
                    <button
                        className="view-quiz-btn"
                        onClick={navigateToQuiz}
                    >
                        View created quiz
                    </button>
                </div>
            </div>
        );
    };

    // Auto quiz type handling for multiple selections
    const handleAutoQuizTypeChange = (type) => {
        if (autoQuizTypes.includes(type)) {
            setAutoQuizTypes(autoQuizTypes.filter(t => t !== type));
        } else {
            setAutoQuizTypes([...autoQuizTypes, type]);
        }

        // MODIFIÉ: Mettre à jour également l'état de configuration du quiz
        const updatedTypesQuestions = autoQuizTypes.includes(type)
            ? autoQuizTypes.filter(t => t !== type)
            : [...autoQuizTypes, type];

        setQuizConfig({
            ...quizConfig,
            typesQuestions: updatedTypesQuestions
        });
    };

    // Map UI quiz type to backend format
    const mapQuizTypeToBackend = (uiType) => {
        switch (uiType) {
            case 'True/False': return 'TRUE_FALSE';
            case 'Multiple Choice': return 'MULTIPLE_CHOICE';
            case 'Generative': return 'GENERATIVE';
            default: return uiType; // Already in backend format
        }
    };

    // Map backend quiz type to UI format
    const mapQuizTypeToUI = (backendType) => {
        switch (backendType) {
            case 'TRUE_FALSE': return 'True/False';
            case 'MULTIPLE_CHOICE': return 'Multiple Choice';
            case 'GENERATIVE': return 'Generative';
            default: return backendType;
        }
    };

    const handleQuizTitleChange = (e) => {
        setQuizTitle(e.target.value);
    };

    // Handle question type selection
    const handleQuestionTypeChange = (e) => {
        const type = e.target.value;
        setCurrentQuestion({
            ...currentQuestion,
            type: type,
            options: type === 'Multiple Choice' ? currentQuestion.options : '',
            reponse_correct: type === 'True/False' ? 'True' : ''
        });
    };

    const handleQuestionChange = (e) => {
        const { name, value } = e.target;
        setCurrentQuestion({
            ...currentQuestion,
            [name]: value
        });
    };

    const addQuestion = () => {
        // Validate question
        if (!currentQuestion.texte.trim()) {
            setError('Question text cannot be empty');
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

        // Reset current question with the same type
        setCurrentQuestion({
            texte: '',
            type: currentQuestion.type,
            options: '',
            reponse_correct: ''
        });

        setSuccess('Question added successfully');
        setError(''); // Clear any previous errors
    };

    const removeQuestion = (id) => {
        setQuizQuestions(quizQuestions.filter(q => q.id !== id));
    };

    const handleAutoQuizTitleChange = (e) => {
        setAutoQuizTitle(e.target.value);
    };

    // MODIFIÉ: Gestion des paramètres de configuration de quiz
    const handleQuizConfigChange = (e) => {
        const { name, value } = e.target;
        setQuizConfig({
            ...quizConfig,
            [name]: name === 'nombreQuestions' ? parseInt(value) : value
        });
    };

    const proceedWithAutoGeneration = async () => {
        if (autoQuizTypes.length === 0) {
            setError('Please select at least one quiz type');
            return;
        }

        setShowAutoQuizModal(false);
        setIsLoading(true);

        try {
            // Validate required fields
            if (!autoQuizTitle.trim()) {
                throw new Error('Quiz title is required');
            }

            // Save quiz configuration
            const quizConfigData = {
                nombreQuestions: quizConfig.nombreQuestions,
                typesQuestions: autoQuizTypes.join(','),
                niveauDifficulte: quizConfig.niveauDifficulte
            };

            // Enregistre la configuration du quiz
            await api.put(`/configquiz/lecons/${lessonId}/quiz-configuration`, quizConfigData);

            // SIMPLIFIÉ: Afficher directement les options de finalisation après l'enregistrement
            setShowQuizOptions(false);
            setShowCompletionOptions(true);
            setSuccess('Quiz configuration saved successfully!');

        } catch (err) {
            console.error('Error saving quiz configuration:', err);
            setError(err.response?.data?.message || err.message || 'Error saving quiz configuration');
        } finally {
            setIsLoading(false);
        }
    };


    // Cancel auto quiz modal
    const cancelAutoQuizModal = () => {
        setShowAutoQuizModal(false);
        setQuizCreationMethod('');
    };
    // Preview quiz before creating
    const previewQuiz = () => {
        if (!quizTitle.trim()) {
            setError('Quiz title is required');
            return;
        }

        if (quizQuestions.length === 0) {
            setError('At least one question is required to create a quiz');
            return;
        }

        // Create quiz preview data
        const previewData = {
            title: quizTitle,
            types: quizTypes,
            questions: quizQuestions
        };

        setQuizPreviewData(previewData);
        setShowQuizPreview(true);
    };

    const handleCreateManualQuiz = async () => {
        setIsLoading(true);

        try {
            // Join selected types with comma for the backend
            const quizData = {
                titre: quizTitle,
                leconId: parseInt(lessonId),
                quizType: quizTypes.map(type => mapQuizTypeToBackend(type)).join(','),
                estsupprimer: false,
                questions: quizQuestions.map(q => ({
                    texte: q.texte,
                    type: mapQuizTypeToBackend(q.type),
                    options: q.options,
                    reponse_correct: q.reponse_correct
                }))
            };

            const response = await api.post(`/quizz`, quizData);

            if (response.data && response.data.id) {
                setCreatedQuizId(response.data.id);
                setShowCompletionOptions(true);
                setShowQuizPreview(false); // Hide preview
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (err) {
            console.error('Error creating quiz:', err);
            setError(err.response?.data?.message || err.message || 'Error creating quiz');
        } finally {
            setIsLoading(false);
        }
    };
    // Return to editing from preview
    const returnToQuizEditing = () => {
        setShowQuizPreview(false);
    };

    const cancelQuizCreation = () => {
        setShowQuizOptions(false);
        setQuizCreationMethod('');
        setQuizTypes([]);
        setQuizTitle('');
        setQuizQuestions([]);
        setCurrentQuestion({
            texte: '',
            type: '',
            options: '',
            reponse_correct: ''
        });
    };

    // MODIFIÉ: Fonction améliorée pour rendre la modal de quiz automatique avec la configuration
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

                        {/* MODIFIÉ: Ajout des options de configuration du quiz */}
                        <div className="config-section">
                            <h4>Quiz Configuration</h4>

                            <div className="form-group">
                                <label>Number of Questions</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    name="nombreQuestions"
                                    value={quizConfig.nombreQuestions}
                                    onChange={handleQuizConfigChange}
                                    min="1"
                                    max="20"
                                />
                            </div>


                        </div>
                    </div>
                    <div className="modal-footer">
                        <button className="cancel-btn" onClick={cancelAutoQuizModal}>Cancel</button>
                        <button
                            className="generate-btn"
                            onClick={proceedWithAutoGeneration}
                            disabled={isLoading || autoQuizTypes.length === 0}
                        >
                            {isLoading ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Render summary modal
    const renderSummaryModal = () => {
        if (!showSummaryModal) return null;

        return (
            <div className="modal-overlay">
                <div className="modal-content">
                    <div className="modal-header">
                        <h3>Generate Summary</h3>
                        <button className="close-modal-btn" onClick={closeSummaryModal}>×</button>
                    </div>
                    <div className="modal-body">
                        <div className="form-group">
                            <label>Title for Summary</label>
                            <input
                                type="text"
                                className="form-control"
                                value={summaryTitle}
                                onChange={(e) => setSummaryTitle(e.target.value)}
                                placeholder="Chapter title for summary"
                            />
                        </div>
                        <div className="form-group">
                            <label>Summary Type</label>
                            <div className="type-options">
                                <label>
                                    <input
                                        type="radio"
                                        name="summaryType"
                                        value="brief"
                                        checked={summaryType === 'brief'}
                                        onChange={() => setSummaryType('brief')}
                                    />
                                    Brief (1-2 sentences)
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        name="summaryType"
                                        value="standard"
                                        checked={summaryType === 'standard'}
                                        onChange={() => setSummaryType('standard')}
                                    />
                                    Standard (1 paragraph)
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        name="summaryType"
                                        value="detailed"
                                        checked={summaryType === 'detailed'}
                                        onChange={() => setSummaryType('detailed')}
                                    />
                                    Detailed (multiple paragraphs)
                                </label>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button className="cancel-btn" onClick={closeSummaryModal}>Cancel</button>
                        <button
                            className="generate-btn"
                            onClick={generateSummary}
                            disabled={isGeneratingSummary}
                        >
                            {isGeneratingSummary ? 'Generating...' : 'Generate'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Render quiz preview
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
                                <span className="question-number">{index + 1}</span>
                                <span className={`question-type-badge ${question.type.toLowerCase().replace('/', '-')}`}>
                                    {question.type}
                                </span>
                            </div>
                            <div className="preview-question-body">
                                <p className="question-text">{question.texte}</p>

                                {question.type === 'True/False' && (
                                    <div className="question-tf-answer">
                                        <h5>Correct Answer:</h5>
                                        <div className="tf-options">
                                            <span className={question.reponse_correct === 'True' ? 'selected' : ''}>True</span>
                                            <span className={question.reponse_correct === 'False' ? 'selected' : ''}>False</span>
                                        </div>
                                    </div>
                                )}

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
                    <button className="edit-quiz-btn" onClick={returnToQuizEditing}>
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

    // Quiz options interface with checkboxes for multiple selection
    const renderQuizOptions = () => {
        if (showQuizPreview) {
            return renderQuizPreview();
        }

        return (
            <div className="quiz-options-container">
                <h2 className="quiz-options-title">Create a Quiz</h2>

                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                <div className="quiz-method-selection">
                    <h3>Choose how to create your quiz:</h3>
                    <div className="method-options">
                        <button
                            className={`method-btn ${quizCreationMethod === 'auto' ? 'selected' : ''}`}
                            onClick={() => handleQuizCreationMethodChange('auto')}
                        >
                            Generate Automatically
                        </button>
                        <button
                            className={`method-btn ${quizCreationMethod === 'manual' ? 'selected' : ''}`}
                            onClick={() => handleQuizCreationMethodChange('manual')}
                        >
                            Create Manually
                        </button>
                    </div>
                </div>

                {quizCreationMethod === 'manual' && (
                    <div className="manual-quiz-section">
                        <div className="quiz-basic-info">
                            <div className="form-group">
                                <label>Quiz Title*</label>
                                <input
                                    type="text"
                                    placeholder="Enter quiz title"
                                    className="form-control"
                                    value={quizTitle}
                                    onChange={handleQuizTitleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Question Types* (Select one or more)</label>
                                <div className="type-options checkbox-options">
                                    <label>
                                        <input
                                            type="checkbox"
                                            name="quizType"
                                            value="True/False"
                                            checked={quizTypes.includes('True/False')}
                                            onChange={() => handleQuizTypeChange('True/False')}
                                        />
                                        True/False
                                    </label>
                                    <label>
                                        <input
                                            type="checkbox"
                                            name="quizType"
                                            value="Multiple Choice"
                                            checked={quizTypes.includes('Multiple Choice')}
                                            onChange={() => handleQuizTypeChange('Multiple Choice')}
                                        />
                                        Multiple Choice
                                    </label>
                                    <label>
                                        <input
                                            type="checkbox"
                                            name="quizType"
                                            value="Generative"
                                            checked={quizTypes.includes('Generative')}
                                            onChange={() => handleQuizTypeChange('Generative')}
                                        />
                                        Generative (free response)
                                    </label>
                                </div>
                            </div>
                        </div>

                        {quizTypes.length > 0 && (
                            <div className="questions-section">
                                <h3>Add Questions</h3>

                                <div className="question-form">
                                    <div className="form-group">
                                        <label>Question Text*</label>
                                        <textarea
                                            name="texte"
                                            value={currentQuestion.texte}
                                            onChange={handleQuestionChange}
                                            className="form-control"
                                            rows="3"
                                            placeholder="Enter your question..."
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Question Type*</label>
                                        <select
                                            className="form-control"
                                            value={currentQuestion.type}
                                            onChange={handleQuestionTypeChange}
                                            required
                                        >
                                            <option value="">Select question type</option>
                                            {quizTypes.map(type => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {currentQuestion.type === 'Multiple Choice' && (
                                        <div className="form-group">
                                            <label>Options (separated by commas)*</label>
                                            <input
                                                type="text"
                                                name="options"
                                                value={currentQuestion.options}
                                                onChange={handleQuestionChange}
                                                className="form-control"
                                                placeholder="Option 1, Option 2, Option 3, ..."
                                                required
                                            />
                                        </div>
                                    )}

                                    <div className="form-group">
                                        <label>Correct Answer*</label>
                                        {currentQuestion.type === 'True/False' ? (
                                            <div className="type-options">
                                                <label>
                                                    <input
                                                        type="radio"
                                                        name="reponse_correct"
                                                        value="True"
                                                        checked={currentQuestion.reponse_correct === 'True'}
                                                        onChange={() => setCurrentQuestion({ ...currentQuestion, reponse_correct: 'True' })}
                                                    />
                                                    True
                                                </label>
                                                <label>
                                                    <input
                                                        type="radio"
                                                        name="reponse_correct"
                                                        value="False"
                                                        checked={currentQuestion.reponse_correct === 'False'}
                                                        onChange={() => setCurrentQuestion({ ...currentQuestion, reponse_correct: 'False' })}
                                                    />
                                                    False
                                                </label>
                                            </div>
                                        ) : (
                                            <input
                                                type="text"
                                                name="reponse_correct"
                                                value={currentQuestion.reponse_correct}
                                                onChange={handleQuestionChange}
                                                className="form-control"
                                                placeholder={currentQuestion.type === 'Multiple Choice' ? "Correct option (exactly as in options)" : "Expected keywords in answer (separated by commas)"}
                                                required
                                            />
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        className="add-question-btn"
                                        onClick={addQuestion}
                                        disabled={!currentQuestion.type || !currentQuestion.texte.trim()}
                                    >
                                        Add this question
                                    </button>
                                </div>

                                {quizQuestions.length > 0 && (
                                    <div className="questions-list">
                                        <h4>Added Questions ({quizQuestions.length})</h4>
                                        <div className="questions-grid">
                                            {quizQuestions.map((q, index) => (
                                                <div key={q.id} className="question-card">
                                                    <div className="question-card-header">
                                                        <span className="question-number">{index + 1}</span>
                                                        <span className={`question-type-badge ${q.type.toLowerCase().replace('/', '-')}`}>
                                                            {q.type}
                                                        </span>
                                                        <button
                                                            className="remove-question-btn"
                                                            onClick={() => removeQuestion(q.id)}
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                    <div className="question-card-body">
                                                        <p className="question-text">{q.texte}</p>
                                                        {q.type === 'Multiple Choice' && (
                                                            <div className="question-options">
                                                                <span className="label">Options:</span>
                                                                <span>{q.options}</span>
                                                            </div>
                                                        )}
                                                        <div className="question-answer">
                                                            <span className="label">Answer:</span>
                                                            <span>{q.reponse_correct}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
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
                        className="back-to-lessons-btn"
                        onClick={navigateToLessons}
                    >
                        Back to Lessons
                    </button>
                </div>
            </div>
        );
    };

    // Conditional display based on application state
    if (showCompletionOptions) {
        return renderCompletionOptions();
    }

    if (showQuizOptions) {
        return (
            <>
                {renderQuizOptions()}
                {renderAutoQuizModal()}
            </>
        );
    }

    if (showChaptersList) {
        return (
            <div className="chapters-list-container">
                <h2 className="chapters-list-title">Chapters for: {lessonName}</h2>

                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                {chapters.length === 0 ? (
                    <div className="no-chapters">
                        <p>No chapters have been added for this lesson.</p>
                    </div>
                ) : (
                    <div className="chapters-grid">
                        {chapters.map((chap, index) => (
                            <div key={chap.id} className="chapter-card">
                                <div className="chapter-card-header">
                                    <span className="chapter-number">{index + 1}</span>
                                    <h3 className="chapter-title">{chap.titre}</h3>
                                </div>
                                <div className="chapter-card-body">
                                    <div className="chapter-type">
                                        <span className="type-label">Type:</span>
                                        <span className={`type-value ${chap.type.toLowerCase()}`}>
                                            {chap.type === 'TEXT' ? 'Document' : 'Video'}
                                        </span>
                                    </div>
                                    {chap.videoUrl && (
                                        <div className="chapter-url">
                                            <span className="url-label">URL:</span>
                                            <span className="url-value">{chap.videoUrl}</span>
                                        </div>
                                    )}
                                    <div className="chapter-summary">
                                        <p>{chap.resumer || 'No summary available'}</p>
                                    </div>
                                </div>
                                <div className="chapter-card-footer">
                                    <button
                                        className="edit-chapter-btn"
                                        onClick={() => handleEditChapter(chap.id)}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="delete-chapter-btn"
                                        onClick={() => handleDeleteChapter(chap.id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="chapters-actions">
                    <button
                        className="add-another-btn"
                        onClick={handleAddAnother}
                    >
                        Add New Chapter
                    </button>
                    <button
                        className="finish-btn"
                        onClick={handleFinish}
                        disabled={chapters.length === 0}
                        title={chapters.length === 0 ? "You need to add at least one chapter before creating quizzes" : ""}
                    >
                        Finish and Create Quizzes
                    </button>
                    <button
                        className="back-to-lessons-btn"
                        onClick={navigateToLessons}
                    >
                        Back to Lessons
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="chapter-form-container">
            <div className="chapter-form-header">
                <div className="title-container">
                    <h2 className="chapter-form-title">
                        {isEditing ? 'Edit Chapter' : 'Add New Chapter'}
                    </h2>
                </div>
                <button
                    type="button"
                    className="display-chapters-btn"
                    onClick={() => setShowChaptersList(true)}
                >
                    Show All Chapters
                </button>
            </div>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <form onSubmit={handleSubmit} className="chapter-form">
                <div className="form-group">
                    <label>Chapter Title*</label>
                    <input
                        type="text"
                        name="title"
                        placeholder="Enter chapter title"
                        className="form-control"
                        value={chapter.title}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Content Type*</label>
                    <div className="type-options">
                        <label>
                            <input
                                type="radio"
                                name="type"
                                value="TEXT"
                                checked={chapter.type === 'TEXT'}
                                onChange={handleTypeChange}
                            />
                            <span>Text (PDF/DOC)</span>
                        </label>
                        <label>
                            <input
                                type="radio"
                                name="type"
                                value="VIDEO"
                                checked={chapter.type === 'VIDEO'}
                                onChange={handleTypeChange}
                            />
                            <span>Video</span>
                        </label>
                    </div>
                </div>

                {chapter.type === 'TEXT' && (
                    <div className="form-group">
                        <label>Upload Text File</label>
                        <input
                            type="file"
                            className="form-control"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileChange}
                        />
                        {isEditing && <p className="file-note">Leave empty if you don't want to change the existing file.</p>}
                    </div>
                )}

                {chapter.type === 'VIDEO' && (
                    <>
                        <div className="form-group">
                            <label>Option 1: Upload Video File</label>
                            <input
                                type="file"
                                className="form-control"
                                accept="video/*"
                                onChange={handleVideoChange}
                                disabled={chapter.videoUrl !== ''}
                            />
                            {isEditing && <p className="file-note">Leave empty if you don't want to change the existing video.</p>}
                        </div>

                        <div className="form-group">
                            <label>Option 2: Video URL (YouTube)</label>
                            <input
                                type="text"
                                name="videoUrl"
                                className="form-control"
                                placeholder="Example: https://www.youtube.com/watch?v=abcdefghijk"
                                value={chapter.videoUrl}
                                onChange={handleVideoUrlChange}
                                disabled={chapter.videoFile !== null}
                            />
                            {chapter.videoFile && <p className="file-note">Please delete the selected video file first to use a URL.</p>}
                        </div>
                    </>
                )}

                {/* Button to process content */}
                {(chapter.file || chapter.videoFile || chapter.videoUrl) && (
                    <div className="process-content-section">
                        <button
                            type="button"
                            className="process-content-btn"
                            onClick={processContent}
                            disabled={isProcessingContent || contentProcessed}
                        >
                            {isProcessingContent ? 'Processing...' : contentProcessed ? 'Summary Generated' : 'Generate Summary'}
                        </button>
                    </div>
                )}

                <div className="form-group summary-section">
                    <div className="summary-header">
                        <label>Chapter Summary</label>
                        <div className="summary-actions">
                            {/* MODIFIÉ: Ajout du bouton de régénération du résumé */}
                            {contentProcessed && (
                                <button
                                    type="button"
                                    className="regenerate-summary-btn"
                                    onClick={regenerateSummary}
                                    disabled={isRegeneratingSummary || !contentCol}
                                >
                                    {isRegeneratingSummary ? 'Regenerating...' : 'Regenerate Summary'}
                                </button>
                            )}
                            <button
                                type="button"
                                className={`edit-summary-btn ${isEditingSummary ? 'cancel' : ''}`}
                                onClick={toggleEditSummary}
                            >
                                {isEditingSummary ? 'Cancel' : 'Edit Summary'}
                            </button>
                        </div>
                    </div>

                    {isEditingSummary ? (
                        <textarea
                            className="summary-edit-box"
                            name="summary"
                            value={chapter.summary}
                            onChange={handleSummaryChange}
                            rows="6"
                            placeholder="Enter or edit chapter summary..."
                        />
                    ) : (
                        <div className="summary-display">
                            {chapter.summary || <em>No summary generated. Click "Generate Summary" to create one.</em>}
                        </div>
                    )}
                </div>

                <div className="form-actions">
                    <button type="submit" className="submit-btn" disabled={isLoading}>
                        {isLoading ? 'Processing...' : isEditing ? 'Update Chapter' : 'Create Chapter'}
                    </button>

                    <div className="back-navigation">
                        <button
                            type="button"
                            className="back-to-lessons-btn"
                            onClick={navigateToLessons}
                        >
                            ← Back to Lessons
                        </button>
                    </div>
                </div>
            </form>

            {/* Modals */}
            {renderSummaryModal()}
        </div>
    );
};

export default ChapterForm;