
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // 必须放在最前面，确保 Tailwind 覆盖默认样式
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Fatal Error: Root element '#root' not found in DOM.");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
