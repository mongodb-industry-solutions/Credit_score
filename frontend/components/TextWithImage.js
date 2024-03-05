// components/TextWithImage.js
import React from 'react';
import { Body }  from '@leafygreen-ui/typography';

const TextWithImage = ({ items }) => {
  return (
    <div>
      {items.map((item, index) => (
        <div key={index} style={{ display: 'flex', alignItems: 'center', margin: '30px' }}>
            <img src={'/images/creditCard.png'} alt="Description" style={{ marginRight: '10px', maxWidth: '200px' }} />
            <Body style={{ fontSize: '24px' }}>{item}</Body>
        </div>
        ))}
    </div>
  );
};

export default TextWithImage;
