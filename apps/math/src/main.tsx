import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/fredoka';
import '@fontsource-variable/nunito';
import './styles/app.css';
import { App } from './App';

const host = document.getElementById('root');
if (!host) throw new Error('Missing #root');

createRoot(host).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
