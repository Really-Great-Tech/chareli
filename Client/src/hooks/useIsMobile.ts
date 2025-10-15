import { useState, useEffect } from 'react';

/**
 * Hook to detect if the device is mobile based on screen width and user agent
 * @param breakpoint - Optional breakpoint in pixels (default: 768px)
 * @returns boolean indicating if device is mobile
 */
export function useIsMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < breakpoint;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkIsMobile = () => {
      const isSmallScreen = window.innerWidth < breakpoint;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsMobile(isSmallScreen && isTouchDevice);
    };

    // Check on mount
    checkIsMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkIsMobile);
    window.addEventListener('orientationchange', checkIsMobile);

    return () => {
      window.removeEventListener('resize', checkIsMobile);
      window.removeEventListener('orientationchange', checkIsMobile);
    };
  }, [breakpoint]);

  return isMobile;
}
