import React from 'react';
import ReactDOM from 'react-dom/client'; // Modern React 18+ import
import App from './App';
import { initDB } from './db/db';

// 2. Initialize database before rendering
initDB()
  .then(() => {
    // 3. Create root and render
    const root = ReactDOM.createRoot(
      document.getElementById('root') as HTMLElement
    );
    
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  })
  .catch((error) => {
    console.error('Database initialization failed:', error);
    // 4. Fallback UI for errors
    const errorRoot = document.getElementById('root');
    if (errorRoot) {
      errorRoot.innerHTML = `
        <div style="padding: 20px; color: red;">
          <h1>Application Error</h1>
          <p>Failed to initialize database</p>
          <button onclick="window.location.reload()">Retry</button>
        </div>
      `;
    }
  });