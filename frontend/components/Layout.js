// components/Layout.js

import React from 'react';
import styles from '../styles/layout.module.css';
import { useShrinkState } from '../context/AppContext';

const Layout = ({ isShrunk, children }) => {

  const layoutStyle = {
    marginLeft: isShrunk ? '48px' : '420px', // Adjust the left margin based on the sidebar's state
    transition: 'margin-left 0.3s ease-in-out', // Add a smooth transition effect
  };

  return (
    <div className={styles.container} style={layoutStyle}>
      <div className={styles.section}>
        {children}
      </div>
    </div>
  );
};

export default Layout;
