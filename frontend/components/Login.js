import React, { useState } from 'react';
import { PasswordInput } from '@leafygreen-ui/password-input';
import TextInput from '@leafygreen-ui/text-input';
import { H2 } from '@leafygreen-ui/typography';
import { MongoDBLogoMark } from '@leafygreen-ui/logo';
import Button from '@leafygreen-ui/button';
import axios from 'axios';
import Head from 'next/head';

const LoginPage = () => {
  const [clientId, setClientId] = useState('');
  const [password, setPassword] = useState('');

  const handleClientIdChange = (event) => {
    setClientId(event.target.value);
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    if (clientId.trim() === '' || password.trim() === '') {
      alert('Please enter both Client ID and Password');
    } else {
      try {
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/login`;
        const response = await axios.post(apiUrl, {
          userId: clientId,
          password: password
        }, {
          headers: {
            'Content-Type': 'application/json'
          },
          withCredentials: true, // In case your backend needs to handle sessions or cookies
        });

        console.log(response.data);
        localStorage.setItem('clientId', clientId);
        window.location.href = '/'; // Redirect after successful login
      } catch (error) {
        console.error('Login failed:', error);
        alert('Login failed: ' + (error.response?.data?.detail || 'Please try again.'));
      }
    }
  };

  const styles = {
    container: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
    },
    loginBox: {
      background: '#FFFFFF',
      border: '10px',
      borderRadius: '10px',
      boxShadow: '0 2px 10px 0 rgba(70, 76, 79, .2)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '50px',
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    },
    input: { textAlign: 'left', width: '200px' },
    button: { margin: '10px' },
  };

  return (
    <>
      <Head>
        <title>Credit Scoring</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div style={styles.container}>
        <div style={styles.loginBox}>
          <form style={styles.form} onSubmit={handleLogin}>
            <MongoDBLogoMark />
            <H2 style={styles.button}>Credit Scoring</H2>
            <TextInput
              label="Client ID"
              placeholder="8625"
              onChange={handleClientIdChange}
              value={clientId}
              style={{ position: 'relative', top: '0px', left: '-10px', width: '180px', boxSizing: 'border-box', padding: '5px', }}
            />
            <PasswordInput
              label="Enter Password"
              id="new-password"
              onChange={handlePasswordChange}
              value={password}
              style={{ position: 'relative', top: '0px', left: '14px', width: '180px' }}
            />
            <Button size={'default'} type="submit" style={{ marginTop: '10px' }}>Login</Button>
          </form>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
