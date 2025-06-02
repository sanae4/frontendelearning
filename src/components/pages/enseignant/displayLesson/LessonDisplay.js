import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LessonDisplay.css';

const API_URL = 'http://192.168.11.113:8080/api';

const api = axios.create({
    baseURL: API_URL
});

api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const LessonDisplay = () => {
    const { courseId, lessonId } = useParams();
    const navigate = useNavigate();

    const [lesson, setLesson] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [activeChapter, setActiveChapter] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [contentUrls, setContentUrls] = useState({});
    const [contentTypes, setContentTypes] = useState({});

    const getYoutubeVideoId = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const isYoutubeUrl = (str) => {
        if (!str || typeof str !== 'string') return false;
        return str.includes('youtube.com') || str.includes('youtu.be');
    };

    const determineContentType = (chapter) => {
        // Vérifier d'abord si le contenu semble être un PDF encodé en base64
        if (chapter.contenu && typeof chapter.contenu === 'string' &&
            (chapter.contenu.startsWith('JVBERi') || chapter.contenu.startsWith('JVBERI'))) {
            return 'pdf';
        }

        // Ensuite vérifier le champ type explicite
        if (chapter.type) {
            const lowerType = chapter.type.toLowerCase();
            if (lowerType.includes('pdf')) {
                return 'pdf';
            }
            if (lowerType.includes('youtube') || isYoutubeUrl(chapter.videoUrl || '')) {
                return 'youtube';
            }
            if (lowerType.includes('video')) {
                return 'video';
            }
            if (lowerType.includes('text')) {
                return 'text';
            }
        }

        // Puis vérifier les URLs vidéo
        if (chapter.videoUrl) {
            return isYoutubeUrl(chapter.videoUrl) ? 'youtube' : 'video';
        }

        // Ensuite vérifier le contenu texte
        if (chapter.contentCol) {
            return 'text';
        }

        // Enfin, vérifier le contenu binaire
        if (chapter.contenu) {
            // Si le contenu est une chaîne qui commence par des données qui ressemblent à un PDF
            try {
                // Si c'est une chaîne et semble être un PDF encodé en base64
                if (typeof chapter.contenu === 'string') {
                    const pdfSignature = 'JVBERi'; // Signature PDF en base64
                    if (chapter.contenu.substring(0, 6) === pdfSignature) {
                        return 'pdf';
                    }
                }
            } catch (e) {
                console.error("Erreur lors de la détection du type:", e);
            }

            return 'binary';
        }

        return 'unknown';
    };

    useEffect(() => {
        const fetchLessonData = async () => {
            setLoading(true);
            setError('');

            try {
                const cleanLessonId = lessonId.replace(':', '');

                // Fetch lesson details
                const lessonResponse = await api.get(`/lecons/${cleanLessonId}`);
                setLesson(lessonResponse.data);

                // Fetch chapters
                const chaptersResponse = await api.get(`/chapitre/byLecon/${cleanLessonId}`);
                setChapters(chaptersResponse.data);

                // Set first chapter as active if available
                if (chaptersResponse.data && chaptersResponse.data.length > 0) {
                    setActiveChapter(chaptersResponse.data[0]);
                }
            } catch (err) {
                console.error("Error fetching lesson data:", err);
                setError(err.response?.data?.message || err.message || 'Error loading lesson content');
            } finally {
                setLoading(false);
            }
        };

        if (lessonId) {
            fetchLessonData();
        }
    }, [lessonId]);

    useEffect(() => {
        if (!activeChapter) return;

        const processChapterContent = async () => {
            const contentType = determineContentType(activeChapter);
            let contentUrl = '';

            console.log('Processing chapter content:', { contentType, chapter: activeChapter });

            try {
                switch (contentType) {
                    case 'youtube':
                        contentUrl = activeChapter.videoUrl;
                        break;
                    case 'pdf': {
                        // Vérifions d'abord si le contenu est déjà en base64
                        if (typeof activeChapter.contenu === 'string' &&
                            (activeChapter.contenu.startsWith('JVBERi') ||
                                activeChapter.contenu.startsWith('JVBERI'))) {

                            // Conversion directe de la chaîne base64 en blob
                            const binaryString = window.atob(activeChapter.contenu);
                            const len = binaryString.length;
                            const bytes = new Uint8Array(len);

                            for (let i = 0; i < len; i++) {
                                bytes[i] = binaryString.charCodeAt(i);
                            }

                            const blob = new Blob([bytes.buffer], { type: 'application/pdf' });
                            contentUrl = URL.createObjectURL(blob);
                        } else {
                            // Sinon, obtenez le contenu via l'API
                            const response = await api.get(`/chapitre/${activeChapter.id}/content`, {
                                responseType: 'blob'
                            });

                            console.log('PDF response headers:', response.headers);
                            const blob = new Blob([response.data], { type: 'application/pdf' });
                            contentUrl = URL.createObjectURL(blob);
                        }
                        break;
                    }
                    case 'video': {
                        const response = await api.get(`/chapitre/${activeChapter.id}/content`, {
                            responseType: 'blob'
                        });
                        const blob = new Blob([response.data], { type: 'video/mp4' });
                        contentUrl = URL.createObjectURL(blob);
                        break;
                    }
                    case 'text':
                        contentUrl = activeChapter.contentCol || '';
                        break;
                    default:
                        contentUrl = activeChapter.contentCol || '';
                }

                setContentUrls(prev => ({ ...prev, [activeChapter.id]: contentUrl }));
                setContentTypes(prev => ({ ...prev, [activeChapter.id]: contentType }));
            } catch (error) {
                console.error("Error loading chapter content:", error);
                console.error("Error details:", error.response || error.message);
                setContentTypes(prev => ({ ...prev, [activeChapter.id]: 'error' }));
                setContentUrls(prev => ({ ...prev, [activeChapter.id]: `Error loading content: ${error.message}` }));
            }
        };
        processChapterContent();

        return () => {
            // Clean up object URLs
            Object.values(contentUrls).forEach(url => {
                if (url && url.startsWith('blob:')) {
                    URL.revokeObjectURL(url);
                }
            });
        };
    }, [activeChapter]);

    const handleChapterClick = (chapter) => {
        setActiveChapter(chapter);
    };

    const handleBackClick = () => {
        navigate(`/course/${courseId}/lessons`);
    };

    const renderChapterContent = () => {
        if (!activeChapter) return <p>Select a chapter to display its content</p>;

        const contentUrl = contentUrls[activeChapter.id];
        const contentType = contentTypes[activeChapter.id];

        if (!contentUrl) {
            return (
                <div className="chapter-loading">
                    <div className="loading-spinner"><div className="spinner"></div></div>
                    <p>Loading content...</p>
                </div>
            );
        }

        switch (contentType) {
            case 'youtube':
                const videoId = getYoutubeVideoId(contentUrl);
                return (
                    <div className="video-container youtube-container">
                        <iframe
                            src={`https://www.youtube.com/embed/${videoId}`}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="youtube-iframe"
                        ></iframe>
                    </div>
                );
            case 'video':
                return (
                    <div className="video-container">
                        <video controls className="chapter-video" src={contentUrl}>
                            Your browser does not support the video tag.
                        </video>
                    </div>
                );
            case 'pdf':
                return (
                    <div className="pdf-container">
                        {contentUrl ? (
                            <>
                                <object
                                    data={contentUrl}
                                    type="application/pdf"
                                    width="100%"
                                    height="600px"
                                    style={{ minHeight: '500px' }}
                                >
                                    <p>Votre navigateur ne peut pas afficher ce PDF.
                                        <a href={contentUrl} download={`chapter-${activeChapter.id}.pdf`}>
                                            Téléchargez-le ici
                                        </a> à la place.</p>
                                </object>

                                <div className="pdf-download-link">
                                    <a href={contentUrl} download={`chapter-${activeChapter.id}.pdf`}>
                                        Télécharger PDF
                                    </a>
                                </div>
                            </>
                        ) : (
                            <p>Impossible de charger le contenu PDF</p>
                        )}
                    </div>
                );

            case 'text':
                return (
                    <div className="text-content">
                        <pre>{contentUrl}</pre>
                    </div>
                );
            case 'url':
                return (
                    <div className="url-content">
                        <a href={contentUrl} target="_blank" rel="noopener noreferrer">
                            Open external content
                        </a>
                    </div>
                );
            default:
                return (
                    <div className="fallback-content">
                        <p>Content type not supported</p>
                        {contentUrl && <pre>{contentUrl.substring(0, 200)}</pre>}
                    </div>
                );
        }
    };

    if (loading) {
        return (
            <div className="lesson-display-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading course...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="lesson-display-container">
                <div className="error-message">
                    <h3>Error loading content</h3>
                    <p>{error}</p>
                    <button className="back-button" onClick={handleBackClick}>Back</button>
                </div>
            </div>
        );
    }

    if (!lesson) {
        return (
            <div className="lesson-display-container">
                <div className="error-message">
                    <h3>Lesson not found</h3>
                    <p>The requested lesson could not be found.</p>
                    <button className="back-button" onClick={handleBackClick}>Back</button>
                </div>
            </div>
        );
    }

    return (
        <div className="lesson-display-container">
            <div className="lesson-header">
                <button className="back-button" onClick={handleBackClick}>
                    <i className="fas fa-arrow-left"></i> Back
                </button>
                <div className="lesson-title-container">
                    <h2 className="lesson-title">{lesson.titreLeçon || lesson.titreLecon}</h2>
                    {lesson.description && (
                        <p className="lesson-description">{lesson.description}</p>
                    )}
                </div>
            </div>

            <div className="lesson-content">
                <div className="chapters-sidebar">
                    <h3>Chapters</h3>
                    {chapters.length === 0 ? (
                        <p className="no-chapters">No chapters available for this lesson</p>
                    ) : (
                        <ul className="chapters-list">
                            {chapters.map((chapter) => (
                                <li
                                    key={chapter.id}
                                    className={`chapter-item ${activeChapter?.id === chapter.id ? 'active' : ''}`}
                                    onClick={() => handleChapterClick(chapter)}
                                >
                                    <div className="chapter-item-content">
                                        <span className="chapter-title">{chapter.titre}</span>
                                        <span className="chapter-type-badge">
                                            {chapter.type || 'Content'}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="chapter-content-display">
                    {activeChapter ? (
                        <>
                            <div className="active-chapter-header">
                                <h3>{activeChapter.titre}</h3>
                                <span className="chapter-type">
                                    {contentTypes[activeChapter.id] || 'Content'}
                                </span>
                            </div>
                            <div className="chapter-content-container">
                                {renderChapterContent()}
                            </div>
                        </>
                    ) : (
                        <div className="no-chapter-selected">
                            <p>Select a chapter from the sidebar to display its content</p>
                        </div>
                    )}
                </div>
            </div>

            {lesson.conseilsEnseignant && (
                <div className="teacher-advice">
                    <h4>Teacher's advice</h4>
                    <p>{lesson.conseilsEnseignant}</p>
                </div>
            )}
        </div>
    );
};

export default LessonDisplay;