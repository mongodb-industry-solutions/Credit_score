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
  const [loadingSecondTab, setLoadingSecondTab] = useState(true); 
  const [selected, setSelected] = useState(0)
  const [explSets, setExplSets] = useState({"userProfile":""})
  const [recSets, setRecSets] = useState({"product_suggestions":null})


  useEffect(() => {
    if (typeof window !== 'undefined') {
      const clientId = localStorage.getItem('clientId');
      if (!clientId) {
        window.location.href = '/login';
        return;
      }
      fetchProfileData( parseInt(clientId, 10));
      fetchExpl( parseInt(clientId, 10));
    }
    
  }, []);

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
          filter: { "Unnamed: 0": clientId},
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch data. Status: ${response.status}`);
      }

      const jsonData = await response.json();

      if (!jsonData || Object.keys(jsonData).length === 0) {
        window.location.href = '/login';
        return;
      }
      //setLoading(false); //to be removed
      setData(jsonData);
      
      
    } catch (error) {
      console.error('Error fetching API data:', error);
    }
  };


  const fetchExpl = async (clientId) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      const response = await fetch(`${apiUrl}/credit_score?userId=${clientId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        } });

      const text = await response.json();
      setExplSets(text);
      setLoading(false);

    } catch (error) {
      console.error('Error fetching API response:', error);
      setLoading(false);
    }
  };

  const fetchRec = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      const response = await fetch(`${apiUrl}/product_suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        } ,
        body: JSON.stringify(explSets)
      });

      const text = await response.json();
      setRecSets(text);
      setLoadingSecondTab(false);

    } catch (error) {
      console.error('Error fetching API response:', error);
      setLoadingSecondTab(false);
    }
  };
  /*
  const textSet =  textSets ? textSets : {'explaination': 'Connexion error: please refresh the page\n1. toto\n  2. tata\n  3. tete\n ','product': {
    "No Connexion": " No Credit Card Recommended please refresh the page."
  } };

  /*
  const textSet =  textSets ? textSets : {'explaination': "1. Your credit request was rejected based on a combination of factors that the bank considers when evaluating credit card applications. \n   \n2. One of the key factors that influenced the decision is your low number of open credit lines and loans, which indicates limited credit history and experience managing credit accounts.\n\n3. Additionally, your debt ratio, which is the ratio of your monthly debt payments to your gross monthly income, is relatively high. This suggests that a significant portion of your income is already allocated towards debt obligations, raising concerns about your ability to manage additional credit responsibly.\n\n4. While your monthly income is relatively high, other factors such as your age and lack of dependents may have also played a role in the decision.\n\n5. It's important to note that the bank uses a predictive model to assess creditworthiness, and based on the model's analysis of your profile, the likelihood of experiencing delinquency in the next 2 years is relatively low.\n\n6. Overall, the combination of these factors led to the rejection of your credit card application. If you have any further questions or would like more information, please feel free to reach out to us. "
  ,'product': {

    "diners club miles card": 
    "1. Complimentary lounge access worldwide.\n2. Concierge service for travel needs.\n3. Earn reward points for flights and hotels.\n4. Comprehensive insurance coverage.\n5. Low annual fee and renewal fee.\n6. Cash advance fee and interest rate details.",

    "diners club premium card": 
    "1. Welcome benefits and renewal benefits of 2,500 reward points each.\n2. Up to 6 complimentary lounge accesses worldwide.\n3. Redemption options for flights and hotels.\n4. 24x7 concierge service.\n5. Low mark-up on foreign currency transactions.\n6. Comprehensive insurance coverage.",

    "diners club rewardz card": 
    "1. Earn reward points for spends.\n2. Cashback on SmartBuy purchases.\n3. Travel benefits for flights and hotels.\n4. Concierge service.\n5. Savings on foreign currency transactions.\n6. Low annual fee and renewal fee.",

    "freedom card card": 
    "1. Earn reward points on spends.\n2. Redeem points for cash back or products.\n3. Fuel surcharge waiver.\n4. EMV Chip technology for security.\n5. Interest-free credit period.\n6. Annual fee waiver on meeting spending criteria.",

    "moneyback plus card": 
    "1. Earn CashPoints on various categories.\n2. Gift voucher benefits.\n3. Interest-free credit period.\n4. Revolving credit.\n5. Exclusive dining privileges.\n6. Fuel surcharge waiver.",

    "paytm tengen bank credit card card": 
    "1. Cashback on Paytm and retail spends.\n2. Exclusions for cashback eligibility.\n3. Interest-free credit period.\n4. Utility bill payments through SmartPay.\n5. Contactless payment capabilities.\n6. Fee waiver on meeting spending criteria.",

  }
  };
  */

  const textSet1WithIframe = (
    <div>
      <Body baseFontSize={16}  as="pre" style={{ wordWrap: 'break-word', overflowX: 'hidden', whiteSpace: 'pre-line', overflowX: 'hidden', fontSize: '19px', fontFamily: 'sans-serif',  }} >
        {explSets["userProfile"]}
      </Body>

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


  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',fontSize: '19px', fontFamily: 'sans-serif' }}>
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
                  <Tabs setSelected={setSelected} selected={selected} baseFontSize={16}>
                    <Tab name="Rejection explaination">{textSet1WithIframe}</Tab>
                    <Tab disabled={loadingSecondTab} name="Product offerings">
                      <TextWithImage items={recSets["productRecommendations"]} />
                    </Tab>
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
