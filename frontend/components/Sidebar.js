import React, { useState } from 'react';
import styles from '../styles/sidebar.module.css';
import { H3, Body, Subtitle } from '@leafygreen-ui/typography';
import Button from '@leafygreen-ui/button';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import Image from 'next/image';
import { useRouter } from 'next/router';
import axios from 'axios';

const Sidebar = ({ profileInfo }) => {
  const router = useRouter();

  // Combined state for all profile data
  const [profileData, setProfileData] = useState({ ...profileInfo });
  const [isSaving, setIsSaving] = useState(false); // To manage save button state

  // Handle slider updates
  const handleSliderChange = (value, field) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      let clientId = localStorage.getItem('clientId') || router.query.clientid;
      if (!clientId) {
        console.error('Client ID is missing');
        alert('Client ID is required. Please log in again.');
        return;
      }
      // Clone profileData and remove _id
      const { _id, ...updateData } = profileData;
      const apiUrl = '/api/updateOne';
      const body = {
        filter: { Customer_ID: parseInt(clientId, 10) },
        update: { $set: updateData },
      };
      console.log('Submitting updated profile:', body);
      const response = await axios.post(apiUrl, body, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.status === 200) {
        console.log('Profile updated successfully:', response.data);
        window.location.reload();
      } else {
        console.error('Failed to update profile:', response.data);
        alert('Failed to save profile. Please try again.');
      }
    } catch (error) {
      console.error('An error occurred while saving:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div className={styles.sidebar}>
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'flex-start', marginBottom: '10%' }}>
          <Image className={styles.profileImage} src={'/images/userAvatar.png'} alt="Profile" width={60} height={60} />
          {profileData && (
            <div style={{ marginTop: '10%', marginLeft: '5%' }}>
              <H3>{profileData.Name}</H3>
              <Body>Occupation: {profileData.Occupation}</Body>
              <Body>Age: {profileData.Age} years</Body>
              <Body>Customer ID: {profileData.Customer_ID}</Body>
            </div>
          )}
        </div>
        <div className={styles.profileDetails}>
          {profileData && (
            <>
              {/* Sliders for updating values */}
              <SliderItem
                label="Monthly Rentals"
                field="Monthly_Rental_Commitment"
                value={profileData.Monthly_Rental_Commitment}
                max={profileData.Annual_Income / 12}
                handleSliderChange={handleSliderChange}
              />
              <SliderItem
                label="Outstanding Debt"
                field="Outstanding_Debt"
                value={profileData.Outstanding_Debt}
                max={10000}
                handleSliderChange={handleSliderChange}
              />
              <SliderItem
                label="Num Credit Card"
                field="Num_Credit_Card"
                value={profileData.Num_Credit_Card}
                max={10}
                handleSliderChange={handleSliderChange}
                showDollar={false}  // Indicate no dollar sign
              />
              <SliderItem
                label="Num Bank Accounts"
                field="Num_Bank_Accounts"
                value={profileData.Num_Bank_Accounts}
                max={10}
                handleSliderChange={handleSliderChange}
                showDollar={false}  // Indicate no dollar sign
              />
              <SliderItem
                label="Total EMI per month"
                field="Total_EMI_per_month"
                value={profileData.Total_EMI_per_month}
                max={profileData.Annual_Income / 12}
                handleSliderChange={handleSliderChange}
              />
              <SliderItem
                label="Monthly Inhand Salary"
                field="Monthly_Inhand_Salary"
                value={profileData.Monthly_Inhand_Salary}
                max={15000}
                handleSliderChange={handleSliderChange}
              />
              <SliderItem
                label="Num of Delayed Payments"
                field="Num_of_Delayed_Payment"
                value={profileData.Num_of_Delayed_Payment}
                max={50}
                handleSliderChange={handleSliderChange}
                showDollar={false}  // Indicate no dollar sign
              />
              <div className={styles.profileItem}>
                <Body style={{ width: '25%' }}>
                  <strong>Credit Mix:</strong>
                </Body>
                <Body baseFontSize={9} style={{ width: '65%' }}>
                  <h3>{profileData.Credit_Mix}</h3>
                </Body>
              </div>
              <div className={styles.profileItem}>
                <Body style={{ width: '25%' }}>
                  <strong>Type of Loan:</strong>
                </Body>
                <Body baseFontSize={9} style={{ width: '65%' }}>
                  <h3>{profileData.Type_of_Loan.replaceAll(',', ', ')}</h3>
                </Body>
              </div>
              <div className={styles.profileItem}>
                <Body style={{ width: '25%' }}>
                  <strong>Payment Behaviour:</strong>
                </Body>
                <Body baseFontSize={9} style={{ width: '65%' }}>
                  <h3>{profileData.Payment_Behaviour.replaceAll('_', ' ')}</h3>
                </Body>
              </div>
              <br />
              <div className={styles.profileItem}>
                <Button variant="primary" onClick={handleSubmit} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Custom slider component
const SliderItem = ({ label, field, value, max, handleSliderChange, showDollar = true }) => (
  <div className={styles.profileItem}>
    <Body style={{ width: '30%' }}>
      <strong>{label}:&nbsp;</strong>
    </Body>
    <Slider
      value={value}
      onChange={(val) => handleSliderChange(val, field)}
      max={max}
      min={0}
      style={{ width: '40%' }}
      trackStyle={{ backgroundColor: 'green' }}
      handleStyle={{ borderColor: 'white', backgroundColor: 'black' }}
    />
    <Body baseFontSize={9} style={{ width: '10%' }}>
      {showDollar ? `$${value ? value.toFixed(0) : 0}` : value.toFixed(0)}
    </Body>
  </div>
);

export default Sidebar;
