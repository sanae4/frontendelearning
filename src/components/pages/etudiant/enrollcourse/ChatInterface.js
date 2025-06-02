import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { decodeToken } from '../../../../utils/jwtUtils';

const ChatInterface = ({ courseId, lessonId, chapterId }) => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [conversationId, setConversationId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [studentId, setStudentId] = useState(null);
    const [conversationStarted, setConversationStarted] = useState(false);
    const messagesEndRef = useRef(null);
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.11.113:8080';

    // Get student ID from token on component mount
    useEffect(() => {
        const getUserFromToken = () => {
            const token = localStorage.getItem('token') || localStorage.getItem('user-token');
            if (token) {
                try {
                    const userData = decodeToken(token);
                    if (userData && userData.id && userData.role === 'ROLE_ETUDIANT') {
                        setStudentId(userData.id);
                    } else {
                        console.warn('Token does not contain valid student data');
                        setError('Erreur d\'authentification : Utilisateur non identifié comme étudiant');
                    }
                } catch (err) {
                    console.error('Error decoding token:', err);
                    setError('Erreur d\'authentification');
                }
            } else {
                console.warn('No auth token found');
                setError('Veuillez vous connecter pour utiliser l\'assistant de chat');
            }
        };
        getUserFromToken();
    }, []);

    // Auto-start conversation when component mounts and we have required data
    useEffect(() => {
        const autoStartConversation = async () => {
            if (studentId && courseId && !conversationId && !conversationStarted && !loading) {
                await startConversation();
            }
        };

        autoStartConversation();
    }, [studentId, courseId, conversationId, conversationStarted, loading]);

    // Fetch conversation history if conversationId exists
    useEffect(() => {
        const fetchConversation = async () => {
            if (conversationId) {
                try {
                    const token = localStorage.getItem('token') || localStorage.getItem('user-token');
                    const response = await axios.get(
                        `${API_BASE_URL}/api/conversations/etudiant/${studentId}/course/${courseId}`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );

                    if (response.data && response.data.messages) {
                        const formattedMessages = response.data.messages.map((msg) => ({
                            content: msg.content,
                            sender: msg.senderType === 'AI' ? 'ai' : 'user',
                            timestamp: new Date(msg.dateEnvoi),
                        }));
                        setMessages(formattedMessages);
                    }
                } catch (err) {
                    console.error('Error fetching conversation:', err);
                    // Don't show error for conversation history, just start fresh
                }
            }
        };

        fetchConversation();
    }, [conversationId, API_BASE_URL]);

    // Auto-scroll to the latest message
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Start conversation function
    const startConversation = async () => {
        if (!studentId || !courseId || conversationStarted) return;

        setLoading(true);
        setError(null);
        setConversationStarted(true);

        try {
            const token = localStorage.getItem('token') || localStorage.getItem('user-token');
            if (!token) {
                throw new Error('Authentication required');
            }

            const response = await axios.post(
                `${API_BASE_URL}/api/ai-agent/start-conversation`,
                {
                    etudiantId: studentId,
                    courseId: courseId
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data && response.data.conversationId) {
                setConversationId(response.data.conversationId);

                // Add welcome message
                const welcomeMessage = {
                    content: `Bonjour ! Je suis votre assistant IA pour le cours "${response.data.courseTitle}". Je peux répondre à vos questions sur le contenu du cours. Comment puis-je vous aider aujourd'hui ?`,
                    sender: 'ai',
                    timestamp: new Date(),
                };
                setMessages([welcomeMessage]);
            }
        } catch (err) {
            console.error('Error starting conversation:', err);
            const errorMessage = err.response?.data?.error || 'Erreur lors du démarrage de la conversation';
            setError(errorMessage);
            setConversationStarted(false);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim() || !conversationId) return;

        const userMessage = {
            content: inputMessage,
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputMessage('');
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token') || localStorage.getItem('user-token');
            if (!token) {
                throw new Error('Authentication required');
            }

            const requestData = {
                question: inputMessage,
                conversationId: conversationId
            };

            const response = await axios.post(
                `${API_BASE_URL}/api/ai-agent/ask`,
                requestData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data && response.data.response) {
                const aiMessage = {
                    content: response.data.response,
                    sender: 'ai',
                    timestamp: new Date(),
                };
                setMessages((prev) => [...prev, aiMessage]);
            }
        } catch (err) {
            console.error('Error sending message to AI:', err);
            const errorMessage =
                err.response?.data?.error ||
                err.message ||
                'Une erreur est survenue. Veuillez réessayer plus tard.';
            setError(errorMessage);

            const errorResponseMessage = {
                content: 'Désolé, j\'ai rencontré une erreur. Veuillez réessayer plus tard.',
                sender: 'ai',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorResponseMessage]);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (timestamp) => {
        return new Intl.DateTimeFormat('fr-FR', {
            hour: 'numeric',
            minute: 'numeric',
        }).format(timestamp);
    };

    const retryConnection = () => {
        setError(null);
        setConversationStarted(false);
        setConversationId(null);
        setMessages([]);
        if (studentId && courseId) {
            startConversation();
        }
    };

    return (
        <div className="chat-sidebar" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="chat-header">
                <h3>Course Assistant</h3>
                {conversationId && (
                    <span className="conversation-status">Connected</span>
                )}
            </div>

            {error && (
                <div className="chat-error-banner">
                    <p>{error}</p>
                    <div className="error-actions">
                        <button onClick={() => setError(null)}>Ignorer</button>
                        {!conversationId && (
                            <button onClick={retryConnection}>Réessayer</button>
                        )}
                    </div>
                </div>
            )}

            <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                {!conversationId && !loading && !error ? (
                    <div className="chat-welcome">
                        <p>
                            Préparation de votre assistant IA...
                        </p>
                    </div>
                ) : messages.length === 0 && conversationId ? (
                    <div className="chat-welcome">
                        <p>
                            L'assistant est prêt ! Posez vos questions sur le cours.
                        </p>
                    </div>
                ) : (
                    messages.map((msg, idx) => (
                        <div key={idx} className={`chat-message ${msg.sender}`}>
                            <div className="message-content">{msg.content}</div>
                            <div className="message-timestamp">{formatTime(msg.timestamp)}</div>
                        </div>
                    ))
                )}

                {loading && (
                    <div className="chat-message ai">
                        <div className="message-content loading">
                            <span className="typing-dot">.</span>
                            <span className="typing-dot">.</span>
                            <span className="typing-dot">.</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-form" onSubmit={handleSendMessage} style={{ padding: '1rem' }}>
                <div className="input-container">
                    <input
                        type="text"
                        placeholder={
                            conversationId
                                ? "Ask a question about this course..."
                                : "Preparing..."
                        }
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        disabled={loading || !conversationId}
                        className="chat-input"
                    />
                    <button
                        type="submit"
                        disabled={loading || !inputMessage.trim() || !conversationId}
                        className="chat-send-button"
                    >
                        {loading ? 'Sending...' : 'Send'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatInterface;
