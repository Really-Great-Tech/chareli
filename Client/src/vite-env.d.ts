/// <reference types="vite/client" />

// Cloudflare Zaraz Analytics type declarations
interface Window {
  shouldLoadAnalytics?: boolean;
  zaraz?: {
    track: (eventName: string, eventData?: Record<string, any>) => void;
    set: (key: string, value: any) => void;
    ecommerce: (action: string, data: Record<string, any>) => void;
  };
  // Facebook Pixel type declarations
  fbq: (
    command: 'init' | 'track' | 'trackCustom',
    eventName: string,
    parameters?: Record<string, any>
  ) => void;
  _fbq: any;
}
