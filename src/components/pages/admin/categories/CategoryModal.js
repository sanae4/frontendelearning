import React, { useState, useEffect } from 'react';
import './CategoryModal.css';

const CategoryModal = ({ isOpen, modalType, category, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        titre: '',
        description: '',
        icon: '',
        parentCategoryId: null // Added to track parent relationship
    });

    // Initialize form when modal opens
    useEffect(() => {
        if (category) {
            // Get parent ID - handles both direct parentCategoryId and nested parentCategory object
            const parentId = category.parentCategoryId ||
                (category.parentCategory ? category.parentCategory.id : null);

            setFormData({
                titre: category.titre || '',
                description: category.description || '',
                icon: category.icon || '',
                parentCategoryId: parentId // Store parent ID to preserve relationship
            });
        } else {
            // For adding a main category
            setFormData({
                titre: '',
                description: '',
                icon: '',
                parentCategoryId: null
            });
        }
    }, [modalType, category, isOpen]);

    // Handle field changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle icon upload
    const handleIconUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    icon: reader.result
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    // Submit form
    const handleSubmit = (e) => {
        e.preventDefault();

        // If adding a subcategory, set parent ID from the selected category
        if (modalType === 'addSub' && category) {
            onSave({
                ...formData,
                parentCategoryId: category.id // Set parent ID for new subcategory
            });
        } else {
            // For editing, use the parentCategoryId already in formData
            onSave(formData);
        }
    };

    // Determine modal title
    let modalTitle = "";
    if (modalType === 'add') {
        modalTitle = "Add Category";
    } else if (modalType === 'edit') {
        modalTitle = "Edit Category";
    } else if (modalType === 'editSub') {
        modalTitle = "Edit Subcategory";
    } else if (modalType === 'addSub') {
        modalTitle = `Add Subcategory to "${category?.titre}"`;
    }

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="category-modal">
                <div className="modal-header">
                    <h2>{modalTitle}</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="titre">Title *</label>
                        <input
                            type="text"
                            id="titre"
                            name="titre"
                            value={formData.titre}
                            onChange={handleChange}
                            placeholder="Category name"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Category description (optional)"
                            rows="3"
                        />
                    </div>

                    <div className="form-group">
                        <label>Icon</label>
                        <div className="icon-upload-container">
                            <input
                                type="file"
                                id="icon-upload"
                                accept="image/*"
                                onChange={handleIconUpload}
                                className="icon-input"
                            />
                            <label htmlFor="icon-upload" className="icon-upload-btn">
                                <i className="fas fa-upload"></i> Choose an icon
                            </label>

                            {formData.icon && (
                                <div className="icon-preview">
                                    <img src={formData.icon} alt="Icon preview" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Hidden field to store parentCategoryId */}
                    <input
                        type="hidden"
                        name="parentCategoryId"
                        value={formData.parentCategoryId || ''}
                    />

                    <div className="modal-actions">
                        <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
                        <button type="submit" className="save-btn">
                            {modalType === 'edit' || modalType === 'editSub' ? 'Update' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CategoryModal;
