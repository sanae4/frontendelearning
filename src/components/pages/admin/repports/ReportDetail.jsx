// src/components/reports/AdminReports.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Reports.css';

const AdminReports = () => {
    const [reports, setReports] = useState([]);
    const [filteredReports, setFilteredReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('non-archives'); // Options: 'all', 'archives', 'non-archives'
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchReports();
    }, [filter]);

    const fetchReports = async () => {
        try {
            setLoading(true);
            let endpoint = '/api/rapports';

            if (filter === 'non-archives') {
                endpoint = 'http://192.168.11.113:8080/api/rapports/non-archives';
            }

            const response = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Erreur lors du chargement des rapports');
            }

            const data = await response.json();
            setReports(data);
            setFilteredReports(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredReports(reports);
        } else {
            const filtered = reports.filter(report =>
                report.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                report.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                report.enseignantNom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (report.etudiantNoms && report.etudiantNoms.some(nom =>
                    nom.toLowerCase().includes(searchTerm.toLowerCase())
                ))
            );
            setFilteredReports(filtered);
        }
    }, [searchTerm, reports]);

    const handleArchive = async (id) => {
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

            // Mettre à jour la liste après archivage
            fetchReports();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDelete = async (id) => {
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

                // Mettre à jour la liste après suppression
                fetchReports();
            } catch (err) {
                setError(err.message);
            }
        }
    };

    return (
        <div className="admin-reports-container">
            <h2>Gestion des rapports</h2>

            {error && <div className="error-message">{error}</div>}

            <div className="reports-controls">
                <div className="search-filter-container">
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder="Rechercher un rapport..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>

                    <div className="filter-container">
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">Tous les rapports</option>
                            <option value="non-archives">Rapports non archivés</option>
                            <option value="archives">Rapports archivés</option>
                        </select>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="loading">Chargement des rapports...</div>
            ) : filteredReports.length === 0 ? (
                <div className="no-reports">Aucun rapport trouvé</div>
            ) : (
                <div className="reports-list">
                    {filteredReports.map(report => (
                        <div key={report.id} className={`report-card ${report.estArchive ? 'archived' : ''}`}>
                            <div className="report-header">
                                <h3>{report.titre}</h3>
                                <span className="report-date">
                                    {new Date(report.date).toLocaleDateString('fr-FR')}
                                </span>
                            </div>

                            <div className="report-users">
                                <p><strong>Enseignant :</strong> {report.enseignantNom}</p>
                                {report.etudiantNoms && report.etudiantNoms.length > 0 && (
                                    <p>
                                        <strong>Étudiants concernés :</strong>{' '}
                                        {report.etudiantNoms.join(', ')}
                                    </p>
                                )}
                            </div>

                            <div className="report-content">
                                <p>{report.text.length > 150 ? `${report.text.substring(0, 150)}...` : report.text}</p>
                            </div>

                            <div className="report-footer">
                                <Link to={`/reportsdetails/${report.id}`} className="btn btn-view">
                                    Voir détails
                                </Link>

                                {report.estArchive === 0 && (
                                    <button
                                        onClick={() => handleArchive(report.id)}
                                        className="btn btn-archive"
                                    >
                                        Archiver
                                    </button>
                                )}

                                <button
                                    onClick={() => handleDelete(report.id)}
                                    className="btn btn-delete"
                                >
                                    Supprimer
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminReports;