import React from 'react';
import './Breadcrumb.css';

const Breadcrumb = ({ items, onClick }) => {
    return (
        <div className="breadcrumb">
            {items.map((item, index) => (
                <React.Fragment key={index}>
                    <span
                        className="breadcrumb-item"
                        onClick={() => onClick(item, index)}
                    >
                        {item.titre}
                    </span>
                    {index < items.length - 1 && <span className="breadcrumb-separator">&gt;</span>}
                </React.Fragment>
            ))}
        </div>
    );
};

export default Breadcrumb;
