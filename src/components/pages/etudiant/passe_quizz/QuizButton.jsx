import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './QuizButton.css'; // Import the updated CSS

const QuizButton = ({
  studentId,
  lessonId,
  courseId,
  isEndOfCourse, // Indicates if the context is the end of the course
  canTakeFinalQuiz, // Boolean indicating if the final quiz can be taken
  showLessonQuiz = false,// Explicitly control lesson quiz button visibility
  course, // Add course prop to access course.defaultQuizConfiguration
  activeLesson // Add activeLesson prop to access lesson.defaultQuizConfiguration
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleStartQuiz = async (isCourseFinal = false) => {
    setLoading(true);
    setError(null);

    try {
      // API endpoint should be configurable or passed as prop
      const apiUrl = 'http://localhost:8080/api/generation/etudiants/quizzes-from-config';
      let configurationId = null;
      if (isCourseFinal) {
        configurationId = course?.defaultQuizConfiguration?.id;
      } else {
        configurationId = activeLesson?.defaultQuizConfiguration?.id;
      }
      const payload = {

        leconId: !isCourseFinal ? lessonId : null,
        etudiantIds: [studentId],
        configurationId: configurationId
      };
      const response = await axios.post(apiUrl, payload);

      // Assuming the API returns an array and we need the first quiz ID
      const quizId = response.data?.[0]?.id;

      if (quizId) {
        navigate(`/quiz/${quizId}`, { state: { lessonId } });
      } else {
        console.warn('Quiz generation response did not contain a valid ID:', response.data);
        setError('No quiz could be generated. Please try again.');
      }
    } catch (err) {
      console.error('Error generating quiz:', err);
      const errorMessage = err.response?.data?.message || 'An error occurred while generating the quiz.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Determine button text based on loading state
  const lessonButtonText = loading ? 'Loading...' : 'Take the Quiz';
  const finalButtonText = loading ? 'Loading...' : 'Take the Final Quiz';

  return (
    <div className="quiz-button-container">
      {/* Display error banner if there's an error */}
      {error && (
        <div className="quiz-info-banner warning-banner" role="alert">
          {error}
          {/* Optionally add a retry button or close button here */}
          {/* <button onClick={() => setError(null)}>&times;</button> */}
        </div>
      )}

      {/* Lesson Quiz Button */}
      {showLessonQuiz && (
        <button
          type="button"
          className="quiz-button lesson-quiz"
          onClick={() => handleStartQuiz(false)}
          disabled={loading || !lessonId}
          aria-busy={loading}
          aria-live="polite"
        >
          {lessonButtonText}
        </button>
      )}

      {/* Final Quiz Button */}
      {isEndOfCourse && canTakeFinalQuiz && (
        <button
          type="button"
          className="quiz-button final-quiz"
          onClick={() => handleStartQuiz(true)}
          disabled={loading}
          aria-busy={loading}
          aria-live="polite"
        >
          {finalButtonText}
        </button>
      )}

      {/* Optional: Add a message if the final quiz cannot be taken yet */}
      {isEndOfCourse && !canTakeFinalQuiz && !loading && (
        <div className="quiz-info-banner">
          Complete all chapters to access the final quiz.
        </div>
      )}
    </div>
  );
};

export default QuizButton;