// Popup.js

import React from 'react';
import '../styles/Popup.css'; 

const Popup = ({ isOpen, onClose, children }) => {
  const popupClassName = isOpen ? 'popup-container open' : 'popup-container';

  return (
    <div className={popupClassName}>
      <div className="popup">
        <button className="close-button" onClick={onClose}>
          &times;
        </button>
        {children}
      </div>
    </div>
  );
};

export default Popup;
