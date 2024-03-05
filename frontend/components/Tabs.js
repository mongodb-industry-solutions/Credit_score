// components/TabsComponent.js

import React, { useState } from 'react';
import styles from '../styles/tabs.module.css';
import { H3,Body }  from '@leafygreen-ui/typography';

const TabsComponent = ({ textSet1, textSet2 }) => {
  const [activeTab, setActiveTab] = useState(1);

  const handleTabClick = (tabNumber) => {
    setActiveTab(tabNumber);
  };

  return (
    <div className={styles.tabsContainer}>
      <div className={styles.tabRow}>
        <div className={`${styles.tab} ${activeTab === 1 ? styles.active : ''}`} onClick={() => handleTabClick(1)}>
          <H3>Rejection explaination</H3>
        </div>
        <div className={`${styles.tab} ${activeTab === 2 ? styles.active : ''}`} onClick={() => handleTabClick(2)}>
        <H3>Product offerings</H3>
        </div>
      </div>
      <div className={styles.textContainer}>
        {activeTab === 1 && <Body style={{ fontSize: '24px' }}>{textSet1}</Body>}
        {activeTab === 2 && <Body style={{ fontSize: '24px' }}>{textSet2}</Body>}
      </div>
    </div>
  );
};

export default TabsComponent;
