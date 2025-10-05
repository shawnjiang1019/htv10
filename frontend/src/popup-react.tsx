//import React from 'react';
import { createRoot } from 'react-dom/client';
import PopupApp from './PopupApp';
import './popup-styles.css';

console.log('YouTube Transcript AI: Popup loaded');

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('root');
  
  if (!container) {
    console.error('Root container not found');
    return;
  }

  console.log('Rendering PopupApp...');
  
  // Create React root and render the app
  const root = createRoot(container);
  root.render(<PopupApp />);
});
