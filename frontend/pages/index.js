// pages/index.js
import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { H3, Body }  from '@leafygreen-ui/typography';
import TextWithImage from '../components/TextWithImage';
import { Tabs, Tab } from '@leafygreen-ui/tabs';


const HomePage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true); 
  const [selected, setSelected] = useState(0)


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

      if (!jsonData || Object.keys(jsonData).length === 0) {
        window.location.href = '/login';
        return;
      }

      setData(jsonData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching API data:', error);
      setLoading(false);
    }
  };

  const textSet1 = 'In the whimsical land of polka-dotted clouds, jellybean raindrops tap-danced on rainbow sidewalks while sentient marshmallows serenaded glittery moonbeams with kazoo symphonies. Unicorns rode unicycles made of spaghetti, juggling watermelons and reciting Shakespearean limericks in dolphin language.\n\
  Meanwhile, a flock of invisible penguins engaged in a heated debate about the proper way to microwave ice cream. The sun, wearing a top hat and monocle, played hopscotch with a group of talking pineapples sporting tutus. Galactic rubber ducks navigated through the cosmic sea of bubblegum, leaving trails of stardust behind.\n  The language of choice among the locals was a fusion of hiccupping hickeys and burp-infused haikus, creating a harmonious cacophony that echoed through the cotton candy canyons. Flying saucers driven by disco-dancing robots zipped through the sky, leaving trails of glitter and confetti in their wake. \nSuddenly, a parade of upside-down giraffes on roller skates emerged, handing out upside-down pineapples to confused bystanders. The time-traveling walrus mayor declared the day a national holiday in honor of mismatched socks, and everyone celebrated by juggling flaming marshmallows while riding unicycles on a tightrope made of spaghetti. \nAnd so, in this nonsensical realm of fantastical absurdity, logic took a vacation, and the inhabitants reveled in the delightful chaos of their wonderfully senseless existence.';
  
  const textSet1WithIframe = (
    <div>
      <Body baseFontSize={16}>{textSet1}</Body>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '20px' }}>
        <iframe
          style={{ background: '#FFFFFF', border: 'none', borderRadius: '2px', boxShadow: '0 2px 10px 0 rgba(70, 76, 79, .2)' }}
          width="400"
          height="200"
          src="https://charts.mongodb.com/charts-jeffn-zsdtj/embed/charts?id=65e6fd50-620b-4479-85ad-0076a175a160&maxDataAge=3600&theme=light&autoRefresh=true"
        />
      </div>
    </div>
  );

  const lines = textSet1.split('\n');


  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          Loading...
        </div>
      ) : (
        <><div style={{ flex: 1 }}>
            <Header />
            <Layout sidebar={<Sidebar profileInfo={data} />}
              mainContent={
                <div style={{ margin: '3%', marginTop: '30px' }}>
                  <H3 style={{ display: 'inline' }}>Credit card application status : </H3>
                  <div style={{ display: 'inline-block', borderRadius: '25px', background: '#FFCDC7',  padding: '3px' }}>
                  <H3 style={{ color: '#970606', display: 'inline', marginBottom: '50px' }}>&nbsp;REJECTED&nbsp;</H3>
                </div>
                  <Tabs setSelected={setSelected} selected={selected}>
                    <Tab name="Rejection explaination">{textSet1WithIframe}</Tab>
                    <Tab name="Product offerings">{<TextWithImage items={lines} />}</Tab>
                  </Tabs>
                </div>
              }
            />
          </div></>
      )}
    </div>
  );
};

export default HomePage;
