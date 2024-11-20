// pages/index.js
import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { H1, H2, H3, Body } from '@leafygreen-ui/typography';
import TextWithImage from '../components/TextWithImage';
import { Tabs, Tab } from '@leafygreen-ui/tabs';
import ExpandableCard from '@leafygreen-ui/expandable-card';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Markdown from 'react-markdown';


const HomePage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loading2, setLoading2] = useState(true);
  const [SecondTab, setSecondTab] = useState(true);
  const [selected, setSelected] = useState(0)
  const [explSets, setExplSets] = useState({ "userProfile": "" })
  const [recSets, setRecSets] = useState({ "product_suggestions": null })
  const [error, setError] = useState(false)
  const [health, setHealth] = useState(null)
  const [scorecardScoreFeatures, setScorecardScoreFeatures] = useState({ "Repayment History": 0, "Credit Utilization": 0, "Credit History": 0, "Outstanding": 0, "Num Credit Inquiries": 0, "Credit Score": 0})
  const [scoreCardCreditScore, setScoreCardCreditScore] = useState(0)
  const labels = ["Repayment History", "Credit Utilization", "Credit History", "Outstanding", "Num Credit Inquiries", "Credit Score"];
  const router = useRouter();

  useEffect(() => {
    if (router.isReady) {
      let clientId = 8625; // Default to 8625
      localStorage.setItem('login', clientId);
      console.log('clientId', clientId);
      fetchProfileData(clientId);
      fetchExpl(clientId);
    }
  }, [router.isReady]);

  useEffect(() => {
    if (explSets["userProfile"]) {
      fetchRec();
    }
  }, [explSets]);

  const fetchProfileData = async (clientId) => {
    try {
      const response = await fetch('/api/findOne', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filter: { "Customer_ID": clientId },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch data. Status: ${response.status}`);
      }

      const jsonData = await response.json();

      console.log('condition', !jsonData || Object.keys(jsonData).length === 0  || clientId === NaN)
      if (!jsonData || Object.keys(jsonData).length === 0 || clientId === NaN) {
        console.log('redirecting to login');
        window.location.href = '/login';
        return;
      }
      setLoading(false);
      setData(jsonData);

    } catch (error) {
      console.error('Error fetching API data:', error);
      setLoading(false);
    }
  };


  const fetchExpl = async (clientId) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/credit_score/${clientId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const text = await response.json();
      setExplSets(text);
      setLoading2(false);
      console.log('text', text);
      setHealth(text.userCreditProfile);
      setScorecardScoreFeatures(text.scorecardScoreFeatures)
      setScoreCardCreditScore(text.scoreCardCreditScore)
      console.log('scorecardScoreFeatures', text.scorecardScoreFeatures)
      // if (text["approvalStatus"] == "Approved" ) {
      //   await setStatus(true);
      // } else {
      //   await setStatus(false);
      // }

      // poor -- red 
      // standard -- yellow
      // good -- green


    } catch (error) {
      setLoading2(false);
      console.error('Error fetching API response:', error);
    }
  };

  const fetchRec = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/product_suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(explSets)
      });
      const text = await response.json();
      setRecSets(text["productRecommendations"]);
      setSecondTab(false);

    } catch (error) {
      console.error('Error fetching API response:', error);
      setSecondTab(false);
    }
  };
  /*
  const textSet =  textSets ? textSets : {'explaination': 'Connexion error: please refresh the page\n1. toto\n  2. tata\n  3. tete\n ','product': {
    "No Connexion": " No Credit Card Recommended please refresh the page."
  } };

  /*
        <Image
            src={key === "No Connexion" ? '/images/Error.png' : '/images/creditCard.png'}
            alt="Description"
            style={{ marginRight: '10px', maxWidth: '200px', borderRadius: '10px' }}
          />
  */


  let markdownText = `This demo illustrates how Machine Learning (ML) and Generative AI can enhance a credit card application process using MongoDB Atlas Vector Search with LLM.
  
  **Credit card application demo:**
  Status Explanation: The “Status explanation” tab uses Generative AI to explain why the Credit Health status is categorized as Good/Approved or Bad/Rejected. This helps borrowers understand and improve their credit profile, especially if they are rejected.  
  Product Recommendation: The “Product recommendations” tab, powered by Generative AI, suggests alternative credit card products tailored to the credit profile. This feature assists rejected applicants with alternative options and provides cross-sell opportunities for approved customers.
  
  **User Navigation:** 
  Credit Profile: Users can adjust and save their credit profile (on the left panel). Once saved, the profile is then evaluated by two credit scoring models: an ML-based model (Credit Health Status) and a simple linear regression model (Credit Score). Details of these models are available in the solution library documentation.
  `;

  const textSet1WithIframe = (
    <div>
      {error ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'left' }}>
          <Image
            src={'/images/Error.png'}
            alt="Description"
            style={{ marginRight: '10px', maxWidth: '40px', borderRadius: '10px', marginTop: '10px' }}
          />
          <Body baseFontSize={16} as="pre" style={{ marginTop: '15px', fontSize: '19px', fontFamily: 'sans-serif' }}>
            Connexion error please refresh the page
          </Body>
        </div>
      ) : (
        <div></div>
      )}
      <Body baseFontSize={16} as="pre" style={{ wordWrap: 'break-word', overflowX: 'hidden', whiteSpace: 'pre-line', overflowX: 'hidden', fontSize: '19px', fontFamily: 'sans-serif', lineHeight: 2 }} >
        {explSets["userProfile"]}
      </Body>
      {/* <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '20px' }}>
        <iframe
          style={{ background: '#FFFFFF', border: 'none', borderRadius: '8px', boxShadow: '0 2px 10px 0 rgba(70, 76, 79, .2)' }}
          width="400"
          height="200"
          src={CHART_URL}
        />
      </div> */}

      <H3></H3>
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', marginTop: "40px" }}>
        <H3 style={{ display: 'inline' }}>Traditional Scorecard Based Credit Scoring</H3>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', marginTop: "40px" }}>
        {Array(6).fill().map((_, i) => (
          <React.Fragment key={i}>
            <div
              style={{
                background: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 2px 10px 0 rgba(70, 76, 79, .2)',
                width: '155px', // Adjusted width
                height: '85px', // Adjusted height
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                margin: '10px' // Added margin
              }}
            >
              {i < 5 && <H1>{Math.round(scorecardScoreFeatures[labels[i]] * 100)}</H1>}
              {i == 5 && <H1>{scoreCardCreditScore}</H1>}
              <Body>{labels[i]}</Body>
            </div>
            {i < 4 && <div style={{ margin: '5px' }}>+</div>}
            {i == 4 && <div style={{ margin: '10px' }}>=</div>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );



  return (
    <>
      <Head>
          <title>Credit Scoring</title>
          <link rel="icon" href="/favicon.ico" />
      </Head>  
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {loading || loading2 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '19px', fontFamily: 'sans-serif' }}>
          Loading...
        </div>
      ) : (
        <div style={{ flex: 1 }}>
          <Header />
          <Layout sidebar={<Sidebar profileInfo={data} />}
            mainContent={
              <div style={{ margin: '3%', marginTop: '30px' }}>
                <ExpandableCard
                  title="Instructions"
                  darkMode={false}
                  style={{ margin: '10px 5px', marginTop: '10px' }}
                >
                  
                  <Markdown components={{
                    p: ({node, ...props}) => <p {...props} style={{ margin: 0 }} />,
                    h1: ({node, ...props}) => <h1 {...props} style={{ margin: 0 }} />,
                  }}
                >
                  {markdownText}
                  </Markdown>
                </ExpandableCard>
                <H3 style={{ display: 'inline' }}>Credit Health Status : </H3>
                {health === 'Poor' ? (
                  <div style={{ display: 'inline-block', borderRadius: '25px', background: '#FFCDC7', padding: '3px' }}>
                    <H3 style={{ color: '#970606', display: 'inline', marginBottom: '50px' }}>&nbsp;REJECTED&nbsp;</H3>
                  </div>
                ) : health === 'Standard' ? (
                  <div style={{ display: 'inline-block', borderRadius: '25px', background: '#C0FAE6', padding: '3px' }}>
                    <H3 style={{ color: '#00684A', display: 'inline', marginBottom: '50px' }}>&nbsp;APPROVED&nbsp;</H3>
                  </div>
                ) : (
                  <div style={{ display: 'inline-block', borderRadius: '25px', background: '#C0F9AD', padding: '3px' }}>
                    <H3 style={{ color: '#00684A', display: 'inline', marginBottom: '50px' }}>&nbsp;APPROVED&nbsp;</H3>
                  </div>
                )}
                <Tabs setSelected={setSelected} selected={selected} baseFontSize={16}>
                  <Tab name="Status explanation" style={{ zIndex: 0 }}>{textSet1WithIframe}</Tab>
                  <Tab disabled={SecondTab} name="Product recommendations" style={{ zIndex: 0 }}>
                    <TextWithImage items={recSets} />
                  </Tab>
                </Tabs>
              </div>
            }
          />
        </div>
      )}
    </div>
    </>
  );

};

export default HomePage;
