import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import './Configquiz.css';

const ConfigQuiz = () => {
    const { id } = useParams();
    const location = useLocation();
    const [configData, setConfigData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [entityTitle, setEntityTitle] = useState('');

    // Determine if we're on a course or lesson route
    const isLesson = location.pathname.includes('/quiz-config/lesson/');
    const entityType = isLesson ? 'lesson' : 'course';
    const apiEndpoint = isLesson
        ? `http://192.168.11.113:8080/api/configquiz/lecons/${id}/quiz-configuration`
        : `http://192.168.11.113:8080/api/configquiz/cours/${id}/quiz-configuration`;

    // API endpoint to fetch the entity title
    const titleEndpoint = isLesson
        ? `http://192.168.11.113:8080/api/lecons/${id}`
        : `http://192.168.11.113:8080/api/cours/${id}`;

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // First fetch the entity title
                const titleResponse = await axios.get(titleEndpoint);
                setEntityTitle(titleResponse.data.titre_lecon || `Untitled ${entityType}`);

                // Then fetch the quiz configuration
                const configResponse = await axios.get(apiEndpoint);
                setConfigData(configResponse.data);
                setError(null);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError(
                    err.response?.data ||
                    `Error loading quiz configuration for ${entityType} ID: ${id}`
                );
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [apiEndpoint, titleEndpoint, entityType, id]);

    if (loading) {
        return (
            <div className="config-quiz-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="config-quiz-container">
                <div className="error-message">
                    <h2>Error</h2>
                    <p>{error}</p>
                    <p>Failed to load quiz configuration.</p>
                </div>
            </div>
        );
    }

    if (!configData) {
        return (
            <div className="config-quiz-container">
                <div className="no-data-message">
                    <h2>No configuration</h2>
                    <p>No quiz configuration found for this {entityType}.</p>
                </div>
            </div>
        );
    }

    // Format question types for display
    const questionTypes = configData.typesQuestions
        ? configData.typesQuestions.split(',').map(type => {
            const typeMap = {
                'multiplechoice': 'Multiple choice',
                'boolean': 'True/False',
                'generative': 'Open-ended questions'
            };
            return typeMap[type.trim()] || type.trim();
        })
        : [];

    // Format difficulty level
    const difficultyLabel = {
        'easy': 'Easy',
        'medium': 'Medium',
        'hard': 'Hard'
    }[configData.niveauDifficulte] || configData.niveauDifficulte;

    return (
        <div className="config-quiz-container">
            <div className="config-header">
                <h1>Quiz Configuration</h1>
                <p className="entity-info">
                    For {entityType}: <span className="entity-title">"{entityTitle}"</span>
                </p>
            </div>

            <div className="config-card">
                <div className="config-item">
                    <h3>Number of Questions</h3>
                    <div className="config-value">{configData.nombreQuestions || 'Not defined'}</div>
                </div>

                <div className="config-item">
                    <h3>Difficulty Level</h3>
                    <div className="config-value difficulty-badge">
                        {difficultyLabel}
                    </div>
                </div>

                <div className="config-item">
                    <h3>Question Types</h3>
                    <div className="config-value">
                        {questionTypes.length > 0 ? (
                            <ul className="question-types-list">
                                {questionTypes.map((type, index) => (
                                    <li key={index} className="question-type-badge">{type}</li>
                                ))}
                            </ul>
                        ) : (
                            'Not defined'
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfigQuiz;