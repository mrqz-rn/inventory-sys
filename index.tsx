// src/main.tsx (or index.tsx)
// Add the service worker registration here

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// import './index.css';
import { registerServiceWorker } from './utils/registerSW';

// Register the service worker for offline support
registerServiceWorker();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);