// Must come first: it installs the core-js built-ins that Samsung TV browsers
// predate. Babel rewrites new *syntax* for old engines by itself, but missing
// *methods* only exist if this polyfill entry is imported before anything else.
// See tests/README.md for the supported TV floor.
import 'react-app-polyfill/stable';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
