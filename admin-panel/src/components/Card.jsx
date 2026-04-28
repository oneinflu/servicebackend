import React from 'react';
import './Card.css';

const Card = ({ children, title, subtitle, className = '', ...props }) => {
  return (
    <div className={`sb-card ${className}`} {...props}>
      {(title || subtitle) && (
        <div className="sb-card__header">
          {title && <h3 className="sb-card__title">{title}</h3>}
          {subtitle && <p className="sb-card__subtitle">{subtitle}</p>}
        </div>
      )}
      <div className="sb-card__content">
        {children}
      </div>
    </div>
  );
};

export default Card;
