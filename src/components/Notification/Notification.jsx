import React from 'react';
import './Notification.css';

const Notification = ({ type, message, onClose }) => {
  return (
    <div className={`notification ${type}`}>
      <span className="material-icons icon">
        {type === 'success' ? 'check_circle' : 'error'}
      </span>
      <p>{message}</p>
      {onClose && (
        <button className="close-btn" onClick={onClose}>
          <span className="material-icons">close</span>
        </button>
      )}
    </div>
  );
};

export default Notification; 