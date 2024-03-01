// components/Sidebar.js

import React, { useState, useEffect, useRef } from 'react';
import Icon from '@leafygreen-ui/icon';
import { ShrinkContext, useShrinkContext } from  '../context/AppContext';
import styles from '../styles/sidebar.module.css';


const Sidebar = ({ profileInfo }) => {
    const { isShrunk, setIsShrunk } = useShrinkContext();
    
    const sidebarRef = useRef(null);
  
    const toggleSidebar = () => {
      setIsShrunk(!isShrunk);
    };
  
    const handleSidebarClick = () => {
      setIsShrunk(false);
    };
  
    useEffect(() => {
      if (sidebarRef.current) {
        sidebarRef.current.addEventListener('click', handleSidebarClick);
  
        return () => {
          sidebarRef.current.removeEventListener('click', handleSidebarClick);
        };
      }
    }, [sidebarRef.current]);

  const chevronStyle = {
    marginTop: '15px', // Adjust the top margin as needed
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginRight: '10px', // Adjust the left margin when the sidebar is not shrunk
  };

  return (
    <div className={`${styles.sidebar} ${isShrunk ? styles.shrunk : ''}`} ref={sidebarRef}>
      <div className={styles.toggleButton} style={chevronStyle} onClick={toggleSidebar}>
        {isShrunk ? <Icon glyph="ChevronRight" /> : <Icon glyph="ChevronLeft" />}
      </div>
      {!isShrunk && (
        <div className={styles.profileContainer}>
          <img className={styles.profileImage} src={profileInfo.avatar} alt="Profile" />
          <div className={styles.profileDetails}>
            <h3>{profileInfo.name}</h3>
            <p>{profileInfo.email}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
