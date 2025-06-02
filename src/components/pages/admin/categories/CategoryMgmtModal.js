import React, { useState, useEffect } from 'react';
import './CategoryMgmtModal.css';

const CategoryMgmtModal = ({ isOpen, modalType, category, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        titre: '',
        description: '',
        icon: '',
        parentCategoryId: null
    });

    useEffect(() => {
        if (category) {
            const parentId = category.parentCategoryId ||
                (category.parentCategory ? category.parentCategory.id : null);

            setFormData({
                titre: category.titre || '',
                description: category.description || '',
                icon: category.icon || '',
                parentCategoryId: parentId
            });
        } else {
            setFormData({
                titre: '',
                description: '',
                icon: '',
                parentCategoryId: null
            });
        }
    }, [modalType, category, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

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

    const handleSubmit = (e) => {
        e.preventDefault();
        if (modalType === 'addSub' && category) {
            onSave({
                ...formData,
                parentCategoryId: category.id
            });
        } else {
            onSave(formData);
        }
    };

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
        <div className="cm-modal-overlay">
            <div className="cm-modal-container">
                <div className="cm-modal-header">
                    <h2>{modalTitle}</h2>
                    <button className="cm-close-btn" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="cm-form-group">
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

                    <div className="cm-form-group">
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

                    <div className="cm-form-group">
                        <label>Icon</label>
                        <div className="cm-icon-upload-container">
                            <input
                                type="file"
                                id="cm-icon-upload"
                                accept="image/*"
                                onChange={handleIconUpload}
                                className="cm-icon-input"
                            />
                            <label htmlFor="cm-icon-upload" className="cm-icon-upload-btn">
                                <i className="fas fa-upload"></i> Choose an icon
                            </label>

                            {formData.icon && (
                                <div className="cm-icon-preview">
                                    <img src={formData.icon} alt="Icon preview" />
                                </div>
                            )}
                        </div>
                    </div>

                    <input
                        type="hidden"
                        name="parentCategoryId"
                        value={formData.parentCategoryId || ''}
                    />

                    <div className="cm-modal-actions">
                        <button type="button" className="cm-cancel-btn" onClick={onClose}>Cancel</button>
                        <button type="submit" className="cm-save-btn">
                            {modalType === 'edit' || modalType === 'editSub' ? 'Update' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CategoryMgmtModal;