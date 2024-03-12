// components/Sidebar.js

import React, { useState } from 'react';
import styles from '../styles/sidebar.module.css';
import { H3,Body,Subtitle }  from '@leafygreen-ui/typography';


const Sidebar = ({ profileInfo }) => {

  return (
    <div className={styles.sidebar}>
      <img className={styles.profileImage} src={'/images/userAvatar.png'} alt="Profile" />
      <div className={styles.profileDetails}>
      {profileInfo && ( 
          <>
            <div><H3 className={styles.profileItem}>Customer ID: {profileInfo['Unnamed: 0']}</H3> </div>
            <div className={styles.profileItem}>
              <Subtitle>Age:&nbsp;</Subtitle>
              <Body baseFontSize={16}>{profileInfo.age}</Body>
            </div>
            <div className={styles.profileItem}>
              <Subtitle>Monthly income:&nbsp;</Subtitle>
              <Body baseFontSize={16}>${profileInfo.MonthlyIncome}</Body>
            </div>
            <div className={styles.profileItem}>
              <Subtitle>Number of Dependents:&nbsp;</Subtitle>
              <Body baseFontSize={16}>{profileInfo.NumberOfDependents}</Body>
            </div>
            <div className={styles.profileItem}>
              <Subtitle>Debt Ratio:&nbsp;</Subtitle>
              <Body baseFontSize={16}>{profileInfo.DebtRatio}</Body>
            </div>
            <div className={styles.profileItem}>
              <Subtitle>Credit Portfolio:&nbsp;</Subtitle>
              <Body baseFontSize={16}>{profileInfo.NumberOfOpenCreditLinesAndLoans}</Body>
            </div>
            <div className={styles.profileItem}>
              <Subtitle>Property Investments:&nbsp;</Subtitle>
              <Body baseFontSize={16}>{profileInfo.NumberRealEstateLoansOrLines}</Body>
            </div>
            <div className={styles.profileItem}>
              <Subtitle>Unsecured Credit Line Use:&nbsp;</Subtitle>
              <Body baseFontSize={16}>{profileInfo.RevolvingUtilizationOfUnsecuredLines}</Body>
            </div>
            <div className={styles.profileItem}>
              <Subtitle>Number of short payment delays:&nbsp;</Subtitle>
              <Body baseFontSize={16}>{profileInfo['NumberOfTime30-59DaysPastDueNotWorse']}</Body>
            </div>
            <div className={styles.profileItem}>
              <Subtitle>Number of medium payment delays:&nbsp;</Subtitle>
              <Body baseFontSize={16}>{profileInfo['NumberOfTime60-89DaysPastDueNotWorse']}</Body>
            </div>
            <div className={styles.profileItem}>
              <Subtitle>Number of long payment delays:&nbsp;</Subtitle>
              <Body baseFontSize={16}>{profileInfo.NumberOfTimes90DaysLate}</Body>
            </div>
            <div className={styles.profileItem}>
              <Subtitle>Utility bills:&nbsp;</Subtitle>
              <Body baseFontSize={16}>NaN</Body>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
