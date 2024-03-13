// components/Sidebar.js

import React, { useState } from 'react';
import styles from '../styles/sidebar.module.css';
import { H3,Body,Subtitle }  from '@leafygreen-ui/typography';
import { NumberInput } from '@leafygreen-ui/number-input';
import Button  from '@leafygreen-ui/button';
import Popup from '../components/Popup';
import axios from 'axios';  



const Sidebar = ({ profileInfo }) => {
  const [isPopupOpen, setPopupOpen] = useState(false);
  const [Age, setAge] = useState(null);
  const [Income, setIncome] = useState(null);
  const [Dependents, setDependents] = useState(null);
  const [Portfolio, setPortfolio] = useState(null);
  const [Investments, setInvestments] = useState(null);

  const handleClick = () => {
    setPopupOpen(true);
  };

  const handleClosePopup = () => {
    setPopupOpen(false);
  };
  
  const handleAge = (event) => {
    const { value } = event.target;
    setAge(value);
  };
  
  const handleIncome = (event) => {
    const { value } = event.target;
    setIncome(value);
  };
  
  const handleDependents = (event) => {
    const { value } = event.target;
    setDependents(value);
  };
  
  const handlePortfolio = (event) => {
    const { value } = event.target;
    setPortfolio(value);
  };
  
  const handleInvestments = (event) => {
    const { value } = event.target;
    setInvestments(value);
  };
  

  const handleSubmit = async () => {
    
    const userData = {
      ...(Age !== null && { "age": parseInt(Age, 10) }),
      ...(Income !== null && { "MonthlyIncome": parseInt(Income, 10) }),
      ...(Dependents !== null && { "NumberOfDependents": parseInt(Dependents, 10) }),
      ...(Portfolio !== null && { "NumberOfOpenCreditLinesAndLoans": parseInt(Portfolio, 10) }),
      ...(Investments !== null && { "NumberRealEstateLoansOrLines": parseInt(Investments, 10) }),
    };
    console.log('Submitted user data:', userData);

    const clientId = localStorage.getItem('clientId');
    const filter = {"Unnamed: 0":parseInt(clientId, 10)}

    const body = { "filter":filter, "update": { $set: userData } };
    console.log('body:', body);

    const response = await axios.post('../api/updateOne', body);

    if (response.status === 200) {
      console.log('Record updated successfully:', response.data);
      // Close the popup
      setPopupOpen(false);
      window.location.reload();
    } else {
      console.log('Record updated unsuccessfully:', response.data);
    }    
  }

  
  return (
  <div>
    {isPopupOpen && <div className="header-backdrop" />}
    {isPopupOpen && <div className="button-backdrop" />}
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
              <Subtitle>Credit Portfolio:&nbsp;</Subtitle>
              <Body baseFontSize={16}>{profileInfo.NumberOfOpenCreditLinesAndLoans}</Body>
            </div>
            <div className={styles.profileItem}>
              <Subtitle>Property Investments:&nbsp;</Subtitle>
              <Body baseFontSize={16}>{profileInfo.NumberRealEstateLoansOrLines}</Body>
            </div>
            <div className={styles.profileItem}>
              <Subtitle>Debt Ratio:&nbsp;</Subtitle>
              <Body baseFontSize={16}>{profileInfo.DebtRatio}</Body>
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

            <Button size={'default'} baseFontSize={16} onClick={handleClick} > Edit profile </Button>
            <Popup isOpen={isPopupOpen} onClose={handleClosePopup}>
              <H3 style={{ marginTop: '15px',marginBottom: '10px', }}>Editing your profile</H3>
              <form>
              <div className={styles.profileItem}>
                <NumberInput label="Age:" placeholder="Age" onChange={handleAge} value={Age}/>
              </div>
              <div className={styles.profileItem}>
                <NumberInput label="Monthly income:" placeholder="Monthly income" onChange={handleIncome} value={Income}/>
              </div>
              <div className={styles.profileItem}>
                <NumberInput label="Number of Dependents:" placeholder="Number of Dependents" onChange={handleDependents} value={Dependents}/>
              </div>
              <div className={styles.profileItem}>
                <NumberInput label="Credit Portfolio:" placeholder="Credit Portfolio" onChange={handlePortfolio} value={Portfolio}/>
              </div>
              <div className={styles.profileItem}>
                <NumberInput label="Property Investments:" placeholder="Property Investments" onChange={handleInvestments} value={Investments}/>
              </div>  
              <Button size={'default'} baseFontSize={16} onClick={handleSubmit} className={styles.submit}> Submit </Button>
              </form>
            </Popup>
          </>
        )}
      </div>
    </div>
  </div>
  );
};

export default Sidebar;
