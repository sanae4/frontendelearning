import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Breadcrumb from '../Breadcrumb';
import './CoursesByCategoryPage.css';

const CoursesByCategoryPage = () => {
    const { categoryId } = useParams();
    const navigate = useNavigate();

    // State management
    const [courses, setCourses] = useState([]);
    const [category, setCategory] = useState(null);
    const [breadcrumbPath, setBreadcrumbPath] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                await fetchCategoryAndPath();
                await fetchApprovedCourses();
            } catch (err) {
                console.error("Error loading data:", err);
                setError("Failed to load data. Please try again later.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [categoryId]); // keep dependency clean


    // Fetch category details and build breadcrumb path
    const fetchCategoryAndPath = async () => {
        try {
            const response = await axios.get(`https://192.168.11.113:8080/api/category/${categoryId}`);
            setCategory(response.data);

            // Build breadcrumb path
            const path = await buildBreadcrumbPath(response.data);
            setBreadcrumbPath([{ id: null, titre: "Catégories" }, ...path]);

        } catch (err) {
            throw new Error("Failed to load category details");
        }
    };

    // Recursively build breadcrumb path - Corrigé pour afficher toute la hiérarchie dans le bon ordre
    const buildBreadcrumbPath = async (currentCategory) => {
        // Si pas de catégorie parente, retourner juste la catégorie courante
        if (!currentCategory.parentCategory) {
            return [currentCategory];
        }

        try {
            // Récupérer la catégorie parente
            const response = await axios.get(`https://192.168.11.113:8080/api/category/${currentCategory.parentCategory.id}`);
            const parentCategory = response.data;

            // Récupérer le chemin complet jusqu'au parent
            const parentPath = await buildBreadcrumbPath(parentCategory);

            // Ajouter la catégorie courante à la fin du chemin (après le parent)
            return [...parentPath, currentCategory];
        } catch (err) {
            console.error("Error loading parent category:", err);
            return [currentCategory];
        }
    };

    // Fetch approved courses for the current category
    const fetchApprovedCourses = async () => {
        try {
            const response = await axios.get(`https://192.168.11.113:8080/api/course/category/${categoryId}`);
            const approvedCourses = response.data.filter(course =>
                course.statusCours === "APPROVED"
            );
            setCourses(approvedCourses);
        } catch (err) {
            throw new Error("Failed to load courses");
        }
    };

    // Navigation handlers
    const handleBreadcrumbClick = (item, index) => {
        navigate(item.id ? `/category/${item.id}` : '/categories');
    };

    const handleViewCourse = (courseId) => {
        navigate(`/courseview/${courseId}`);
    };

    // Render methods
    const renderBreadcrumb = () => (
        <Breadcrumb items={breadcrumbPath} onClick={(item, index) => handleBreadcrumbClick(item, index)} />
    );

    const renderCategoryHeader = () => (
        <div className="category-header">
            <h1>{category?.titre || "Loading..."}</h1>
            <p className="category-description">
                {category?.description || "Browse courses in this category"}
            </p>
        </div>
    );

    const renderCourseCard = (course) => (
        <div key={course.id} className="course-card">
            <div className="course-image-container">
                {course.image ? (
                    <img
                        src={`${course.image}`}
                        alt={course.titreCours}
                        className="course-image"
                    />
                ) : (
                    <div className="course-image-placeholder">
                        {course.titreCours.charAt(0).toUpperCase()}
                    </div>
                )}
            </div>
            <div className="course-info">
                <h2 className="course-title">{course.titreCours}</h2>
                <p className="course-description">{course.description}</p>
                <div className="course-meta">
                    <span className="course-level">{course.courselevel}</span>
                    <span className="course-price">${course.prix.toFixed(2)}</span>
                </div>
                <button
                    className="view-course-btn"
                    onClick={() => handleViewCourse(course.id)}
                >
                    View Course
                </button>
            </div>
        </div>
    );

    const renderContent = () => {
        if (loading) {
            return (
                <div className="loading-container">
                    <div className="loader"></div>
                    <p>Loading courses...</p>
                </div>
            );
        }

        if (error) {
            return <div className="error-message">{error}</div>;
        }

        if (courses.length === 0) {
            return (
                <div className="no-courses-message">
                    <p>No approved courses available in this category.</p>
                </div>
            );
        }

        return (
            <div className="courses-grid">
                {courses.map(renderCourseCard)}
            </div>
        );
    };

    return (
        <div className="courses-category-container">
            {renderCategoryHeader()}
            {renderBreadcrumb()}

            {renderContent()}
        </div>
    );
};

export default CoursesByCategoryPage;
