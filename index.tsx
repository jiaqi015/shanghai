
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // 标准 Tailwind 导入
import App from './App';

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
