import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';

// Mantine core + notifications styles (must come before app styles so our
// overrides win the cascade).
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';

import App from './App';
import { theme } from './theme';
import './App.modules.css';

// Ensure cookies (sessions) are sent with all axios requests
axios.defaults.withCredentials = true;

// Session-expiry watchdog: every 401 from a protected endpoint (anything
// except /auth/*, where 401 is the normal logged-out answer) flips the app
// back to the login gate via a window event that App.jsx listens for.
// Flag in sessionStorage so LoginGate can tell the user WHY they were
// bounced instead of showing the gate silently.
axios.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    const url = err?.config?.url || "";
    if (status === 401 && !url.includes("/auth/")) {
      sessionStorage.setItem("numistag-session-expired", "1");
      window.dispatchEvent(new Event("numistag:auth-expired"));
    }
    return Promise.reject(err);
  }
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="light">
      <Notifications position="top-right" />
      <App />
    </MantineProvider>
  </React.StrictMode>
);
