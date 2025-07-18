import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { decodeToken } from '../../../../utils/jwtUtils';
import QuizButton from '../passe_quizz/QuizButton';

const ContentDisplay = ({ course, activeLesson, activeChapter, onChapterComplete, avancement, studentId }) => {
    const [contentUrl, setContentUrl] = useState(null);
    const [contentType, setContentType] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('content');
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState('');
    const [isAddingNote, setIsAddingNote] = useState(false);
    const [chapters, setChapters] = useState([]);
    const [chapterCompleted, setChapterCompleted] = useState(false);
    const [allLessons, setAllLessons] = useState([]); // Ajouter cette ligne
    const [allChaptersMap, setAllChaptersMap] = useState({}); // Ajouter cette ligne

    // Charger toutes les leçons du cours
    useEffect(() => {
        if (course?.id) {
            const fetchAllLessons = async () => {
                try {
                    const response = await axios.get(`http://localhost:8080/api/lecons/course/${course.id}`);
                    setAllLessons(response.data || []);

                    // Charger tous les chapitres pour toutes les leçons
                    const chaptersMap = {};
                    for (const lesson of response.data || []) {
                        try {
                            const chaptersResponse = await axios.get(`http://localhost:8080/api/chapitre/byLecon/${lesson.id}`);
                            chaptersMap[lesson.id] = chaptersResponse.data || [];
                        } catch (err) {
                            console.error(`Error fetching chapters for lesson ${lesson.id}:`, err);
                            chaptersMap[lesson.id] = [];
                        }
                    }
                    setAllChaptersMap(chaptersMap);
                } catch (err) {
                    console.error('Error fetching all lessons:', err);
                }
            };
            fetchAllLessons();
        }
    }, [course?.id]);

    // Vérifier si le chapitre actif est déjà marqué comme complété
    useEffect(() => {
        if (activeChapter && avancement && avancement.chapitresCompletes) {
            const isCompleted = avancement.chapitresCompletes.includes(activeChapter.id);
            setChapterCompleted(isCompleted);
        } else {
            setChapterCompleted(false);
        }
    }, [activeChapter, avancement]);

    // Charger les chapitres de la leçon active
    useEffect(() => {
        if (activeLesson?.id) {
            const fetchChapters = async () => {
                try {
                    const response = await axios.get(`http://localhost:8080/api/lecon/${activeLesson.id}/chapitres`);
                    setChapters(response.data || []);
                } catch (err) {
                    console.error('Error fetching chapters:', err);
                }
            };
            fetchChapters();
        }
    }, [activeLesson]);

    // Charger le contenu du chapitre actif
    useEffect(() => {
        const loadChapterContent = async () => {
            if (!activeChapter) return;

            setLoading(true);
            setError(null);

            try {
                setContentType(activeChapter.type);

                // Pour les vidéos YouTube
                if (activeChapter.type === 'VIDEO' && activeChapter.videoUrl) {
                    setContentUrl(activeChapter.videoUrl);
                    setLoading(false);
                    return;
                }

                // Pour les vidéos stockées en base de données
                if (activeChapter.type === 'VIDEO') {
                    try {
                        const response = await axios.get(
                            `http://localhost:8080/api/chapitre/${activeChapter.id}/content`,
                            { responseType: 'blob' }
                        );

                        const videoBlob = new Blob([response.data], { type: 'video/mp4' });
                        const url = window.URL.createObjectURL(videoBlob);
                        setContentUrl(url);
                        setLoading(false);
                        return;
                    } catch (fetchError) {
                        console.error('Error fetching video content:', fetchError);
                        setError('Unable to load video content. Please try again.');
                    }
                }

                // Pour les PDF ou texte
                if (activeChapter.type === 'PDF' || activeChapter.type === 'TEXT') {
                    try {
                        const response = await axios.get(
                            `http://localhost:8080/api/chapitre/${activeChapter.id}/content`,
                            { responseType: 'blob' }
                        );

                        const contentBlob = new Blob([response.data], { type: 'application/pdf' });
                        const url = window.URL.createObjectURL(contentBlob);
                        setContentUrl(url);
                        setContentType('PDF');
                    } catch (fetchError) {
                        console.error('Error fetching PDF content:', fetchError);
                        setError('Unable to load PDF content. Please try again.');
                    }
                }

                setLoading(false);
            } catch (err) {
                console.error('Error loading content:', err);
                setError('Failed to load content. Please try again later.');
                setLoading(false);
            }
        };

        loadChapterContent();

        return () => {
            if (contentUrl) {
                window.URL.revokeObjectURL(contentUrl);
            }
        };
    }, [activeChapter]);

    // Marquer le chapitre comme terminé
    // Dans ContentDisplay.js, trouvez la fonction markChapterAsComplete
    const allChaptersCompleted = () => {
        if (!activeLesson || !avancement?.chapitresCompletes || !allChaptersMap[activeLesson.id]) {
            return false;
        }

        const chaptersInLesson = allChaptersMap[activeLesson.id] || [];
        const completedChapters = avancement.chapitresCompletes || [];

        // Vérifie si tous les chapitres de la leçon sont dans les chapitres complétés
        return chaptersInLesson.every(chapter =>
            completedChapters.includes(chapter.id)
        );
    };
    const markChapterAsComplete = async () => {
        if (!activeChapter || !studentId || !course || chapterCompleted) return;

        try {
            await onChapterComplete(activeChapter.id);
            setChapterCompleted(true);

            // Vérifier si tous les chapitres sont maintenant complétés
            const updatedCompletedChapters = [...(avancement?.chapitresCompletes || []), activeChapter.id];
            const allChaptersNowCompleted = chapters.every(ch =>
                updatedCompletedChapters.includes(ch.id)
            );

            if (allChaptersNowCompleted) {
                console.log("Tous les chapitres de la leçon sont complétés!");
                // Forcer une mise à jour de l'interface ici si nécessaire
            }
        } catch (error) {
            console.error('Error marking chapter as complete:', error);
        }
    };


    // Déterminer si c'est la fin du cours (logique corrigée)
    const isEndOfCourse = () => {
        if (!activeChapter || !activeLesson || !allLessons.length || !Object.keys(allChaptersMap).length) {
            return false;
        }

        // Trouver la dernière leçon du cours
        const lastLesson = allLessons[allLessons.length - 1];

        // Si on n'est pas dans la dernière leçon, ce n'est pas la fin du cours
        if (activeLesson.id !== lastLesson.id) {
            return false;
        }

        // Récupérer les chapitres de la dernière leçon
        const lastLessonChapters = allChaptersMap[lastLesson.id] || [];

        if (lastLessonChapters.length === 0) {
            return false;
        }

        // Vérifier si le chapitre actuel est le dernier chapitre de la dernière leçon
        const lastChapter = lastLessonChapters[lastLessonChapters.length - 1];

        return activeChapter.id === lastChapter.id;
    };

    // Vérifier si l'étudiant peut passer le quiz final
    const peutPasserQuizFinal = () => {
        return avancement?.autorisationQuizFinal || avancement?.coursTermine || false;
    };

    const handleAddNote = () => {
        if (newNote.trim()) {
            setNotes([...notes, {
                id: Date.now(),
                content: newNote,
                timestamp: new Date().toLocaleString()
            }]);
            setNewNote('');
            setIsAddingNote(false);
        }
    };

    const handleDeleteNote = (id) => {
        setNotes(notes.filter(note => note.id !== id));
    };

    const renderContent = () => {
        if (loading) return <div className="content-loading">Loading content...</div>;
        if (error) return <div className="content-error">{error}</div>;
        if (!activeChapter)
            return (
                <div className="content-placeholder">
                    Select a chapter to view its content
                </div>
            );

        // For YouTube videos, extract the video ID if applicable
        if (contentType === 'VIDEO' && activeChapter.videoUrl) {
            let videoId = activeChapter.videoUrl;
            if (activeChapter.videoUrl.includes('youtube.com/watch?v=')) {
                videoId = activeChapter.videoUrl.split('v=')[1]?.split('&')[0];
            } else if (activeChapter.videoUrl.includes('youtu.be/')) {
                videoId = activeChapter.videoUrl.split('youtu.be/')[1];
            }

            return (
                <div className="video-container">
                    <iframe
                        src={`http://www.youtube.com/embed/${videoId}`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                </div>
            );
        }

        // Direct video file
        if (contentType === 'VIDEO') {
            return (
                <div className="video-container">
                    <video controls style={{ width: '100%' }}>
                        <source src={contentUrl} type="video/mp4" />
                        Your browser does not support video playback.
                    </video>
                </div>
            );
        }

        // Display PDF in read-only mode
        if (contentType === 'PDF') {
            const readOnlyPdfUrl = `${contentUrl}#toolbar=0&navpanes=0&scrollbar=0`;
            return (
                <div className="pdf-container">
                    <embed
                        src={readOnlyPdfUrl}
                        type="application/pdf"
                        width="100%"
                        height="100%"
                        style={{ border: 'none' }}
                    />
                </div>
            );
        }

        return (
            <div className="content-placeholder">Content type not supported</div>
        );
    };

    const renderNotes = () => {
        if (!activeChapter) return null;

        return (
            <div className="notes">
                <h4>Your Notes</h4>

                {notes.length > 0 ? (
                    <ul className="notes-list">
                        {notes.map(note => (
                            <li key={note.id}>
                                <p>{note.content}</p>
                                <div>
                                    <span>{note.timestamp}</span>
                                    <button onClick={() => handleDeleteNote(note.id)}>×</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No notes yet</p>
                )}

                {isAddingNote ? (
                    <div className="add-note">
                        <textarea
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            placeholder="Write your note..."
                        />
                        <div>
                            <button onClick={handleAddNote}>Save</button>
                            <button onClick={() => setIsAddingNote(false)}>Cancel</button>
                        </div>
                    </div>
                ) : (
                    <button onClick={() => setIsAddingNote(true)}>+ Add Note</button>
                )}
            </div>
        );
    };

    const renderSummary = () => {
        if (!activeChapter) return null;

        return (
            <div className="notes-content">
                <p>{activeChapter.resumer || "No summary available for this chapter."}</p>
            </div>
        );
    };

    return (
        <div className="content-area">
            <div className="content-header">
                <h2>{course?.titreCours}</h2>
                <h3>
                    {activeLesson?.titreLeçon} {activeChapter && `- ${activeChapter.titre}`}
                </h3>
                {avancement && (
                    <div className="progression-info">
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${avancement.pourcentageCompletion || 0}%` }}
                            ></div>
                        </div>
                        <span className="progress-text">
                            {avancement.pourcentageCompletion || 0}% completed
                        </span>
                    </div>
                )}
            </div>

            {activeChapter && (
                <ul className="content-nav">
                    <li className="nav-item">
                        <a
                            className={`nav-link ${activeTab === 'content' ? 'active' : ''}`}
                            href="#content"
                            onClick={(e) => {
                                e.preventDefault();
                                setActiveTab('content');
                            }}
                        >
                            Content
                        </a>
                    </li>
                    <li className="nav-item">
                        <a
                            className={`nav-link ${activeTab === 'notes' ? 'active' : ''}`}
                            href="#notes"
                            onClick={(e) => {
                                e.preventDefault();
                                setActiveTab('notes');
                            }}
                        >
                            Notes
                        </a>
                    </li>
                    <li className="nav-item">
                        <a
                            className={`nav-link ${activeTab === 'summary' ? 'active' : ''}`}
                            href="#summary"
                            onClick={(e) => {
                                e.preventDefault();
                                setActiveTab('summary');
                            }}
                        >
                            Summary
                        </a>
                    </li>
                </ul>
            )}

            <div className="content-wrapper">
                <div className="content-main">
                    {activeTab === 'content' && (
                        <div className="content-display">
                            {renderContent()}
                            <div className="chapter-actions">
                                {!chapterCompleted && activeChapter && !allChaptersCompleted() && (
                                    <button
                                        className="mark-complete-btn"
                                        onClick={markChapterAsComplete}
                                    >
                                        Mark as Completed
                                    </button>
                                )}
                                {chapterCompleted && !allChaptersCompleted() && (
                                    <span className="completed-badge">✓ Completed</span>
                                )}

                                {/* Afficher le bouton de quiz si tous les chapitres sont complétés */}
                                {allChaptersCompleted() && (
                                    <QuizButton
                                        studentId={studentId}
                                        lessonId={activeLesson?.id}
                                        courseId={course?.id}
                                        isEndOfCourse={isEndOfCourse()}
                                        peutPasserQuizFinal={peutPasserQuizFinal()}
                                        showLessonQuiz={true} // Nouvelle prop pour afficher le quiz de leçon
                                        completedChapters={avancement?.chapitresCompletes || []}
                                        chapters={allChaptersMap[activeLesson?.id] || []}
                                        course={course} // Pass the course object
                                        activeLesson={activeLesson} // Pass the active lesson object
                                    />
                                )}
                            </div>
                            {/* Dans la méthode renderContent() de ContentDisplay.js */}
                            {activeChapter && (
                                <div>
                                    <QuizButton
                                        studentId={studentId}
                                        lessonId={activeLesson?.id}
                                        courseId={course?.id}
                                        isEndOfCourse={isEndOfCourse()}
                                        peutPasserQuizFinal={peutPasserQuizFinal()}
                                        // Ajout des nouvelles props
                                        chaptersInLesson={chapters}
                                        completedChapters={avancement?.chapitresCompletes || []}
                                        allLessonsQuizzesPassed={avancement?.toutesLesLeconsTerminees || false}
                                    />
                                </div>
                            )}

                        </div>
                    )}
                    {activeTab === 'notes' && (
                        <div className="notes-content-wrapper">
                            {renderNotes()}
                        </div>
                    )}
                    {activeTab === 'summary' && (
                        <div className="notes-content-wrapper">
                            {renderSummary()}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContentDisplay;