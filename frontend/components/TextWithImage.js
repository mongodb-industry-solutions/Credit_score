import React from 'react';
import { Body } from '@leafygreen-ui/typography';

const TextWithImage = ({ items }) => {
  return (
    <div>
      {items.map((item, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            alignItems: 'center',
            margin: '20px',
            background: '#ffffff', 
            borderRadius: '10px', 
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', 
          }}
        >
          <img
            src={'/images/creditCard.png'}
            alt="Description"
            style={{ marginRight: '10px', maxWidth: '200px', borderRadius: '10px' }}
          />
          <Body baseFontSize={16}>{item}</Body>
        </div>
      ))}
    </div>
  );
};

export default TextWithImage;
