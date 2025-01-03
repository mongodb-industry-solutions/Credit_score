import React from 'react';
import { Body, H3 } from '@leafygreen-ui/typography';
import Image from 'next/image';

const TextWithImage = ({ items = [] }) => {
  if (!items || items.length === 0) {
    items = [{
      name: "No Credit Card Recommended",
      description: "User credit product approval status is Rejected"
    }];
  }

  console.log('items array:', items);

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
          <Image
            src={item.name === "No Credit Card Recommended" ? '/images/Error.png' : '/images/creditCard.png'}
            alt="Credit Card"
            style={{ marginRight: '10px', maxWidth: '200px', borderRadius: '10px' }}
            width={100} height={100}
          />
          <div>
            <H3>{item.name}</H3>
            <Body as="pre" style={{ wordWrap: 'break-word', overflowX: 'hidden', whiteSpace: 'pre-line', fontSize: '18px', fontFamily: 'sans-serif' }}>
              {item.description
                .split('. ') // Split the text into sentences
                .slice(0, 6) // Get the first 6 sentences
                .join('. ') // Join them back into a single string
                .concat('.') // Add a period at the end if needed
              } 
            </Body>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TextWithImage;
