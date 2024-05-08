import React from 'react';
// import { Body, Slider } from 'your-library'; // replace 'your-library' with the actual library you're using
// import styles from './styles'; // replace './styles' with the actual path to your styles
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import styles from '../styles/sidebar.module.css';
import { H3, Body, Subtitle } from '@leafygreen-ui/typography';

function ProfileSlider({ label, value, onChange, param, textValue}) {
  return (
    <div className={styles.profileItem}>
      <Body style={{ width: "20%" }}><strong>{label}&nbsp;</strong></Body>
      <Slider 
        onChange={(event) => onChange(event, param)} 
        styles={{ track:{ backgroundColor: 'green'} , handle: { borderColor: 'white', backgroundColor: 'black', } }}
        defaultValue={value} 
        style={{ width: "55%" }} 
      />
      <Body baseFontSize={9} style={{ width: "10%" }}>{textValue}</Body>
    </div>
  );
}

export default ProfileSlider;