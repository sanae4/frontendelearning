import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { decodeToken } from '../../../../utils/jwtUtils';
import { useNavigate, useParams } from 'react-router-dom';
import './courseForm.css';

const API_URL = 'http://localhost:8080/api';

const CourseForm = () => {
    const navigate = useNavigate();
    const { courseId } = useParams();
    const [course, setCourse] = useState({
        title: '',
        language: 'English',
        level: 'Beginner',
        description: '',
        about: '',
        price: 0,
        image: '',
        status: 'DRAFT',
        publicationDate: new Date().toISOString().split('T')[0],
        instructorId: null,
        categoryId: null
    });

    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedSubCategory, setSelectedSubCategory] = useState(null);
    const [file, setFile] = useState(null);
    const [fileName, setFileName] = useState('No file chosen');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);
    const fileInputRef = useRef(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [categoryError, setCategoryError] = useState('');
    const [subCategoryError, setSubCategoryError] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const userInfo = decodeToken(token);
                if (userInfo && userInfo.id) {
                    setCourse(prevCourse => ({
                        ...prevCourse,
                        instructorId: userInfo.id
                    }));
                }
            } catch (error) {
                console.error('Error decoding token:', error);
            }
        }

        loadRootCategories();

        if (courseId) {
            setIsEditMode(true);
            fetchCourse(courseId);
        }
    }, [courseId]);

    useEffect(() => {
        if (selectedCategory) {
            loadSubCategories(selectedCategory.id);
        } else {
            setSubCategories([]);
        }
    }, [selectedCategory]);

    const loadRootCategories = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            };
            const response = await axios.get(`${API_URL}/category/root`, config);
            setCategories(response.data);
        } catch (err) {
            setError('Error loading categories');
            console.error(err);
        }
    };

    const loadSubCategories = async (parentId) => {
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            };
            const response = await axios.get(`${API_URL}/category/${parentId}/subcategories`, config);
            setSubCategories(response.data);
        } catch (err) {
            setError('Error loading subcategories');
            console.error(err);
        }
    };

    const fetchCourse = async (id) => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            };
            const response = await axios.get(`${API_URL}/course/${id}`, config);
            const courseData = response.data;

            setCourse({
                title: courseData.titreCours || '',
                language: courseData.langage || 'English',
                level: courseData.courselevel || 'Beginner',
                description: courseData.description || '',
                about: courseData.about || '',
                price: courseData.prix || 0,
                image: courseData.image || '',
                status: courseData.statusCours || 'DRAFT',
                publicationDate: courseData.datePublication || new Date().toISOString().split('T')[0],
                instructorId: courseData.enseignantId || null,
                categoryId: courseData.categoryId || null
            });

            if (courseData.image) {
                setImagePreview(courseData.image);
            }

            if (courseData.categoryId) {
                const categoryResponse = await axios.get(`${API_URL}/category/${courseData.categoryId}`, config);
                const category = categoryResponse.data;

                if (category.parentCategoryId) {
                    const parentResponse = await axios.get(`${API_URL}/category/${category.parentCategoryId}`, config);
                    setSelectedCategory(parentResponse.data);
                    setSelectedSubCategory(category);
                } else {
                    setSelectedCategory(category);
                }
            }

            setIsLoading(false);
        } catch (err) {
            setError('Error loading course');
            setIsLoading(false);
            console.error(err);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCourse({
            ...course,
            [name]: value
        });
    };

    const handleCategoryChange = (e) => {
        const categoryId = parseInt(e.target.value);
        const category = categories.find(cat => cat.id === categoryId);
        setSelectedCategory(category);
        setSelectedSubCategory(null);
        setCourse({
            ...course,
            categoryId: categoryId
        });
        setCategoryError('');
    };

    const handleSubCategoryChange = (e) => {
        const subCategoryId = parseInt(e.target.value);
        const subCategory = subCategories.find(cat => cat.id === subCategoryId);
        setSelectedSubCategory(subCategory);
        setCourse({
            ...course,
            categoryId: subCategoryId
        });
        setSubCategoryError('');
    };

    const handleFileChange = async (e) => {
        if (e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setFileName(selectedFile.name);

            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result;
                setImagePreview(base64String);
                setCourse({
                    ...course,
                    image: base64String
                });
            };
            reader.readAsDataURL(selectedFile);
        } else {
            setFile(null);
            setFileName('No file chosen');
            setImagePreview(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');
        setCategoryError('');
        setSubCategoryError('');

        // Validate category and subcategory
        if (!selectedCategory) {
            setCategoryError('Please select a category');
            setIsLoading(false);
            return;
        }

        if (!selectedSubCategory) {
            setSubCategoryError('Please select a subcategory');
            setIsLoading(false);
            return;
        }

        if (!course.instructorId) {
            setError('Error: Instructor ID not defined. Please log in again.');
            setIsLoading(false);
            return;
        }

        const courseData = {
            titreCours: course.title,
            langage: course.language,
            courselevel: course.level,
            description: course.description,
            about: course.about,
            prix: course.price,
            image: course.image,
            statusCours: course.status,
            datePublication: course.publicationDate,
            enseignantId: course.instructorId,
            categoryId: course.categoryId
        };

        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            };

            let response;
            if (isEditMode) {
                response = await axios.put(`${API_URL}/course/${courseId}`, courseData, config);
                setSuccess('Course updated successfully!');
                setIsLoading(false);
            } else {
                response = await axios.post(`${API_URL}/course`, courseData, config);
                setSuccess('Course created successfully!');
                setIsLoading(false);
                navigate(`/course/${response.data.id}/lessons`);
            }
        } catch (err) {
            console.error('Detailed error:', err.response ? err.response.data : err.message);
            setError(`Error saving course: ${err.response ? err.response.data : err.message}`);
            setIsLoading(false);
        }
    };

    return (
        <div className="form-container">
            <h1>{isEditMode ? 'Edit Your Course' : 'Fill out the form below'}</h1>
            <p className="subtitle">{isEditMode ? 'Update your course information' : 'Create your course'}</p>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-row">
                    <div className="form-group">
                        <input
                            type="text"
                            name="title"
                            placeholder="Course Title"
                            className="form-control"
                            value={course.title}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <div className="select-wrapper">
                            <select
                                name="language"
                                className="form-control"
                                value={course.language}
                                onChange={handleInputChange}
                            >
                                <option value="English">English</option>
                                <option value="French">French</option>
                                <option value="Spanish">Spanish</option>
                                <option value="German">German</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <div className="select-wrapper">
                            <select
                                name="level"
                                className="form-control"
                                value={course.level}
                                onChange={handleInputChange}
                            >
                                <option value="Beginner">Beginner</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Advanced">Advanced</option>
                                <option value="Expert">Expert</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="form-group">
                    <textarea
                        name="description"
                        className="form-control"
                        rows="6"
                        value={course.description}
                        onChange={handleInputChange}
                        placeholder="Course Description"
                        required
                    ></textarea>
                </div>

                <div className="form-group">
                    <textarea
                        name="about"
                        className="form-control"
                        rows="6"
                        value={course.about}
                        onChange={handleInputChange}
                        placeholder="About the Course"
                        required
                    ></textarea>
                </div>

                <div className="categories-container">
                    <div className="form-group">
                        <div className="select-wrapper">
                            <select
                                name="categoryId"
                                className={`form-control ${categoryError ? 'error-border' : ''}`}
                                value={selectedCategory ? selectedCategory.id : ''}
                                onChange={handleCategoryChange}
                                required
                            >
                                <option value="">Select a category</option>
                                {categories.map(category => (
                                    <option key={category.id} value={category.id}>{category.titre}</option>
                                ))}
                            </select>
                        </div>
                        {categoryError && <div className="error-message">{categoryError}</div>}
                    </div>
                    <div className="form-group">
                        <div className="select-wrapper">
                            <select
                                name="subCategoryId"
                                className={`form-control ${subCategoryError ? 'error-border' : ''}`}
                                value={selectedSubCategory ? selectedSubCategory.id : ''}
                                onChange={handleSubCategoryChange}
                                disabled={!selectedCategory}
                                required
                            >
                                <option value="">Select a subcategory</option>
                                {subCategories.map(category => (
                                    <option key={category.id} value={category.id}>{category.titre}</option>
                                ))}
                            </select>
                        </div>
                        {subCategoryError && <div className="error-message">{subCategoryError}</div>}
                    </div>
                </div>

                <div className="form-group">
                    <input
                        type="number"
                        name="price"
                        placeholder="Course Price"
                        className="form-control"
                        value={course.price}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        required
                    />
                </div>

                <div className="file-upload">
                    <label htmlFor="file-input" className="file-label">Choose a file</label>
                    <input
                        type="file"
                        id="file-input"
                        className="file-input"
                        onChange={handleFileChange}
                        ref={fileInputRef}
                        accept="image/*"
                    />
                    <span className="file-name">{fileName}</span>
                </div>

                {imagePreview && (
                    <div className="image-preview" style={{ marginBottom: '20px' }}>
                        <img
                            src={imagePreview}
                            alt="Preview"
                            style={{ maxWidth: '100%', maxHeight: '200px', display: 'block', margin: '0 auto' }}
                        />
                    </div>
                )}

                <div className="form-actions">
                    <button
                        type="submit"
                        className="update-btn"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Loading...' : isEditMode ? 'Update Course' : 'Create Course'}
                    </button>
                </div>
            </form>

            {isEditMode && (
                <div className="additional-actions">
                    <button
                        className="modify-chapters-btn"
                        onClick={() => navigate(`/course/${courseId}/chapters`)}
                    >
                        Manage Chapters
                    </button>
                </div>
            )}
        </div>
    );
};

export default CourseForm;