// src/components/reports/ReportDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Reports.css';

const ReportDetail = ({ user }) => {
    const { id } = useParams();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchReportDetails();
    }, [id]);

    const fetchReportDetails = async () => {
        try {
            setLoading(true);
            const response = await fetch(`http://192.168.11.113:8080/api/rapports/${id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Erreur lors du chargement des détails du rapport');
            }

            const data = await response.json();
            setReport(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleArchive = async () => {
        try {
            const response = await fetch(`http://192.168.11.113:8080/api/rapports/archiver/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Erreur lors de l\'archivage du rapport');
            }

            // Mettre à jour les détails du rapport
            fetchReportDetails();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce rapport ?')) {
            try {
                const response = await fetch(`http://192.168.11.113:8080/api/rapports/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Erreur lors de la suppression du rapport');
                }

                // Rediriger vers la liste des rapports
                navigate('/admin/reports');
            } catch (err) {
                setError(err.message);
            }
        }
    };

    if (loading) {
        return <div className="loading">Chargement des détails du rapport...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    if (!report) {
        return <div className="not-found">Rapport non trouvé</div>;
    }

    return (
        <div className="report-detail-container">
            <div className="report-detail-header">
                <h2>{report.titre}</h2>
                <span className={`report-status ${report.estArchive ? 'archived' : 'active'}`}>
                    {report.estArchive ? 'Archivé' : 'Actif'}
                </span>
            </div>

            <div className="report-detail-meta">
                <p>
                    <strong>Date :</strong> {new Date(report.date).toLocaleDateString('fr-FR')}
                </p>
                <p>
                    <strong>Rédigé par :</strong> {report.enseignantNom}
                </p>
            </div>

            {report.etudiantNoms && report.etudiantNoms.length > 0 && (
                <div className="report-detail-students">
                    <h3>Étudiants concernés :</h3>
                    <ul>
                        {report.etudiantNoms.map((nom, index) => (
                            <li key={index}>{nom}</li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="report-detail-content">
                <h3>Contenu du rapport :</h3>
                <div className="report-text">
                    {report.text.split('\n').map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                    ))}
                </div>
            </div>

            {user && user.role === 'ROLE_ADMIN' && (
                <div className="report-detail-actions">
                    {report.estArchive === 0 && (
                        <button onClick={handleArchive} className="btn btn-archive">
                            Archiver ce rapport
                        </button>
                    )}
                    <button onClick={handleDelete} className="btn btn-delete">
                        Supprimer ce rapport
                    </button>
                    <button onClick={() => navigate('/admin/reports')} className="btn btn-back">
                        Retour à la liste
                    </button>
                </div>
            )}
        </div>
    );
};

export default ReportDetail;