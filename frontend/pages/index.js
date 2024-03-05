// pages/index.js
import React, { useEffect, useState, useRef } from 'react';
import Layout from '../components/Layout';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import TabsComponent from '../components/Tabs';
import { H3 }  from '@leafygreen-ui/typography';
import TextWithImage from '../components/TextWithImage';

const HomePage = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const clientId = localStorage.getItem('clientId');
      if (!clientId) {
        window.location.href = '/login';
        return;
      }
      fetchData( parseInt(clientId, 10));
    }
    
  }, []);

  const fetchData = async (clientId) => {
    try {
      const response = await fetch('/api/findOne', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filter: { "Unnamed: 0": clientId},
        }),
      });

      if (!response.ok) {
        console.log('response',response)
        throw new Error(`Failed to fetch data. Status: ${response.status}`);
      }

      const jsonData = await response.json();
      setData(jsonData);
    } catch (error) {
      console.error('Error fetching API data:', error);
    }
  };

  const textSet1 = 'In the digital labyrinth of innovation, industries grapple with the conundrum of transformation. RegData emerges as the guiding beacon, weaving a multi-cloud and multi-entity tapestry on the robust canvas of MongoDB. This symphony delivers end-to-end protection, a fortress in the realm of data security. As we embark on a whitepaper odyssey, the enigma of QE unfurls. Security warriors at RegData yearn to decipher its algorithmic secrets. Enter Kenneth, the sage of encryption, the oracle of security algorithms. A clandestine meeting is summoned, where bits and bytes will dance to the rhythm of his wisdom. Next week, the curtain rises on the RegData spectacle. Will you heed the call, Kenneth, and unravel the encryption ballet?';

  const textSet2 = "Hope life's treating you well. We're diving into the tech cosmos with RegData's whitepaper project, exploring their multi-cloud, multi-entity marvel \n hooked up with MongoDB. This digital fortress promises end-to-end protection, and the intrigue deepens when QE algorithms step into the limelight.\n RegData's security aficionados are eager to pick your brain on this ciphered dance. Picture this – a virtual rendezvous next week where RegData unveils their tool. Your insight could be the missing piece to decode the symphony of security. Are you up for the rendezvous?";
  const lines = textSet2.split('\n');
  //console.log(lines[0]);


  return (
    <div>
      <Header />
      <Layout sidebar={<Sidebar profileInfo={data} />} mainContent={
        <div style={{ marginTop: '25px' }}>
          <H3 style={{ fontSize: '2rem', display: 'inline' }}>Credit card application status : </H3>
          <H3 style={{ fontSize: '2rem',color: 'red', display: 'inline',marginBottom: '30px' }}>REJECTED</H3>
          <TabsComponent textSet1={textSet1} textSet2={<TextWithImage items={lines} />} />
        </div> } >
      </Layout>
    </div>
  );
};

export default HomePage;
