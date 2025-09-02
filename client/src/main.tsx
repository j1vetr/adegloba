import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('🚀 Service Worker registered successfully:', registration.scope);
      
      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('📱 New content available, will refresh...');
              // Auto-refresh when new content is available
              window.location.reload();
            }
          });
        }
      });
      
    } catch (error) {
      console.error('🚨 Service Worker registration failed:', error);
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
