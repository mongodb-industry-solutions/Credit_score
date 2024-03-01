// pages/index.js
import React, { useEffect, useState, useRef } from 'react';
import Layout from '../components/Layout';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Popup from '../components/Popup';
import TabsComponent from '../components/Tabs';
import { ShrinkContext, useShrinkContext } from  '../context/AppContext';

const HomePage = () => {
  const [isPopupOpen, setPopupOpen] = useState(false);
  const { isShrunk, setIsShrunk } = useShrinkContext();

  const fetchData = async () => {
    try {
      const response = await fetch(process.env.MONGODB_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "Access-Control-Request-Headers": "*",
          "api-key": process.env.MONGODB_API_KEY,
        },
        body: JSON.stringify({
          "collection":"credit_history",
          "database":"bfsi-genai",
          "dataSource":"IST-Shared",
          "filter": {"Unnamed: 0" : 3 }
      }),
      });

      const data = await response.json();
      console.log('data');
      setApiData(data);
    } catch (error) {
      console.error('Error fetching API data:', error);
    }
  };

  const profileInfo = {
    name: 'Eddie Grant',
    email: 'eddie.grant@example.com',
    avatar: 'images/userAvatar.png',
  };

  const textSet1 = 'In the digital labyrinth of innovation, industries grapple with the conundrum of transformation. RegData emerges as the guiding beacon, weaving a multi-cloud and multi-entity tapestry on the robust canvas of MongoDB. This symphony delivers end-to-end protection, a fortress in the realm of data security. As we embark on a whitepaper odyssey, the enigma of QE unfurls. Security warriors at RegData yearn to decipher its algorithmic secrets. Enter Kenneth, the sage of encryption, the oracle of security algorithms. A clandestine meeting is summoned, where bits and bytes will dance to the rhythm of his wisdom. Next week, the curtain rises on the RegData spectacle. Will you heed the call, Kenneth, and unravel the encryption ballet?';

  const textSet2 = "Hope life's treating you well. We're diving into the tech cosmos with RegData's whitepaper project, exploring their multi-cloud, multi-entity marvel hooked up with MongoDB. This digital fortress promises end-to-end protection, and the intrigue deepens when QE algorithms step into the limelight. RegData's security aficionados are eager to pick your brain on this ciphered dance. Picture this – a virtual rendezvous next week where RegData unveils their tool. Your insight could be the missing piece to decode the symphony of security. Are you up for the rendezvous?";
  
  useEffect(() => {
    console.log('isShrunk has changed:', isShrunk);
  }, [isShrunk]);


  return (
    <div>
      {isPopupOpen && <div className="header-backdrop" />}
      {isPopupOpen && <div className="sidebar-backdrop" />}
      <Header />
      <Sidebar profileInfo={profileInfo} />
      <Layout isShrunk={isShrunk} >
        <div>
          <h1>Credit card Submition form</h1>
          <TabsComponent textSet1={textSet1} textSet2={textSet2} />
        </div>
      </Layout>
      {/* <FloatingButton onClick={handleAddButtonClick} /> */}
    </div>
  );
};

export default HomePage;
