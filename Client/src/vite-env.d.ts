/// <reference types="vite/client" />

// Google Analytics gtag.js type declarations
interface Window {
  dataLayer: any[];
  gtag: (
    command: 'config' | 'event' | 'js' | 'set',
    targetId: string | Date,
    config?: Record<string, any>
  ) => void;
  // Facebook Pixel type declarations
  fbq: (
    command: 'init' | 'track' | 'trackCustom',
    eventName: string,
    parameters?: Record<string, any>
  ) => void;
  _fbq: any;
}
