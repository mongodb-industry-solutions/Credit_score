//'use client'
import React from 'react';
import styles from '../styles/header.module.css';

function Header() {
  return (
    <div className={styles["layout-header"]}>
      <img src="images/MongoDB_Fores-Green.svg" alt="Logo" className={styles["logo"]}/>
      <div className={styles["user-info"]}>
        <img src="images/userAvatar.png" alt="User Avatar" className={styles["user-avatar"]} />
        <div>
            <div className={styles["user-name"]}>Eddie Grant</div>
            <div className={styles["user-job-title"]}>Bank empoyee</div>
        </div>
      </div>
    </div>
  );
}

export default Header;

