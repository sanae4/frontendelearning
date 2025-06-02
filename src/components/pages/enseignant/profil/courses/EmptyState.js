import React from 'react';
import './EmptyState.css';

const EmptyState = ({ message, subMessage }) => {
    return (
        <div className="empty-state">
            <div className="empty-icon">
                <i className="fas fa-search"></i>
            </div>
            <h3>{message}</h3>
            {subMessage && <p>{subMessage}</p>}
        </div>
    );
};

export default EmptyState;
