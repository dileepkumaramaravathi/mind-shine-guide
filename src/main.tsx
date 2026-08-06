import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const originalFetch = window.fetch;

window.fetch = async function (input, init) {
  let url = typeof input === 'string' ? input : input.url;
  
  if (url.startsWith('/api/')) {
    const isLocalhost = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1';
    const isVercel = window.location.hostname.includes('vercel.app') ||
                     window.location.hostname.includes('mind-shine-guide');
    const isMobileApp = window.location.protocol.startsWith('capacitor') || 
                        window.location.protocol.startsWith('file');
    
    // Only redirect to Vercel if running inside Capacitor mobile app
    if (isMobileApp && !isLocalhost && !isVercel) {
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
