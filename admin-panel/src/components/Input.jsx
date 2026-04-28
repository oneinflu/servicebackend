import React, { useState } from 'react';
import './Input.css';

const Input = ({ label, id, error, ...props }) => {
  const [focused, setFocused] = useState(false);
  const value = props.value || '';

  return (
    <div className={`sb-input-container ${focused || value ? 'active' : ''} ${error ? 'error' : ''}`}>
      <label htmlFor={id} className="sb-label">{label}</label>
      <input
        id={id}
        className="sb-input"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
      {error && <span className="sb-error-text">{error}</span>}
    </div>
  );
};

export default Input;
