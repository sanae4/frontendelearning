import React from 'react';
import './CategoryCard.css';

const CategoryCard = ({ category, onClick }) => {
    // Function to get the category icon
    const getIconComponent = () => {
        // If the category has a defined icon, use it
        if (category.icon) {
            return <img src={category.icon} alt={`Icon ${category.titre}`} className="category-icon" />;
        }

        const defaultIcons = {
            'back-end': <i className="fas fa-server"></i>,
            'front-end': <i className="fas fa-desktop"></i>,
            'it': <i className="fas fa-laptop-code"></i>,
            'marketing': <i className="fas fa-bullhorn"></i>,
            'test': <i className="fas fa-vial"></i>,
            'default': <i className="fas fa-folder"></i>
        };

        const categoryKey = category.titre.toLowerCase().replace(/ /g, '-');
        return (
            <div className="default-icon">
                {defaultIcons[categoryKey] || defaultIcons['default']}
            </div>
        );
    };

    return (
        <div className="category-card" onClick={onClick}>
            <div className="category-icon-container">
                {getIconComponent()}
            </div>
            <div className="category-content">
                <h3 className="category-title">{category.titre}</h3>
                <p className="category-description">{category.description}</p>
            </div>
            <button className="view-more-btn">View More</button>
        </div>
    );
};

export default CategoryCard;
