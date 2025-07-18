import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminCourseApproval.css';

const AdminCourseApproval = () => {
    const [publishedCourses, setPublishedCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPublishedCourses = async () => {
            try {
                setLoading(true);
                const response = await axios.get('http://localhost:8080/api/course');
                const published = response.data.filter(course => course.statusCours === 'PUBLISHED');
                setPublishedCourses(published);
            } catch (err) {
                setError(err.message);
                console.error("Error fetching courses:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPublishedCourses();
    }, []);

    const approveCourse = async (courseId) => {
        try {
            await axios.put(`http://localhost:8080/api/course/${courseId}/status`, {
                status: 'APPROVED'
            });
            setPublishedCourses(publishedCourses.filter(c => c.id !== courseId));
            alert('Course approved successfully!');
        } catch (err) {
            console.error("Error approving course:", err);
            alert('Failed to approve course');
        }
    };

    const viewCourseDetails = (courseId) => {
        navigate(`/coursepreview/${courseId}`);
    };

    if (loading) return <div className="text-center mt-5">Loading published courses...</div>;
    if (error) return <div className="alert alert-danger">Error: {error}</div>;

    return (
        <div className="container mt-4">
            <h2 className="mb-4">Published Courses Awaiting Approval</h2>

            {publishedCourses.length === 0 ? (
                <div className="alert alert-info">No published courses awaiting approval</div>
            ) : (
                <div className="row">
                    {publishedCourses.map(course => (
                        <div key={course.id} className="col-md-4 mb-4">
                            <div className="card h-100">
                                <img
                                    src={course.image || '/images/course-placeholder.jpg'}
                                    className="card-img-top"
                                    alt={course.titreCours}
                                    style={{ height: '180px', objectFit: 'cover' }}
                                />
                                <div className="card-body">
                                    <h5 className="card-title">{course.titreCours}</h5>
                                    <div className="mb-2">
                                        <span className="badge bg-primary text-white p-2 rounded">
                                            Published
                                        </span>
                                    </div>
                                    <p className="card-text">
                                        {course.description?.length > 100
                                            ? `${course.description.substring(0, 100)}...`
                                            : course.description || "No description available"}
                                    </p>
                                    <div className="mb-2">
                                        <small className="text-muted">
                                            <i className="fas fa-user"></i> {course.enseignant?.nom || 'Unknown teacher'}
                                        </small>
                                    </div>
                                </div>
                                <div className="card-footer bg-white">
                                    <div className="d-flex justify-content-between">
                                        <button
                                            className="btn btn-outline-primary"
                                            onClick={() => viewCourseDetails(course.id)}
                                        >
                                            <i className="fas fa-eye"></i> View Course
                                        </button>
                                        <button
                                            className="btn btn-success"
                                            onClick={() => approveCourse(course.id)}
                                        >
                                            <i className="fas fa-check-circle"></i> Approve
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminCourseApproval;