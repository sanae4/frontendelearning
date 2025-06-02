import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './CategoryMgmtSystem.css';
import CategoryMgmtModal from './CategoryMgmtModal';

const CategoryMgmtSystem = () => {
    const [categories, setCategories] = useState([]);
    const [subCategoriesMap, setSubCategoriesMap] = useState({});
    const [expandedCategories, setExpandedCategories] = useState({});
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        const fetchRootCategories = async () => {
            try {
                setLoading(true);
                const response = await axios.get('http://192.168.11.113:8080/api/category/root');
                setCategories(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error loading categories:', error);
                toast.error('Error loading categories');
                setLoading(false);
            }
        };

        fetchRootCategories();
    }, [refreshKey]);

    const loadSubCategories = async (categoryId) => {
        if (subCategoriesMap[categoryId]) {
            setExpandedCategories(prev => ({
                ...prev,
                [categoryId]: !prev[categoryId]
            }));
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://192.168.11.113:8080/api/category/${categoryId}/subcategories`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );

            setSubCategoriesMap(prev => ({
                ...prev,
                [categoryId]: response.data
            }));

            setExpandedCategories(prev => ({
                ...prev,
                [categoryId]: true
            }));
        } catch (error) {
            console.error('Error loading subcategories:', error);
            toast.error('Error loading subcategories');
        }
    };

    const forceReloadSubCategories = async (categoryId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://192.168.11.113:8080/api/category/${categoryId}/subcategories`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );

            setSubCategoriesMap(prev => ({
                ...prev,
                [categoryId]: response.data
            }));

            setExpandedCategories(prev => ({
                ...prev,
                [categoryId]: true
            }));
        } catch (error) {
            console.error('Error reloading subcategories:', error);
        }
    };

    const handleAddCategory = () => {
        setSelectedCategory(null);
        setModalType('add');
        setModalOpen(true);
    };

    const handleAddSubCategory = (parentCategory) => {
        setSelectedCategory({
            ...parentCategory,
            parentCategoryId: parentCategory.id,
            titre: '',
            description: '',
            icon: ''
        });
        setModalType('addSub');
        setModalOpen(true);
    };

    const handleEditCategory = (category) => {
        setSelectedCategory(category);
        setModalType('edit');
        setModalOpen(true);
    };

    const handleEditSubCategory = (subCategory) => {
        const parentId = subCategory.parentCategoryId ||
            (subCategory.parentCategory ? subCategory.parentCategory.id : null);

        setSelectedCategory({
            ...subCategory,
            parentCategoryId: parentId
        });

        setModalType('editSub');
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setModalType('');
        setSelectedCategory(null);
    };

    const handleSaveCategory = async (categoryData) => {
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            };

            if (modalType === 'edit' || modalType === 'editSub') {
                await axios.put(`http://192.168.11.113:8080/api/category/${selectedCategory.id}`, categoryData, config);
                toast.success(`${modalType === 'edit' ? 'Category' : 'Subcategory'} updated successfully`);

                if (modalType === 'editSub' && selectedCategory.parentCategoryId) {
                    await forceReloadSubCategories(selectedCategory.parentCategoryId);
                }
            } else if (modalType === 'addSub') {
                if (!selectedCategory || !selectedCategory.id) {
                    toast.error('Parent category information is missing');
                    return;
                }

                const dataWithParent = {
                    titre: categoryData.titre,
                    description: categoryData.description,
                    icon: categoryData.icon,
                    parentCategoryId: selectedCategory.id
                };

                await axios.post('http://192.168.11.113:8080/api/category', dataWithParent, config);
                toast.success('Subcategory added successfully');
                await forceReloadSubCategories(selectedCategory.id);
            } else if (modalType === 'add') {
                const mainCategoryData = {
                    titre: categoryData.titre,
                    description: categoryData.description,
                    icon: categoryData.icon
                };

                await axios.post('http://192.168.11.113:8080/api/category', mainCategoryData, config);
                toast.success('Category added successfully');
            }

            setModalOpen(false);

            if (modalType === 'add' || modalType === 'edit') {
                setRefreshKey(prev => prev + 1);
            }
        } catch (error) {
            console.error('Error saving:', error);
            toast.error('Error saving category: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDeleteCategory = async (category, isSubCategory = false) => {
        try {
            const token = localStorage.getItem('token');

            if (!isSubCategory) {
                const hasSubCategories = await axios.get(
                    `http://192.168.11.113:8080/api/category/${category.id}/has-subcategories`,
                    {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }
                );

                if (hasSubCategories.data) {
                    toast.warning('Cannot delete: this category contains subcategories');
                    return;
                }
            }

            if (window.confirm(`Are you sure you want to delete ${isSubCategory ? 'subcategory' : 'category'} "${category.titre}"?`)) {
                await axios.delete(`http://192.168.11.113:8080/api/category/${category.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                toast.success(`${isSubCategory ? 'Subcategory' : 'Category'} deleted successfully`);

                if (category.parentCategory) {
                    const parentId = category.parentCategory.id;
                    await forceReloadSubCategories(parentId);
                } else {
                    setRefreshKey(prev => prev + 1);
                }
            }
        } catch (error) {
            console.error('Error deleting:', error);
            toast.error('Error deleting');
        }
    };

    const renderCategory = (category, isSubCategory = false) => {
        const isExpanded = expandedCategories[category.id];
        const subCategories = subCategoriesMap[category.id] || [];

        return (
            <div key={category.id} className={`cm-category-card ${isSubCategory ? 'cm-subcategory' : ''}`}>
                <div className="cm-category-header">
                    <div className="cm-category-info">
                        {!isSubCategory && (
                            <button
                                className="cm-expand-button"
                                onClick={() => loadSubCategories(category.id)}
                            >
                                {isExpanded ? <i className="fas fa-chevron-down"></i> : <i className="fas fa-chevron-right"></i>}
                            </button>
                        )}
                        {isSubCategory && <div className="cm-expand-button-placeholder"></div>}

                        {category.icon && (
                            <div className="cm-category-icon">
                                <img src={category.icon} alt={`Icon ${category.titre}`} />
                            </div>
                        )}

                        <div className="cm-category-details">
                            <h3>{category.titre}</h3>
                            {category.description && <p>{category.description}</p>}
                        </div>
                    </div>

                    <div className="cm-category-actions">
                        {!isSubCategory && (
                            <button
                                className="cm-action-btn cm-add-sub-btn"
                                onClick={() => handleAddSubCategory(category)}
                                title="Add subcategory"
                            >
                                <i className="fas fa-plus"></i>
                            </button>
                        )}
                        <button
                            className="cm-action-btn cm-edit-btn"
                            onClick={() => isSubCategory ? handleEditSubCategory(category) : handleEditCategory(category)}
                            title={`Edit this ${isSubCategory ? 'subcategory' : 'category'}`}
                        >
                            <i className="fas fa-pen"></i>
                        </button>
                        <button
                            className="cm-action-btn cm-delete-btn"
                            onClick={() => handleDeleteCategory(category, isSubCategory)}
                            title={`Delete this ${isSubCategory ? 'subcategory' : 'category'}`}
                        >
                            <i className="fas fa-trash"></i>
                        </button>
                    </div>
                </div>

                {!isSubCategory && isExpanded && subCategories.length > 0 && (
                    <div className="cm-subcategories-container">
                        {subCategories.map(subCategory => renderCategory(subCategory, true))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="cm-container">
            <ToastContainer position="top-right" autoClose={3000} />

            <div className="cm-header">
                <h1>Category Management</h1>
                <button
                    className="cm-add-category-btn"
                    onClick={handleAddCategory}
                >
                    <i className="fas fa-plus"></i> Add Category
                </button>
            </div>

            {loading ? (
                <div className="cm-loading-container">
                    <div className="cm-spinner"></div>
                    <p>Loading categories...</p>
                </div>
            ) : (
                <div className="cm-categories-list">
                    {categories.length > 0 ? (
                        categories.map(category => renderCategory(category))
                    ) : (
                        <div className="cm-empty-state">
                            <i className="fas fa-folder-open cm-empty-icon"></i>
                            <p>No categories have been created</p>
                            <button className="cm-add-first-category-btn" onClick={handleAddCategory}>
                                Create your first category
                            </button>
                        </div>
                    )}
                </div>
            )}

            {modalOpen && (
                <CategoryMgmtModal
                    isOpen={modalOpen}
                    modalType={modalType}
                    category={selectedCategory}
                    onClose={handleCloseModal}
                    onSave={handleSaveCategory}
                />
            )}
        </div>
    );
};

export default CategoryMgmtSystem;