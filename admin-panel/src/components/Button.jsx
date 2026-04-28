import React from 'react';
import './Button.css';

const Button = ({ 
  children, 
  variant = 'primary', // primary, secondary, black, outlined, text
  size = 'medium', 
  className = '', 
  ...props 
}) => {
  return (
    <button 
      className={`sb-button sb-button--${variant} sb-button--${size} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
