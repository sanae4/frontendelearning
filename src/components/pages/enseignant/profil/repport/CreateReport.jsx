// src/components/reports/CreateReport.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './repport.css';

const CreateReport = ({ user }) => {
    const [report, setReport] = useState({
        title: '',
        content: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setReport(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // Payload simplifié - seulement titre, contenu et ID utilisateur
            const payload = {
                titre: report.title,
                text: report.content,
                date: new Date(),
                estArchive: 0,
            };

            // Ajouter l'ID de l'utilisateur selon son rôle
            if (user.role === 'ROLE_ETUDIANT') {
                payload.etudiantIds = [user.id];
            } else if (user.role === 'ROLE_TEACHER') {
                payload.enseignantId = user.id;
            }

            // Endpoint unique pour tous les utilisateurs
            const endpoint = 'http://localhost:8080/api/rapports';

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error('Erreur lors de l\'envoi du rapport');
            }

            setSuccess('Rapport envoyé avec succès !');
            setTimeout(() => {
                navigate('/coursesteacher');
            }, 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="report-container">
            <h2>Créer un nouveau rapport</h2>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <form onSubmit={handleSubmit} className="report-form">
                <div className="form-group">
                    <label htmlFor="title">Titre du rapport</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={report.title}
                        onChange={handleChange}
                        required
                        className="form-control"
                        placeholder="Entrez le titre du rapport"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="content">Contenu du rapport</label>
                    <textarea
                        id="content"
                        name="content"
                        value={report.content}
                        onChange={handleChange}
                        required
                        className="form-control"
                        rows="8"
                        placeholder="Détaillez votre rapport ici..."
                    />
                </div>

                <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
                        Annuler
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Envoi en cours...' : 'Envoyer le rapport'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateReport;
