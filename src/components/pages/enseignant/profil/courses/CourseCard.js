import React from 'react';
import './CourseCard.css';
import { useNavigate } from 'react-router-dom';

const CourseCard = ({ course, onEdit }) => {
    // Function to determine status badge color
    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'PUBLISHED':
                return 'status-badge-published';
            case 'APPROVED':
                return 'status-badge-approved';
            case 'DRAFT':
                return 'status-badge-draft';
            default:
                return 'status-badge-draft';
        }
    };
    const navigate = useNavigate();

    const navigateToCourse = (courseId) => {
        navigate(`/coursepreview/${courseId}`); // Adjust the path as needed
    };

    // Fonction pour éditer un cours
    const handleEditCourse = () => {
        if (onEdit) {
            onEdit(course.id);
        } else {
            navigate(`/course/${course.id}/lessons`);
        }
    };

    // Status translation
    const translateStatus = (status) => {
        switch (status) {
            case 'PUBLISHED':
                return 'Published';
            case 'APPROVED':
                return 'Approved';
            case 'DRAFT':
                return 'Draft';
            default:
                return status;
        }
    };

    return (
        <div className="course-card">
            <div className="course-image">
                {course.image ? (
                    <img src={course.image} alt={course.titreCours} />
                ) : (
                    <div className="placeholder-image">
                        <i className="fas fa-book-open"></i>
                    </div>
                )}
                <span className={`status-badge ${getStatusBadgeClass(course.statusCours)}`}>
                    {translateStatus(course.statusCours)}
                </span>
            </div>

            <div className="course-content">
                <h3 className="course-title">{course.titreCours}</h3>

                <div className="course-meta">
                    <div className="meta-item">
                        <i className="fas fa-layer-group"></i>
                        <span>{course.courselevel || 'Level not defined'}</span>
                    </div>
                    <div className="meta-item">
                        <i className="fas fa-language"></i>
                        <span>{course.langage || 'Not specified'}</span>
                    </div>
                    <div className="meta-item">
                        <i className="fas fa-tag"></i>
                        <span>{course.category ? course.category.titre : 'Uncategorized'}</span>
                    </div>
                </div>

                <p className="course-description">
                    {course.description?.length > 120
                        ? `${course.description.substring(0, 120)}...`
                        : course.description || 'No description'}
                </p>

                <div className="course-footer">
                    <div className="course-price">
                        {course.prix > 0 ? `${course.prix.toFixed(2)} €` : 'Free'}
                    </div>
                    <div className="course-actions">
                        <button
                            className="btn btn-primary btn-sm"
                            onClick={() => navigateToCourse(course.id)}
                        >
                            <i className="fas fa-eye"></i> View
                        </button>

                        {/* Bouton d'édition pour les cours en statut DRAFT */}
                        {course.statusCours === 'DRAFT' && (
                            <button
                                className="btn btn-warning btn-sm edit-button"
                                onClick={handleEditCourse}
                            >
                                <i className="fas fa-edit"></i> Modify
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseCard;
