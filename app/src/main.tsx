import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const originalFetch = window.fetch;

// Prepend the production Vercel server URL to all local API requests on Mobile
window.fetch = async function (input, init) {
  let urlStr = typeof input === 'string' ? input : (input as any).url || (input as any).href || '';
  
  if (urlStr.startsWith('/api/')) {
    const liveBase = 'https://mind-shine-guide-hi6v.vercel.app';
    const newUrl = `${liveBase}${urlStr}`;
    
    if (typeof input === 'string') {
      input = newUrl;
    } else {
      input = new Request(newUrl, input as any);
    }
  }

  return originalFetch(input, init);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
