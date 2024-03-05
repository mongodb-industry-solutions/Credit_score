import React, { useState } from 'react';
import { PasswordInput } from '@leafygreen-ui/password-input';
import TextInput from '@leafygreen-ui/text-input';
import { H2 } from '@leafygreen-ui/typography';
import { MongoDBLogoMark } from '@leafygreen-ui/logo';

const LoginPage = () => {
  const [clientId, setClientId] = useState('');
  const [password, setPassword] = useState('');

  const handleClientIdChange = (event) => {
    setClientId(event.target.value);
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  const handleLogin = () => {
    if (clientId.trim() === '' || password.trim() === '') {
      alert('Please enter both Client ID and Password');
    } else {
      // Store clientId in localStorage
      localStorage.setItem('clientId', clientId);

      // Redirect to the homepage
      window.location.href = '/';
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        <form style={styles.form}>
          <MongoDBLogoMark />
          <H2>Credit Scoring</H2>
          <TextInput
            label="Client ID"
            placeholder="121"
            onChange={handleClientIdChange}
            value={clientId}
            style={styles.input}
          />
          <PasswordInput
            label="Enter Password"
            stateNotifications={[
              {
                notification: "i'm waiting",
                state: 'none',
              },
            ]}
            autoComplete="new-password"
            id="new-password"
            onChange={handlePasswordChange}
            value={password}
            style={styles.input}
          />
          <button
            type="button"
            onClick={handleLogin}
            className="leafygreen-ui-1m13q2j"
            aria-disabled="false"
          >
            <div className="leafygreen-ui-1igr8p9">Login</div>
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
  },
  loginBox: {
    padding: '20px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  input: {
    width: '150px',
    textAlign: 'left',
    margin: 'auto',
  },
};

export default LoginPage;
