import React from 'react';
import { Body, H3 } from '@leafygreen-ui/typography';
import Image from 'next/image';

const TextWithImage = ({ items }) => {

  if (!items || Object.keys(items).length === 0) {
    items = {
      "No Credit Card Recomended":"User credit product approval status is Rejected"
    }
  };
  console.log('typeof items', typeof items);
  //console.log('items', items);
  let itemsJSON;
  if (typeof items === 'object') {
    itemsJSON = items;
  } else {    
    itemsJSON = JSON.parse(items.replace(/\n/g, ''));
    for (let key in itemsJSON) { itemsJSON[key] = itemsJSON[key].replace(/\.-/g, '.\n-'); }
  }

  return (
    <div>
      {Object.keys(itemsJSON).map((key, index) => (
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
            src={key === "No Credit Card Recomended" ? '/images/Error.png' : '/images/creditCard.png'}
            alt="Description"
            style={{ marginRight: '10px', maxWidth: '200px', borderRadius: '10px' }}
            width={100} height={100} 
          />
          <div>
            <H3>{key}</H3>
            <Body as="pre" style={{ wordWrap: 'break-word', overflowX: 'hidden', whiteSpace: 'pre-line', overflowX: 'hidden', fontSize: '20px', fontFamily: 'sans-serif',  }} >
              {itemsJSON[key]}
            </Body>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TextWithImage;
