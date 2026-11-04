import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/fredoka';
import '@fontsource-variable/nunito';
import { App } from './App';
// The subjects share the existing card, mascot, quiz and result styles.
import '../../english/src/styles/app.css';
import './styles/app.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>,
);
