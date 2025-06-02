import React, { useState, useEffect } from 'react';
import './EditProfilModal.css';

const EditProfileModal = ({ teacher, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        prenom: teacher.prenom || '',
        nom: teacher.nom || '',
        email: teacher.email || '',
        numtele: teacher.numtele || '',
        specialite: teacher.specialite || '',
        biographie: teacher.biographie || '',
        anneesExperience: teacher.anneesExperience || '',
        // Status will always be true when saving
        status: true
    });

    // Update form data when teacher prop changes
    useEffect(() => {
        setFormData({
            prenom: teacher.prenom || '',
            nom: teacher.nom || '',
            email: teacher.email || '',
            numtele: teacher.numtele || '',
            specialite: teacher.specialite || '',
            biographie: teacher.biographie || '',
            anneesExperience: teacher.anneesExperience || '',
            status: true
        });
    }, [teacher]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Always set status to true when saving
        onSave({
            ...formData,
            status: true
        });
    };

    return (
        <div className="modal-overlay">
            <div className="modal-container">
                <div className="modal-header">
                    <h2>Edit Profile</h2>
                    <button className="modal-close" onClick={onCancel}>
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="profile-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="prenom">First Name</label>
                            <input
                                type="text"
                                id="prenom"
                                name="prenom"
                                value={formData.prenom}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="nom">Last Name</label>
                            <input
                                type="text"
                                id="nom"
                                name="nom"
                                value={formData.nom}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="numtele">Phone Number</label>
                            <input
                                type="tel"
                                id="numtele"
                                name="numtele"
                                value={formData.numtele}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="specialite">Specialty</label>
                            <input
                                type="text"
                                id="specialite"
                                name="specialite"
                                value={formData.specialite}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="anneesExperience">Years of Experience</label>
                            <input
                                type="number"
                                id="anneesExperience"
                                name="anneesExperience"
                                value={formData.anneesExperience}
                                onChange={handleChange}
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="biographie">Biography</label>
                        <textarea
                            id="biographie"
                            name="biographie"
                            value={formData.biographie}
                            onChange={handleChange}
                            rows="4"
                        />
                    </div>

                    <div className="form-actions">
                        <button type="button" className="cancel-btn" onClick={onCancel}>
                            Cancel
                        </button>
                        <button type="submit" className="save-btn">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProfileModal;