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

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="light">
      <Notifications position="top-right" />
      <App />
    </MantineProvider>
  </React.StrictMode>
);
