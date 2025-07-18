import React, { useState, useEffect } from "react";

import { useParams } from "react-router-dom";
import './CoursePreview.css';
import { useNavigate } from 'react-router-dom';

export default function CoursePreview() {
    const { courseId } = useParams();
    const [course, setCourse] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [chapters, setChapters] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [enrolled, setEnrolled] = useState(false);
    const [chatMessage, setChatMessage] = useState("");

    const [chatMessages, setChatMessages] = useState([
        { sender: "bot", text: "Hello! I'm your course assistant. How can I help you?" }
    ]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCourseDetails = async () => {
            try {
                // Fetch course details
                const courseResponse = await fetch(`http://localhost:8080/api/course/${courseId}`);
                if (!courseResponse.ok) {
                    throw new Error("Failed to fetch course details");
                }
                const courseData = await courseResponse.json();
                setCourse(courseData);

                // Fetch lessons for this course
                const lessonsResponse = await fetch(`http://localhost:8080/api/lecons/course/${courseId}`);
                if (!lessonsResponse.ok) {
                    throw new Error("Failed to fetch lessons");
                }
                const lessonsData = await lessonsResponse.json();
                const filteredLessons = lessonsData.filter(lesson => !lesson.estSupprimé);
                setLessons(filteredLessons);

                // Fetch all chapters for all lessons at once
                const fetchAllChapters = async () => {
                    const chaptersObj = {};
                    for (const lesson of filteredLessons) {
                        const chaptersResponse = await fetch(`http://localhost:8080/api/chapitre/byLecon/${lesson.id}`);
                        if (chaptersResponse.ok) {
                            const chaptersData = await chaptersResponse.json();
                            chaptersObj[lesson.id] = chaptersData;
                        }
                    }
                    setChapters(chaptersObj);
                };

                await fetchAllChapters();
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        if (courseId) {
            fetchCourseDetails();
        }
    }, [courseId]);

    const handleEnroll = async () => {
        try {
            // Récupérer l'ID de l'étudiant depuis le token
            const token = localStorage.getItem('token') || localStorage.getItem('user-token');
            if (!token) {
                throw new Error("User not authenticated");
            }

            // Décoder le token pour obtenir l'ID de l'étudiant
            const userData = JSON.parse(atob(token.split('.')[1]));
            const studentId = userData.id;

            if (!studentId) {
                throw new Error("Student ID not found in token");
            }

            // Faire une requête POST pour créer l'avancement
            const response = await fetch(`http://localhost:8080/api/avancement/enroll`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    etudiantId: studentId,
                    coursId: courseId
                })
            });

            if (!response.ok) {
                throw new Error("Failed to enroll in course");
            }

            // Si tout s'est bien passé, naviguer vers la page du cours
            setEnrolled(true);
            navigate(`/course-view/${courseId}`);
        } catch (error) {
            console.error("Enrollment error:", error);
            alert("Failed to enroll in course: " + error.message);
        }
    };

    const handleSendMessage = () => {
        if (chatMessage.trim() === "") return;

        setChatMessages(prev => [...prev, { sender: "user", text: chatMessage }]);

        setTimeout(() => {
            setChatMessages(prev => [...prev, {
                sender: "bot",
                text: `I'm here to help you with the course "${course.titreCours}". Feel free to ask any specific questions about the content.`
            }]);
        }, 1000);

        setChatMessage("");
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loader"></div>
                <p>Loading course details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <h2>Error</h2>
                <p>{error}</p>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="error-container">
                <h2>Course not found</h2>
            </div>
        );
    }

    if (enrolled) {
        return (
            <div className="container">
                <div className="course-with-chatbot">
                    <div className="course-content">
                        <div className="course-header">
                            <h1>{course.titreCours}</h1>
                        </div>

                        <div className="course-content-grid">
                            <div className="about-course">
                                <h2>About this course</h2>
                                <p>{course.about}</p>
                            </div>

                            <div className="lessons-section">
                                <h2>Course content</h2>

                                {lessons.length === 0 ? (
                                    <p className="no-lessons">No lessons available for this course.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {lessons.map((lesson) => (
                                            <div key={lesson.id} className="lesson-item">
                                                <div className="lesson-header">
                                                    <div>
                                                        <h3>{lesson.titreLeçon}</h3>
                                                    </div>
                                                </div>

                                                <div className="lesson-content">
                                                    {chapters[lesson.id]?.length > 0 ? (
                                                        <ul className="chapter-list">
                                                            {chapters[lesson.id].map((chapter) => (
                                                                <li key={chapter.id} className="chapter-item">
                                                                    <span>{chapter.titre}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <p className="no-chapters">No chapters available for this lesson.</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="chatbot-container">
                        <div className="chatbot-header">
                            Course Assistant
                        </div>
                        <div className="chatbot-messages">
                            {chatMessages.map((msg, index) => (
                                <div
                                    key={index}
                                    className={`message ${msg.sender === "bot" ? "bot-message" : "user-message"}`}
                                >
                                    {msg.text}
                                </div>
                            ))}
                        </div>
                        <div className="chatbot-input">
                            <input
                                type="text"
                                value={chatMessage}
                                onChange={(e) => setChatMessage(e.target.value)}
                                placeholder="Ask a question..."
                                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                            />
                            <button onClick={handleSendMessage}>Send</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Preview version (before enrollment)
    return (
        <div className="container">
            <div className="course-hero">
                <div className="course-image">
                    {course.image && (
                        <img
                            src={course.image.startsWith('http') ? course.image : `${course.image}`}
                            alt={course.titreCours}
                        />
                    )}
                </div>
                <div className="course-details">
                    <h1>{course.titreCours}</h1>

                    <h5>Description</h5>
                    <p className="course-description">{course.description}</p>

                    <h5>About the course</h5>
                    <p className="course-about">{course.about}</p>

                    <div className="price-enroll">
                        <span className="price">${course.prix}</span>
                        <button
                            className="enroll-button"
                            onClick={handleEnroll}
                        >
                            Enroll now
                        </button>
                    </div>
                </div>
            </div>

            <div className="course-content-simple">
                <h2>Course content</h2>

                {lessons.length === 0 ? (
                    <p className="no-lessons">No lessons available for this course.</p>
                ) : (
                    <div className="lessons-paragraphs">
                        {lessons.map((lesson) => (
                            <div key={lesson.id} className="lesson-block">
                                <h2 className="lesson-title">{lesson.titreLeçon}</h2>

                                {chapters[lesson.id]?.length > 0 ? (
                                    <div className="chapters-list">
                                        {chapters[lesson.id].map((chapter) => (
                                            <p key={chapter.id} className="chapter-paragraph">
                                                {chapter.titre}
                                            </p>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="no-chapters">No chapters available for this lesson.</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}