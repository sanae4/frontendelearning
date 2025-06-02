import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './CategoryManagement.css';
import CategoryModal from './CategoryModal';

const CategoryManagement = () => {
    const [categories, setCategories] = useState([]);
    const [subCategoriesMap, setSubCategoriesMap] = useState({});
    const [expandedCategories, setExpandedCategories] = useState({});
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState(''); // 'add', 'edit', 'addSub', 'editSub', 'deleteSub'
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    // Load main categories
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

    // Load subcategories for a specific category
    const loadSubCategories = async (categoryId) => {
        // If subcategories are already loaded
        if (subCategoriesMap[categoryId]) {
            // Just toggle the expansion state
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

            // Save subcategories in state
            setSubCategoriesMap(prev => ({
                ...prev,
                [categoryId]: response.data
            }));

            // Mark this category as expanded
            setExpandedCategories(prev => ({
                ...prev,
                [categoryId]: true
            }));

            console.log("Subcategories loaded:", response.data);
        } catch (error) {
            console.error('Error loading subcategories:', error);
            toast.error('Error loading subcategories');
        }
    };

    // Force reload of subcategories
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

            console.log("Subcategories reloaded:", response.data);
        } catch (error) {
            console.error('Error reloading subcategories:', error);
        }
    };

    // Handle opening modal to add a main category
    const handleAddCategory = () => {
        setSelectedCategory(null);
        setModalType('add');
        setModalOpen(true);
    };

    const handleAddSubCategory = (parentCategory) => {
        setSelectedCategory({
            ...parentCategory, // Conservez toutes les propriétés du parent
            parentCategoryId: parentCategory.id, // Assurez-vous que parentCategoryId est défini
            titre: '',
            description: '',
            icon: ''
        });
        setModalType('addSub');
        setModalOpen(true);
    };
    // Handle opening modal to edit a category
    const handleEditCategory = (category) => {
        setSelectedCategory(category);
        setModalType('edit');
        setModalOpen(true);
    };

    // Handle opening modal to edit a subcategory
    const handleEditSubCategory = (subCategory) => {
        console.log("Editing subcategory:", subCategory);

        // S'assurer que les informations parentCategory sont disponibles pour le modal
        const parentId = subCategory.parentCategoryId ||
            (subCategory.parentCategory ? subCategory.parentCategory.id : null);

        // Loguer l'ID parent pour déboguer
        console.log("Parent category ID for this subcategory:", parentId);

        setSelectedCategory({
            ...subCategory,
            parentCategoryId: parentId
        });

        setModalType('editSub');
        setModalOpen(true);
    };

    // Handle modal close
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
                // Code pour l'édition de catégorie/sous-catégorie
                await axios.put(`http://192.168.11.113:8080/api/category/${selectedCategory.id}`, categoryData, config);
                toast.success(`${modalType === 'edit' ? 'Category' : 'Subcategory'} updated successfully`);

                if (modalType === 'editSub' && selectedCategory.parentCategoryId) {
                    await forceReloadSubCategories(selectedCategory.parentCategoryId);
                }
            } else if (modalType === 'addSub') {
                // Vérifiez que selectedCategory existe et a un ID
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

                console.log("Sending data for subcategory:", dataWithParent);

                await axios.post('http://192.168.11.113:8080/api/category', dataWithParent, config);
                toast.success('Subcategory added successfully');

                // Forcer le rechargement des sous-catégories du parent
                await forceReloadSubCategories(selectedCategory.id);
            } else if (modalType === 'add') {
                // Code pour l'ajout d'une nouvelle catégorie principale
                console.log("Sending data for new main category:", categoryData);

                // S'assurer qu'on envoie une catégorie sans parent
                const mainCategoryData = {
                    titre: categoryData.titre,
                    description: categoryData.description,
                    icon: categoryData.icon
                    // Pas de parentCategoryId pour une catégorie principale
                };

                await axios.post('http://192.168.11.113:8080/api/category', mainCategoryData, config);
                toast.success('Category added successfully');
            }

            setModalOpen(false);

            // Rafraîchir la liste des catégories principales si nécessaire
            if (modalType === 'add' || modalType === 'edit') {
                setRefreshKey(prev => prev + 1);
            }
        } catch (error) {
            console.error('Error saving:', error);
            toast.error('Error saving category: ' + (error.response?.data?.message || error.message));
        }
    };

    // Delete a category
    const handleDeleteCategory = async (category, isSubCategory = false) => {
        try {
            const token = localStorage.getItem('token');

            // If not a subcategory, check if there are subcategories
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

                // Refresh the list or remove from local list
                if (category.parentCategory) {
                    // If it's a subcategory, update the subcategory list
                    const parentId = category.parentCategory.id;
                    await forceReloadSubCategories(parentId);
                } else {
                    // If it's a main category, refresh the list
                    setRefreshKey(prev => prev + 1);
                }
            }
        } catch (error) {
            console.error('Error deleting:', error);
            toast.error('Error deleting');
        }
    };

    // Recursive rendering of categories and subcategories
    const renderCategory = (category, isSubCategory = false) => {
        const isExpanded = expandedCategories[category.id];
        const subCategories = subCategoriesMap[category.id] || [];

        return (
            <div key={category.id} className={`category-card ${isSubCategory ? 'subcategory' : ''}`}>
                <div className="category-header">
                    <div className="category-info">
                        {/* Only show expand button for main categories */}
                        {!isSubCategory && (
                            <button
                                className="expand-button"
                                onClick={() => loadSubCategories(category.id)}
                            >
                                {isExpanded ? <i className="fas fa-chevron-down"></i> : <i className="fas fa-chevron-right"></i>}
                            </button>
                        )}
                        {/* Empty space for subcategory for alignment */}
                        {isSubCategory && <div className="expand-button-placeholder"></div>}

                        {category.icon && (
                            <div className="category-icon">
                                <img src={category.icon} alt={`Icon ${category.titre}`} />
                            </div>
                        )}

                        <div className="category-details">
                            <h3>{category.titre}</h3>
                            {category.description && <p>{category.description}</p>}
                        </div>
                    </div>

                    <div className="category-actions">
                        {/* Only show add subcategory button for main categories */}
                        {!isSubCategory && (
                            <button
                                className="action-btn add-sub-btn"
                                onClick={() => handleAddSubCategory(category)}
                                title="Add subcategory"
                            >
                                <i className="fas fa-plus"></i>
                            </button>
                        )}
                        <button
                            className="action-btn edit-btn"
                            onClick={() => isSubCategory ? handleEditSubCategory(category) : handleEditCategory(category)}
                            title={`Edit this ${isSubCategory ? 'subcategory' : 'category'}`}
                        >
                            <i className="fas fa-pen"></i>
                        </button>
                        <button
                            className="action-btn delete-btn"
                            onClick={() => handleDeleteCategory(category, isSubCategory)}
                            title={`Delete this ${isSubCategory ? 'subcategory' : 'category'}`}
                        >
                            <i className="fas fa-trash"></i>
                        </button>
                    </div>
                </div>

                {/* Only render subcategories container for main categories */}
                {!isSubCategory && isExpanded && subCategories.length > 0 && (
                    <div className="subcategories-container">
                        {subCategories.map(subCategory => renderCategory(subCategory, true))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="category-management-container">
            <ToastContainer position="top-right" autoClose={3000} />

            <div className="category-management-header">
                <h1>Category Management</h1>
                <button
                    className="add-category-btn"
                    onClick={handleAddCategory}
                >
                    <i className="fas fa-plus"></i> Add Category
                </button>
            </div>

            {loading ? (
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading categories...</p>
                </div>
            ) : (
                <div className="categories-list">
                    {categories.length > 0 ? (
                        categories.map(category => renderCategory(category))
                    ) : (
                        <div className="empty-state">
                            <i className="fas fa-folder-open empty-icon"></i>
                            <p>No categories have been created</p>
                            <button className="add-first-category-btn" onClick={handleAddCategory}>
                                Create your first category
                            </button>
                        </div>
                    )}
                </div>
            )}

            {modalOpen && (
                <CategoryModal
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

export default CategoryManagement;
