// pages/login.js

import Login from '../components/Login';
import Head from 'next/head';


const LoginPage = () => {
  return (
    <>
      <Head>
          <title>Credit Scoring</title>
          <link rel="icon" href="/favicon.ico" />
      </Head>
      <Login />
    </>
  );
};

export default LoginPage;
