// src/components/reports/CreateReport.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../../admin/repports/Reports.css';

const CreateReport = ({ user }) => {
    const [report, setReport] = useState({
        title: '',
        content: '',
        studentIds: [],
    });
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    useEffect(() => {

    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setReport(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleStudentSelect = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions, option => Number(option.value));
        setReport(prev => ({
            ...prev,
            studentIds: selectedOptions
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const payload = {
                ...report,
                date: new Date(),
                isArchived: 0,
            };

            // If user is a student, we don't need to add student IDs
            if (user.role === 'ROLE_STUDENT') {
                payload.studentIds = [user.id]; // Add current student's ID
            }

            // Add teacher ID if user is a teacher
            if (user.role === 'ROLE_TEACHER') {
                payload.teacherId = user.id;
            }

            const endpoint = user.role === 'ROLE_TEACHER' ? 'http://192.168.11.113:8080/api/rapports/manual' : 'http://192.168.11.113:8080/api/rapports';

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error('Error while sending the report');
            }

            setSuccess('Report sent successfully!');
            setTimeout(() => {
                navigate('/profile');
            }, 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="report-container">
            <h2>Create New Report</h2>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <form onSubmit={handleSubmit} className="report-form">
                <div className="form-group">
                    <label htmlFor="title">Report Title</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={report.title}
                        onChange={handleChange}
                        required
                        className="form-control"
                        placeholder="Enter report title"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="content">Report Content</label>
                    <textarea
                        id="content"
                        name="content"
                        value={report.content}
                        onChange={handleChange}
                        required
                        className="form-control"
                        rows="8"
                        placeholder="Detail your report here..."
                    />
                </div>

                <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Sending...' : 'Send Report'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateReport;