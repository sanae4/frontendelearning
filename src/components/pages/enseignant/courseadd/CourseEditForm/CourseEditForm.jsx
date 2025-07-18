import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import './CourseEditForm.css';

const API_URL = 'http://localhost:8080/api';

const CourseEditForm = () => {
    const { id: courseId } = useParams();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [course, setCourse] = useState({
        titreCours: '',
        description: '',
        about: '',
        courselevel: '',
        prix: 0,
        langage: '',
        image: ''
    });

    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [imagePreview, setImagePreview] = useState('');

    useEffect(() => {
        if (courseId) {
            fetchCourseDetails();
        }
    }, [courseId]);

    const fetchCourseDetails = async () => {
        setIsFetching(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Vous devez être connecté');
                setIsFetching(false);
                return;
            }

            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            };

            const response = await axios.get(`${API_URL}/course/${courseId}`, config);
            setCourse(response.data);

            // Si une image existe, définir l'aperçu
            if (response.data.image) {
                setImagePreview(response.data.image);
            }
        } catch (err) {
            console.error('Erreur lors du chargement du cours:', err.response?.data || err.message);
            setError(err.response?.data?.message || 'Erreur lors du chargement du cours');
        } finally {
            setIsFetching(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type } = e.target;

        // Conversion spéciale pour le champ prix (nombre)
        if (name === 'prix') {
            setCourse({
                ...course,
                [name]: parseFloat(value) || 0
            });
        } else {
            setCourse({
                ...course,
                [name]: value
            });
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Vérifier le type de fichier
        if (!file.type.match('image.*')) {
            setError('Veuillez sélectionner une image valide');
            return;
        }

        // Vérifier la taille du fichier (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('L\'image ne doit pas dépasser 5MB');
            return;
        }

        // Créer un aperçu de l'image
        const reader = new FileReader();
        reader.onload = (e) => {
            setImagePreview(e.target.result);
            // Stocker l'image en base64
            setCourse({
                ...course,
                image: e.target.result
            });
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        if (!course.titreCours?.trim()) {
            setError('Le titre du cours est requis');
            setIsLoading(false);
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            setError('Vous devez être connecté');
            setIsLoading(false);
            return;
        }

        try {
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            };

            // Préparer le payload selon la structure de CourseCreateUpdateDTO
            const payload = {
                titreCours: course.titreCours,
                description: course.description || '',
                about: course.about || '',
                courselevel: course.courselevel || '',
                prix: course.prix || 0,
                langage: course.langage || '',
                statusCours: 'DRAFT', // Valeur par défaut, non modifiable par l'utilisateur
                image: course.image || '',
                categoryId: course.categoryId,
                enseignantId: course.enseignantId
            };

            console.log("Payload envoyé:", payload); // Pour déboguer

            // Mise à jour du cours
            const response = await axios.put(`${API_URL}/course/${courseId}`, payload, config);
            setSuccess('Cours mis à jour avec succès!');

            // Attendre un peu avant de rediriger
            setTimeout(() => {
                navigate(`/course/${courseId}/lessons`);
            }, 2000);

        } catch (err) {
            console.error('Erreur:', err.response?.data || err.message);
            setError(err.response?.data?.message || 'Erreur lors de la mise à jour du cours');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        navigate(`/course/${courseId}/lessons`);
    };

    if (isFetching) {
        return <div className="course-loading">Chargement des informations du cours...</div>;
    }

    return (
        <div className="course-edit-container">
            <h2 className="course-edit-title">Modifier le cours</h2>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <form onSubmit={handleSubmit} className="course-edit-form">
                <div className="form-group">
                    <label htmlFor="titreCours" className="form-label">Titre du cours</label>
                    <input
                        type="text"
                        id="titreCours"
                        name="titreCours"
                        placeholder="Titre du cours"
                        className="form-control"
                        value={course.titreCours || ''}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="description" className="form-label">Description du cours</label>
                    <textarea
                        id="description"
                        name="description"
                        placeholder="Description du cours"
                        className="form-control"
                        rows="4"
                        value={course.description || ''}
                        onChange={handleInputChange}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="about" className="form-label">À propos du cours</label>
                    <textarea
                        id="about"
                        name="about"
                        placeholder="À propos du cours"
                        className="form-control"
                        rows="3"
                        value={course.about || ''}
                        onChange={handleInputChange}
                    />
                </div>

                <div className="form-row">
                    <div className="form-group half-width">
                        <label htmlFor="courselevel" className="form-label">Niveau</label>
                        <select
                            id="courselevel"
                            name="courselevel"
                            className="form-control"
                            value={course.courselevel || ''}
                            onChange={handleInputChange}
                        >
                            <option value="">Sélectionnez un niveau</option>
                            <option value="BEGINNER">Débutant</option>
                            <option value="INTERMEDIATE">Intermédiaire</option>
                            <option value="ADVANCED">Avancé</option>
                            <option value="EXPERT">Expert</option>
                        </select>
                    </div>

                    <div className="form-group half-width">
                        <label htmlFor="langage" className="form-label">Langue</label>
                        <select
                            id="langage"
                            name="langage"
                            className="form-control"
                            value={course.langage || ''}
                            onChange={handleInputChange}
                        >
                            <option value="">Sélectionnez une langue</option>
                            <option value="FRENCH">Français</option>
                            <option value="ENGLISH">Anglais</option>
                            <option value="SPANISH">Espagnol</option>
                            <option value="GERMAN">Allemand</option>
                            <option value="ARABIC">Arabe</option>
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="prix" className="form-label">Prix</label>
                    <input
                        type="number"
                        id="prix"
                        name="prix"
                        placeholder="Prix du cours"
                        className="form-control"
                        value={course.prix || 0}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="image" className="form-label">Image du cours</label>
                    <div className="image-upload-container">
                        <input
                            type="file"
                            id="image"
                            name="image"
                            accept="image/*"
                            className="image-upload-input"
                            onChange={handleImageChange}
                            ref={fileInputRef}
                        />
                        <button
                            type="button"
                            className="image-upload-button"
                            onClick={() => fileInputRef.current.click()}
                        >
                            Choisir une image
                        </button>
                        <span className="image-upload-filename">
                            {imagePreview ? 'Image sélectionnée' : 'Aucune image sélectionnée'}
                        </span>
                    </div>

                    {imagePreview && (
                        <div className="image-preview">
                            <img src={imagePreview} alt="Aperçu du cours" />
                        </div>
                    )}
                </div>

                <div className="form-actions">
                    <button
                        type="submit"
                        className="submit-btn"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Mise à jour en cours...' : 'Mettre à jour le cours'}
                    </button>

                    <button
                        type="button"
                        className="cancel-btn"
                        onClick={handleCancel}
                    >
                        Annuler
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CourseEditForm;
