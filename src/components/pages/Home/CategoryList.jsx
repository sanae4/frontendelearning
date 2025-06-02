import React from 'react';
import CategoryCard from './CategoryCard';
import './CategoryList.css';

const CategoryList = ({ categories, onCategoryClick }) => {
    if (!categories || categories.length === 0) {
        return <div className="no-categories">No categories available</div>;
    }

    return (
        <div className="category-list">
            {categories.map(category => (
                <CategoryCard
                    key={category.id}
                    category={category}
                    onClick={() => onCategoryClick(category)}
                />
            ))}
        </div>
    );
};

export default CategoryList;
