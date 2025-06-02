import React, { useEffect, useState } from 'react';
import CourseService from '../../../../../services/CourseService';
import { Link } from 'react-router-dom';
import './TeacherCourses.css';

const TeacherCourses = () => {
    const [courses, setCourses] = useState([]);
    const [filteredCourses, setFilteredCourses] = useState([]);
    const [activeFilter, setActiveFilter] = useState('APPROVED');
    const [isLoading, setIsLoading] = useState(true);
    const [showProfileModal, setShowProfileModal] = useState(false);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                setIsLoading(true);
                const data = await CourseService.getCoursesByTeacher();
                setCourses(data);
                setFilteredCourses(data.filter(course => course.courseStatus === 'APPROVED'));
            } catch (error) {
                console.error("Error fetching courses:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCourses();
    }, []);

    const handleFilterChange = (status) => {
        setActiveFilter(status);
        if (status === 'ALL') {
            setFilteredCourses(courses);
        } else {
            setFilteredCourses(courses.filter(course => course.courseStatus === status));
        }
    };

    const getStatusBadge = (courseStatus) => {
        const statusClasses = {
            'DRAFT': 'status-draft',
            'APPROVED': 'status-approved',
            'PUBLISHED': 'status-published'
        };

        const statusText = {
            'DRAFT': 'Draft',
            'APPROVED': 'Approved',
            'PUBLISHED': 'Published'
        };

        return (
            <span className={`status-badge ${statusClasses[courseStatus] || 'status-default'}`}>
                {statusText[courseStatus] || courseStatus || 'Unknown'}
            </span>
        );
    };

    return (
        <div className="teacher-courses-container">
            {/* Modal for editing personal info */}
            {showProfileModal && (
                <div className="profile-modal-overlay">
                    <div className="profile-modal">
                        <h3>Edit My Information</h3>
                        <form className="profile-form">
                            <div className="form-group">
                                <label>Full Name</label>
                                <input type="text" placeholder="Your name" />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input type="email" placeholder="Your email" />
                            </div>
                            <div className="form-group">
                                <label>Bio</label>
                                <textarea placeholder="A brief description"></textarea>
                            </div>
                            <div className="form-actions">
                                <button type="button" className="cancel-btn" onClick={() => setShowProfileModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="save-btn">
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <header className="courses-header">
                <div className="header-content">
                    <h1>My Courses</h1>
                    <p>Manage and view your courses by their status</p>
                </div>
                <button
                    className="edit-profile-btn"
                    onClick={() => setShowProfileModal(true)}
                >
                    <i className="fas fa-user-edit"></i> Edit Profile
                </button>
            </header>

            <StatusFilter activeFilter={activeFilter} onFilterChange={handleFilterChange} />

            {isLoading ? (
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading courses...</p>
                </div>
            ) : filteredCourses.length === 0 ? (
                <div className="empty-state">
                    <img src="/images/empty-courses.svg" alt="No courses" className="empty-image" />
                    <h3>No courses found</h3>
                    <p>
                        {activeFilter === 'APPROVED'
                            ? "You don't have any approved courses yet."
                            : activeFilter === 'PUBLISHED'
                                ? "You don't have any published courses yet."
                                : activeFilter === 'DRAFT'
                                    ? "You don't have any course drafts."
                                    : "You haven't created any courses yet."}
                    </p>
                    <Link to="/create-course" className="create-course-btn">
                        Create New Course
                    </Link>
                </div>
            ) : (
                <div className="courses-grid">
                    {filteredCourses.map(course => (
                        <div key={course.id} className="course-card">
                            <div className="course-image-container">
                                <img
                                    src={course.image || '/images/course-placeholder.jpg'}
                                    alt={course.courseTitle}
                                    className="course-image"
                                />
                                <div className="course-status">
                                    {getStatusBadge(course.courseStatus)}
                                </div>
                            </div>
                            <div className="course-content">
                                <h2>{course.courseTitle}</h2>
                                <p className="course-description">
                                    {course.description && course.description.length > 100
                                        ? `${course.description.substring(0, 100)}...`
                                        : course.description || "No description available."}
                                </p>
                                <div className="course-meta">
                                    <span className="meta-item">
                                        <i className="fas fa-users"></i> {course.students || 0} students
                                    </span>
                                    <span className="meta-item">
                                        <i className="fas fa-star"></i> {course.rating || 'N/A'}
                                    </span>
                                </div>
                            </div>
                            <div className="course-actions">
                                <Link to={`/coursepreview/${course.id}`} className="view-btn">
                                    <i className="fas fa-eye"></i> View
                                </Link>

                                {/* Bouton d'édition pour les cours en statut DRAFT - Plus visible */}
                                {course.courseStatus === 'DRAFT' && (
                                    <Link to={`/edit-course/${course.id}`} className="edit-btn edit-draft-btn">
                                        <i className="fas fa-edit"></i> Modifier
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Composant StatusFilter supposé être défini ailleurs
const StatusFilter = ({ activeFilter, onFilterChange }) => (
    <div className="status-filter">
        <button
            className={activeFilter === 'ALL' ? 'active' : ''}
            onClick={() => onFilterChange('ALL')}
        >
            All
        </button>
        <button
            className={activeFilter === 'APPROVED' ? 'active' : ''}
            onClick={() => onFilterChange('APPROVED')}
        >
            Approved
        </button>
        <button
            className={activeFilter === 'PUBLISHED' ? 'active' : ''}
            onClick={() => onFilterChange('PUBLISHED')}
        >
            Published
        </button>
        <button
            className={activeFilter === 'DRAFT' ? 'active' : ''}
            onClick={() => onFilterChange('DRAFT')}
        >
            Draft
        </button>
    </div>
);

export default TeacherCourses;
