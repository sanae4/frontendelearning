import React from 'react';
import { useNavigate } from 'react-router-dom'; // Importez useNavigate
import './create_course.css'; // Importez le fichier CSS pour le style
import course from '../../../assets/course.png';

const CreateCourse = () => {
    const navigate = useNavigate(); // Utilisez le hook useNavigate

    const handleStartNow = () => {
        navigate('/courseform'); // Redirige vers la page Course_add
    };

    return (
        <div className="create-course-container">
            <div className="create-course-image">
                <img src={course} alt="Create Course" />
            </div>
            <div className="create-course-content">
                <h1>Create course</h1>
                <p>Create your course and start teaching</p>
                <button className="start-now-button" onClick={handleStartNow}>Start now!</button>
            </div>
        </div>
    );
};

export default CreateCourse;