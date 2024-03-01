// components/TabsComponent.js

import React, { useState } from 'react';
import styles from '../styles/tabs.module.css';

const TabsComponent = ({ textSet1, textSet2 }) => {
  const [activeTab, setActiveTab] = useState(1);

  const handleTabClick = (tabNumber) => {
    setActiveTab(tabNumber);
  };

  return (
    <div className={styles.tabsContainer}>
      <div className={styles.tabRow}>
        <div className={`${styles.tab} ${activeTab === 1 ? styles.active : ''}`} onClick={() => handleTabClick(1)}>
          User profile overview
        </div>
        <div className={`${styles.tab} ${activeTab === 2 ? styles.active : ''}`} onClick={() => handleTabClick(2)}>
          Product offerings
        </div>
      </div>
      <div className={styles.textContainer}>
        {activeTab === 1 && <p>{textSet1}</p>}
        {activeTab === 2 && <p>{textSet2}</p>}
      </div>
    </div>
  );
};

export default TabsComponent;
