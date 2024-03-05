// components/Sidebar.js

import React, { useState } from 'react';
import styles from '../styles/sidebar.module.css';
import { H3,Body }  from '@leafygreen-ui/typography';


const Sidebar = ({ profileInfo }) => {

  return (
    <div className={styles.sidebar}>
      <img className={styles.profileImage} src={'/images/userAvatar.png'} alt="Profile" />
      <div className={styles.profileDetails}>
      {profileInfo && ( // Check if profileInfo is not null before rendering
          <>
            <H3 style = {{ marginBottom: '20px', fontSize: '22px' }}>Customer ID: {profileInfo['Unnamed: 0']}</H3>
            <Body style={{ marginBottom: '15px', fontSize: '22px' }}>Email: {profileInfo.email}</Body>
            <Body style={{ marginBottom: '15px', fontSize: '22px' }}>Age: {profileInfo.age}</Body>
            <Body style={{ marginBottom: '15px', fontSize: '22px' }}>Monthly Income: {profileInfo.MonthlyIncome}</Body>
            <Body style={{ marginBottom: '15px', fontSize: '22px' }}>Number of Open Credit Lines and Loans: {profileInfo.NumberOfOpenCreditLinesAndLoans}</Body>
            <Body style={{ marginBottom: '15px', fontSize: '22px' }}>Number of Real Estate Loans or Lines: {profileInfo.NumberRealEstateLoansOrLines}</Body>
            <Body style={{ marginBottom: '15px', fontSize: '22px' }}>Serious Dlq in 2yrs: {profileInfo.SeriousDlqin2yrs}</Body>
            <Body style={{ marginBottom: '15px', fontSize: '22px' }}>Revolving Utilization Of Unsecured Lines: {profileInfo.RevolvingUtilizationOfUnsecuredLines}</Body>
            <Body style={{ marginBottom: '15px', fontSize: '22px' }}>Number Of Times 30-59 Days Past Due Not Worse: {profileInfo['NumberOfTime30-59DaysPastDueNotWorse']}</Body>
            <Body style={{ marginBottom: '15px', fontSize: '22px' }}>Number Of Times 90 Days Late: {profileInfo.NumberOfTimes90DaysLate}</Body>
            <Body style={{ marginBottom: '15px', fontSize: '22px' }}>Number Of Times 60-89 Days Past Due Not Worse: {profileInfo['NumberOfTime60-89DaysPastDueNotWorse']}</Body>
            <Body style={{ marginBottom: '15px', fontSize: '22px' }}>Number of Dependents: {profileInfo.NumberOfDependents}</Body>
          </>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
