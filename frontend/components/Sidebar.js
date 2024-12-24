// components/Sidebar.js

import React, { useEffect, useState } from 'react';
import styles from '../styles/sidebar.module.css';
import { H3, Body, Subtitle } from '@leafygreen-ui/typography';
import { NumberInput } from '@leafygreen-ui/number-input';
import Button from '@leafygreen-ui/button';
import Popup from '../components/Popup';
import axios from 'axios';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import ProfileSlider from '../components/ProfileSlider';
import Image from 'next/image';
import Link  from 'next/link';
import { useRouter } from 'next/router';




// Name
// Age
// Occupation
// Annual_Income
// Monthly_Inhand_Salary
// Delay_from_due_date
// Num_of_Delayed_Payment
// Credit_Mix
// Credit_Utilization_Ratio
// Type_of_Loan
// Monthly_Balance
// Payment_Behaviour

// Outstanding_Debt 0.1606545
// Interest_Rate 0.14227411
// Annual_Income 0.107903264
// Monthly_Rental_Commitment 0.07572761
// Monthly_Inhand_Salary 0.057784867
// Num_of_Delayed_Payment 0.019657858
// Delay_from_due_date 0.013122446
// Num_Bank_Accounts 0.01130122
// Num_Credit_Card 0.010898941
// Num_Credit_Inquiries 0.008201968
// Total_EMI_per_month 0.0059829
// Changed_Credit_Limit 0.0058596977
// Num_of_Loan 0.0036665471
// Payment_Behaviour 0.0016400967


const Sidebar = ({ profileInfo }) => {
  const [isPopupOpen, setPopupOpen] = useState(false);
  console.log(profileInfo);
  const [Name, setName] = useState(profileInfo.Name);
  const [Occupation, setOccupation] = useState(profileInfo.Occupation);
  const [Age, setAge] = useState(profileInfo.Age);
  const [Income, setIncome] = useState(profileInfo.Monthly_Inhand_Salary);
  const [Annual_Income, setAnnual_Income] = useState(profileInfo.Annual_Income);
  const [Credit_Mix, setCredit_Mix] = useState(profileInfo.Credit_Mix);
  const [Credit_Utilization_Ratio, setCredit_Utilization_Ratio] = useState(profileInfo.Credit_Utilization_Ratio);
  const [Type_of_Loan, setType_of_Loan] = useState(profileInfo.Type_of_Loan);
  const [Monthly_Balance, setMonthly_Balance] = useState(profileInfo.Monthly_Balance);
  const [Payment_Behaviour, setPayment_Behaviour] = useState(profileInfo.Payment_Behaviour);
  const [Interest_Rate, setInterest_Rate] = useState(profileInfo.Interest_Rate);
  const [Outstanding_Debt, setOutstanding_Debt] = useState(profileInfo.Outstanding_Debt);
  const [Num_Credit_Card, setNum_Credit_Card] = useState(profileInfo.Num_Credit_Card);
  const [Num_Bank_Accounts, setNum_Bank_Accounts] = useState(profileInfo.Num_Bank_Accounts);
  const [Num_of_Delayed_Payment, setNumOfDelayedPayments] = useState(profileInfo.Num_of_Delayed_Payment);
  const [Total_EMI_per_month, setTotal_EMI_per_month] = useState(profileInfo.Total_EMI_per_month);
  const [Monthly_Inhand_Salary, setMonthly_Inhand_Salary] = useState(profileInfo.Monthly_Inhand_Salary);
  const [Monthly_Rental_Commitment, setMonthlyRentalCommitment] = useState(profileInfo.Monthly_Rental_Commitment);


  const setters = {
    age: setAge,
    income: setIncome,
    annualIncome: setAnnual_Income,
    creditMix: setCredit_Mix,
    creditUtilizationRatio: setCredit_Utilization_Ratio,
    typeOfLoan: setType_of_Loan,
    monthlyBalance: setMonthly_Balance,
    paymentBehaviour: setPayment_Behaviour,
    interestRate: setInterest_Rate,
    outstandingDebt: setOutstanding_Debt,
    numCreditCard: setNum_Credit_Card,
    numBankAccounts: setNum_Bank_Accounts,
    numDelayedPayments: setNumOfDelayedPayments,
    totalEMIperMonth: setTotal_EMI_per_month,
    monthlyInhandSalary: setMonthly_Inhand_Salary,
    monthlyRentalCommitment: setMonthlyRentalCommitment
  };

  const router = useRouter();

  const defaultSliderStyle = {
    track: { backgroundColor: 'green' },
    handle: { borderColor: 'white', backgroundColor: 'black' },
  };

  const handleSliderChange = (event, param) => {
    const setter = setters[param];
    if (setter) {
      setter(event);
    }
  };


  const handleSubmit = async () => {

    const userData = {
      ...(Monthly_Rental_Commitment !== null && { "Monthly_Rental_Commitment": parseFloat(Monthly_Rental_Commitment) }),
      ...(Outstanding_Debt !== null && { "Outstanding_Debt": parseFloat(Outstanding_Debt) }),
      ...(Num_Credit_Card !== null && { "Num_Credit_Card": parseInt(Num_Credit_Card, 10) }),
      ...(Num_Bank_Accounts !== null && { "Num_Bank_Accounts": parseInt(Num_Bank_Accounts, 10) }),
      ...(Total_EMI_per_month !== null && { "Total_EMI_per_month": parseFloat(Total_EMI_per_month) }),
      ...(Monthly_Inhand_Salary !== null && { "Monthly_Inhand_Salary": parseFloat(Monthly_Inhand_Salary) }),
      ...(Num_of_Delayed_Payment !== null && { "Num_of_Delayed_Payment": parseInt(Num_of_Delayed_Payment, 10) }),
    };
    console.log('Printing user data....');
    console.log('userData:', userData);
    
    console.log('Submitted user data:', userData);

    let clientId = localStorage.getItem('clientId');
    if (clientId === null) {
        clientId = router.query.clientid
    }
    console.log('login', clientId)
    const filter = { "Customer_ID": parseInt(clientId, 10) }

    const body = { "filter": filter, "update": { $set: userData } };
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
        <div style={{ display: "flex", flexDirection: "row", justifyContent: "flex-start", alignItems: "flex-start", marginBottom: "10%" }}>
          <Image className={styles.profileImage} src={'/images/userAvatar.png'}  alt="Profile" width={100} height={100} />
          {profileInfo && (
            <div style={{ marginTop: "10%",marginLeft: "5%" }} >
              <H3> {profileInfo.Name}</H3>
              <Subtitle> {profileInfo.Occupation}</Subtitle>
              <Subtitle> {profileInfo.Age} years</Subtitle>
              <Subtitle >{profileInfo.Customer_ID}</Subtitle>
            </div>

          )}
        </div>
        <div className={styles.profileDetails}>
          {profileInfo && (
            <>

              <div className={styles.profileItem}>
                <Body style={{ width: "20%" }}><strong>Monthly Rentals:&nbsp; </strong></Body>
                <Slider onChange={(event) => handleSliderChange(event, 'monthlyRentalCommitment')}
                  styles={defaultSliderStyle}
                  defaultValue={Monthly_Rental_Commitment} style={{ width: "55%" }} 
                  min={0} max={Annual_Income/12}/>
                <Body baseFontSize={9} style={{ width: "10%" }}>${Monthly_Rental_Commitment.toFixed(0)}</Body>
              </div>

              <div className={styles.profileItem}>
                <Body style={{ width: "20%" }}><strong>Outstanding Debt:&nbsp;</strong></Body>
                <Slider max={10000} onChange={(event) => handleSliderChange(event, 'outstandingDebt')}
                  styles={defaultSliderStyle}
                  defaultValue={Outstanding_Debt} style={{ width: "55%" }} 
                  min={0} />
                <Body baseFontSize={9} style={{ width: "10%" }}>${Outstanding_Debt.toFixed(0)}</Body>
              </div>


              <div className={styles.profileItem}>
                <Body style={{ width: "20%" }}><strong>Num Credit Card:&nbsp;</strong></Body>
                <Slider max={10} onChange={(event) => handleSliderChange(event, 'numCreditCard')}
                  styles={defaultSliderStyle}
                  defaultValue={Num_Credit_Card} style={{ width: "55%" }} 
                  min={0} />
                <Body baseFontSize={9} style={{ width: "10%" }}>{Num_Credit_Card.toFixed(0)}</Body>
              </div>

              <div className={styles.profileItem}>
                <Body style={{ width: "20%" }}><strong>Num Bank Accounts:&nbsp;</strong></Body>
                <Slider max={10} onChange={(event) => handleSliderChange(event, 'numBankAccounts')}
                  styles={defaultSliderStyle}
                  defaultValue={Num_Bank_Accounts} style={{ width: "55%" }} 
                  min={0} />
                <Body baseFontSize={9} style={{ width: "10%" }}>{Num_Bank_Accounts.toFixed(0)}</Body>
              </div>

              <div className={styles.profileItem}>
                <Body style={{ width: "20%" }}><strong>Total EMI per month:&nbsp;</strong></Body>
                <Slider max={Annual_Income/12} onChange={(event) => handleSliderChange(event, 'totalEMIperMonth')}
                  styles={defaultSliderStyle}
                  defaultValue={Total_EMI_per_month} style={{ width: "55%" }} 
                  min={0} />
                <Body baseFontSize={9} style={{ width: "10%" }}>${Total_EMI_per_month.toFixed(0)}</Body>
              </div>

              <div className={styles.profileItem}>
                <Body style={{ width: "20%" }}><strong>Monthly Inhand Salary:&nbsp;</strong></Body>
                <Slider max={15000} onChange={(event) => handleSliderChange(event, 'monthlyInhandSalary')}
                  styles={defaultSliderStyle}
                  defaultValue={Monthly_Inhand_Salary} style={{ width: "55%" }} 
                  min={0} />
                <Body baseFontSize={9} style={{ width: "10%" }}>${Monthly_Inhand_Salary.toFixed(0)}</Body>
              </div>

              <div className={styles.profileItem}>
                <Body style={{ width: "20%" }}><strong>Num of Delayed Payments:&nbsp;</strong></Body>
                <Slider max={50} onChange={(event) => handleSliderChange(event, 'numDelayedPayments')}
                  styles={defaultSliderStyle}
                  defaultValue={Num_of_Delayed_Payment} style={{ width: "55%" }} 
                  min={0} />
                <Body baseFontSize={9} style={{ width: "10%" }}>{Num_of_Delayed_Payment}</Body>
              </div>

              <div className={styles.profileItem}>
                <Body style={{ width: "25%" }}><strong>Credit Mix:&nbsp;</strong></Body>
                <Body baseFontSize={9} style={{ width: "70%" }}><h3>{Credit_Mix}</h3></Body>
              </div>

              <div className={styles.profileItem}>
                <Body style={{ width: "25%" }}><strong>Type of Loan:&nbsp;</strong></Body>
                <Body baseFontSize={9} style={{ width: "70%" }}><h3>{Type_of_Loan.replaceAll(",", ", ")}</h3></Body>
              </div>

              <div className={styles.profileItem}>
                <Body style={{ width: "25%" }}><strong>Payment Behaviour:&nbsp;</strong></Body>
                <Body baseFontSize={9} style={{ width: "70%" }}><h3>{Payment_Behaviour.replaceAll('_', " ")}</h3></Body>
              </div>

              <br/>
              <div className={styles.profileItem}>
                <Button style={{
                  width: "80%",
                }} onClick={handleSubmit}> Save Profile </Button>
              </div>

            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
