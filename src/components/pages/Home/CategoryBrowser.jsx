import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CategoryList from './CategoryList';
import Breadcrumb from './Breadcrumb';
import './CategoryBrowser.css';
import { useNavigate, useParams } from 'react-router-dom';

const CategoryBrowser = () => {
    const [categories, setCategories] = useState([]);
    const [courses, setCourses] = useState([]);
    const [currentCategory, setCurrentCategory] = useState(null);
    const [breadcrumbs, setBreadcrumbs] = useState([{ id: null, titre: 'Categories' }]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('categories'); // 'categories' or 'courses'
    const navigate = useNavigate();
    const { categoryId } = useParams();

    // Function to load root categories
    const loadRootCategories = async () => {
        setLoading(true);
        try {
            const response = await axios.get('http://localhost:8080/api/category/root');
            setCategories(response.data);
            setCurrentCategory(null);
            setBreadcrumbs([{ id: null, titre: 'Categories' }]);
            setViewMode('categories');
        } catch (err) {
            setError('Error loading categories: ' + err.message);
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Function to load subcategories
    const loadSubCategories = async (categoryId, categoryTitle) => {
        setLoading(true);
        try {
            const response = await axios.get(`http://localhost:8080/api/category/${categoryId}/subcategories`);
            setCategories(response.data);

            // Get complete category details
            const categoryDetailsResponse = await axios.get(`http://localhost:8080/api/category/${categoryId}`);
            const categoryDetails = categoryDetailsResponse.data;
            setCurrentCategory(categoryDetails);

            // Update breadcrumbs
            const categoryIndex = breadcrumbs.findIndex(item => item.id === categoryId);
            if (categoryIndex !== -1) {
                setBreadcrumbs(breadcrumbs.slice(0, categoryIndex + 1));
            } else {
                setBreadcrumbs([...breadcrumbs, { id: categoryId, titre: categoryTitle }]);
            }

            setViewMode('categories');
        } catch (err) {
            setError('Error loading subcategories: ' + err.message);
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Function to load courses for a category
    const loadCategoryCourses = async (categoryId, categoryTitle) => {
        setLoading(true);
        try {
            // Get complete category details
            const categoryDetailsResponse = await axios.get(`http://localhost:8080/api/category/${categoryId}`);
            const categoryDetails = categoryDetailsResponse.data;
            setCurrentCategory(categoryDetails);

            // Get courses for this category
            const coursesResponse = await axios.get(`http://localhost:8080/api/course/category/${categoryId}`);
            const approvedCourses = coursesResponse.data.filter(course =>
                course.statusCours === "APPROVED"
            );
            setCourses(approvedCourses);

            // Update breadcrumbs
            const categoryIndex = breadcrumbs.findIndex(item => item.id === categoryId);
            if (categoryIndex !== -1) {
                setBreadcrumbs(breadcrumbs.slice(0, categoryIndex + 1));
            } else {
                setBreadcrumbs([...breadcrumbs, { id: categoryId, titre: categoryTitle }]);
            }

            setViewMode('courses');
        } catch (err) {
            setError('Error loading courses: ' + err.message);
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Load initial data based on URL or default to root categories
    useEffect(() => {
        if (categoryId) {
            // If a category ID is in the URL, load that category
            const fetchCategoryData = async () => {
                try {
                    const categoryResponse = await axios.get(`http://localhost:8080/api/category/${categoryId}`);
                    const category = categoryResponse.data;

                    const subcategoriesResponse = await axios.get(`http://localhost:8080/api/category/${categoryId}/subcategories`);
                    if (subcategoriesResponse.data.length > 0) {
                        // This category has subcategories
                        loadSubCategories(categoryId, category.titre);
                    } else {
                        // This category has no subcategories, show courses
                        loadCategoryCourses(categoryId, category.titre);
                    }
                } catch (err) {
                    setError('Error loading data: ' + err.message);
                    console.error('Error:', err);
                    loadRootCategories(); // Fallback to root categories
                }
            };
            fetchCategoryData();
        } else {
            // Otherwise, load root categories
            loadRootCategories();
        }
    }, [categoryId]);

    // Handle breadcrumb navigation
    const handleBreadcrumbClick = (item, index) => {
        if (item.id === null) {
            loadRootCategories();
        } else {
            loadSubCategories(item.id, item.titre);
            setBreadcrumbs(breadcrumbs.slice(0, index + 1));
        }
    };

    // Handle category click
    const handleCategoryClick = async (category) => {
        setLoading(true);
        try {
            const response = await axios.get(`http://localhost:8080/api/category/${category.id}/subcategories`);
            const subcategories = response.data;

            if (subcategories.length > 0) {
                // Show subcategories
                loadSubCategories(category.id, category.titre);
            } else {
                // Show courses for this category
                loadCategoryCourses(category.id, category.titre);
            }
        } catch (err) {
            setError('Error loading data: ' + err.message);
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Navigate to course view
    const handleViewCourse = (courseId) => {
        navigate(`/courseview/${courseId}`);
    };

    // Render course card
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

    // Get category header based on current view mode and category
    const getCategoryHeader = () => {
        if (viewMode === 'courses' && currentCategory) {
            return {
                title: currentCategory.titre,
                subtitle: currentCategory.description || "Discover courses available in this category"
            };
        } else if (currentCategory) {
            return {
                title: "Explore Subcategories",
                subtitle: `Browse through the subcategories of ${currentCategory.titre} to find your perfect course.`
            };
        } else {
            return {
                title: "Categories",
                subtitle: "Explore our diverse range of categories and find the perfect course to enhance your skills."
            };
        }
    };

    // Render main content
    const renderContent = () => {
        if (loading) {
            return (
                <div className="loading-container">
                    <div className="loader"></div>
                    <p>Loading...</p>
                </div>
            );
        }

        if (error) {
            return <div className="error-message">{error}</div>;
        }

        if (viewMode === 'categories') {
            return <CategoryList categories={categories} onCategoryClick={handleCategoryClick} />;
        } else if (viewMode === 'courses') {
            if (courses.length === 0) {
                return (
                    <div className="no-courses-message">
                        <p>No courses available in this category.</p>
                    </div>
                );
            }
            return (
                <div className="courses-grid">
                    {courses.map(renderCourseCard)}
                </div>
            );
        }
    };

    // Get header information
    const headerInfo = getCategoryHeader();

    return (
        <div className="category-browser">
            <div className="category-header">
                <h1 className="category-title">{headerInfo.title}</h1>
                <p className="category-subtitle">{headerInfo.subtitle}</p>
            </div>

            <Breadcrumb items={breadcrumbs} onClick={handleBreadcrumbClick} />

            {renderContent()}
        </div>
    );
};

export default CategoryBrowser;
