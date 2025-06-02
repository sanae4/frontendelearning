import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import CourseSidebar from './CourseSidebar'; // Assuming improved version is in the same directory
import ContentDisplay from './ContentDisplay'; // Assuming improved version is in the same directory
import ChatInterface from './ChatInterface'; // Assuming this component exists and is styled appropriately
import { decodeToken } from '../../../../utils/jwtUtils'; // Ensure path is correct
import './CourseEnrollmentPage.css'; // Import the IMPROVED CSS file

const CourseEnrollmentPage = () => {
    const { courseId } = useParams();
    const [course, setCourse] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [activeLesson, setActiveLesson] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [activeChapter, setActiveChapter] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [studentId, setStudentId] = useState(null);
    const [avancement, setAvancement] = useState(null); // Student progress data

    // Effect to add/remove body class for potentially hiding global navbar
    useEffect(() => {
        document.body.classList.add('no-navbar');
        return () => {
            document.body.classList.remove('no-navbar');
        };
    }, []);

    // Effect to get student ID from JWT token
    useEffect(() => {
        const token = localStorage.getItem('token') || localStorage.getItem('user-token');
        if (token) {
            try {
                const userData = decodeToken(token);
                if (userData?.id && userData.role === 'ROLE_ETUDIANT') {
                    setStudentId(userData.id);
                } else {
                    console.warn('Token does not contain valid student ID or role.');
                    setError('Impossible de vérifier votre identité. Veuillez vous reconnecter.');
                }
            } catch (err) {
                console.error('Error decoding token:', err);
                setError('Session invalide. Veuillez vous reconnecter.');
            }
        } else {
            console.warn('No authentication token found.');
            setError('Veuillez vous connecter pour accéder au cours.');
        }
    }, []);

    // Effect to fetch course data, lessons, and student progress
    useEffect(() => {
        // Only fetch if courseId and studentId are available
        if (!courseId || !studentId) return;

        const fetchCourseData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Use environment variables for API base URL
                const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.11.113:8080';

                // Fetch course details, lessons, and progress concurrently
                const [courseRes, lessonsRes, avancementRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/api/course/${courseId}`),
                    axios.get(`${API_BASE_URL}/api/lecons/course/${courseId}`),
                    axios.get(`${API_BASE_URL}/api/avancement/${studentId}/${courseId}`)
                ]);

                const courseData = courseRes.data;
                const lessonsData = lessonsRes.data;
                const avancementData = avancementRes.data;

                setCourse(courseData);
                setLessons(lessonsData);
                setAvancement(avancementData);

                // Determine initial active lesson and chapter based on progress
                let initialLesson = null;
                let initialChapter = null;
                let initialChapters = [];

                const lastLessonId = avancementData?.derniereLessonId;
                const lastChapterId = avancementData?.dernierChapitreId;

                if (lastLessonId && lessonsData.length > 0) {
                    initialLesson = lessonsData.find(lesson => lesson.id === lastLessonId) || lessonsData[0];
                } else if (lessonsData.length > 0) {
                    initialLesson = lessonsData[0];
                }

                if (initialLesson) {
                    // Fetch chapters for the initial lesson
                    const chaptersRes = await axios.get(`${API_BASE_URL}/api/chapitre/byLecon/${initialLesson.id}`);
                    initialChapters = chaptersRes.data;
                    setChapters(initialChapters);

                    if (lastChapterId && initialChapters.length > 0) {
                        initialChapter = initialChapters.find(chap => chap.id === lastChapterId) || initialChapters[0];
                    } else if (initialChapters.length > 0) {
                        initialChapter = initialChapters[0];
                        // If it's the first visit to this chapter, update progress
                        if (!lastLessonId || !lastChapterId) {
                            await axios.put(
                                `${API_BASE_URL}/api/avancement/${studentId}/${courseId}/dernier-chapitre`,
                                { chapitreId: initialChapter.id, lessonId: initialLesson.id }
                            );
                            // Refresh avancement data after update
                            const updatedAvancementRes = await axios.get(`${API_BASE_URL}/api/avancement/${studentId}/${courseId}`);
                            setAvancement(updatedAvancementRes.data);
                        }
                    }
                }

                setActiveLesson(initialLesson);
                setActiveChapter(initialChapter);

            } catch (err) {
                console.error('Error fetching course data:', err);
                setError('Impossible de charger le contenu du cours. Veuillez réessayer plus tard.');
            } finally {
                setLoading(false);
            }
        };

        fetchCourseData();
    }, [courseId, studentId]); // Dependencies: courseId and studentId

    // Handler for selecting a lesson
    const handleLessonSelect = async (lesson) => {
        if (lesson.id === activeLesson?.id) return; // Avoid reloading if same lesson clicked

        setActiveLesson(lesson);
        setActiveChapter(null); // Reset chapter when lesson changes
        setChapters([]); // Clear chapters while loading new ones
        setLoading(true); // Indicate loading state for chapters

        try {
            const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.11.113:8080';
            const chaptersResponse = await axios.get(`${API_BASE_URL}/api/chapitre/byLecon/${lesson.id}`);
            const newChapters = chaptersResponse.data;
            setChapters(newChapters);

            if (newChapters.length > 0) {
                const firstChapter = newChapters[0];
                setActiveChapter(firstChapter);
                // Update progress for the first chapter of the new lesson
                await axios.put(
                    `${API_BASE_URL}/api/avancement/${studentId}/${courseId}/dernier-chapitre`,
                    { chapitreId: firstChapter.id, lessonId: lesson.id }
                );
                // Refresh avancement data
                const updatedAvancementRes = await axios.get(`${API_BASE_URL}/api/avancement/${studentId}/${courseId}`);
                setAvancement(updatedAvancementRes.data);
            } else {
                // If lesson has no chapters, update progress to reflect lesson selection but no chapter
                await axios.put(
                    `${API_BASE_URL}/api/avancement/${studentId}/${courseId}/dernier-chapitre`,
                    { chapitreId: null, lessonId: lesson.id }
                );
                const updatedAvancementRes = await axios.get(`${API_BASE_URL}/api/avancement/${studentId}/${courseId}`);
                setAvancement(updatedAvancementRes.data);
            }
        } catch (err) {
            console.error('Error fetching chapters:', err);
            setError('Impossible de charger les chapitres pour cette leçon.');
        } finally {
            setLoading(false);
        }
    };

    // Handler for selecting a chapter
    const handleChapterSelect = async (chapter) => {
        if (chapter.id === activeChapter?.id) return; // Avoid reloading if same chapter clicked

        setActiveChapter(chapter);
        try {
            const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.11.113:8080';
            // Update the last viewed chapter in the backend
            await axios.put(
                `${API_BASE_URL}/api/avancement/${studentId}/${courseId}/dernier-chapitre`,
                { chapitreId: chapter.id, lessonId: activeLesson.id }
            );
            // No need to refresh avancement here unless chapter selection itself changes completion status
        } catch (err) {
            console.error('Error updating progress:', err);
            // Handle error silently or show a small notification
        }
    };

    // Handler for marking a chapter as complete
    const handleChapterComplete = async (chapitreId) => {
        if (!studentId || !courseId || !chapitreId) return;

        // Prevent marking complete if already completed
        if (avancement?.chapitresCompletes?.includes(chapitreId)) return;

        try {
            const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.11.113:8080';
            // Mark chapter as complete
            const updatedAvancementRes = await axios.post(
                `${API_BASE_URL}/api/avancement/${studentId}/${courseId}/chapitre/${chapitreId}`
            );
            setAvancement(updatedAvancementRes.data); // Update progress state
        } catch (err) {
            console.error('Error marking chapter as complete:', err);
            setError('Erreur lors de la mise à jour de la progression.');
        }
    };

    // Render loading state
    if (loading && !course) { // Show initial loading state
        return <div className="loading-container">Chargement du cours...</div>;
    }

    // Render error state
    if (error) {
        return <div className="error-container">{error}</div>;
    }

    // Render main content
    return (
        <div className="course-enrollment-container">
            <CourseSidebar
                lessons={lessons}
                chapters={chapters}
                activeLesson={activeLesson}
                activeChapter={activeChapter}
                onLessonSelect={handleLessonSelect}
                onChapterSelect={handleChapterSelect}
                completedChapters={avancement?.chapitresCompletes || []}
            // Pass progress percentage if needed by sidebar
            // progressPercentage={avancement?.pourcentageCompletion || 0}
            />

            <ContentDisplay
                course={course}
                activeLesson={activeLesson}
                activeChapter={activeChapter}
                onChapterComplete={handleChapterComplete}
                avancement={avancement} // Pass the whole progress object
                studentId={studentId}
                isLoading={loading} // Pass loading state for chapter changes
            />

            {/* Assuming ChatInterface is a separate component */}
            <ChatInterface
                courseId={courseId}
                lessonId={activeLesson?.id}
                chapterId={activeChapter?.id}
                studentId={studentId}
            />
        </div>
    );
};

export default CourseEnrollmentPage;

