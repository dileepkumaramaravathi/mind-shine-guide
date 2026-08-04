import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const originalFetch = window.fetch;

window.fetch = async function (input, init) {
  let url = typeof input === 'string' ? input : input.url;
  
  if (url.startsWith('/api/')) {
    const isMobileApp = window.location.protocol.startsWith('capacitor') || 
                        window.location.protocol.startsWith('file') ||
                        (window.location.protocol.startsWith('http') && !window.location.hostname.includes('vercel.app'));
    
    if (isMobileApp) {
      const liveBase = 'https://mind-shine-guide-hi6v.vercel.app';
      url = `${liveBase}${url}`;
      
      if (typeof input !== 'string') {
        input = new Request(url, input);
      } else {
        input = url;
      }
    }
  }

  return originalFetch(input, init);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
