import React from 'react';
import './StatusFilter.css';

const StatusFilter = ({ activeFilter, onFilterChange }) => {
    const statusOptions = [
        { id: 'ALL', label: 'All Courses' },
        { id: 'PUBLISHED', label: 'Published' },
        { id: 'APPROVED', label: 'Approved' },
        { id: 'DRAFT', label: 'Drafts' }
    ];

    return (
        <div className="status-filter">
            <span className="filter-label">Filter by status:</span>
            <div className="filter-options">
                {statusOptions.map(option => (
                    <button
                        key={option.id}
                        className={`filter-btn ${activeFilter === option.id ? 'active' : ''}`}
                        onClick={() => onFilterChange(option.id)}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default StatusFilter;