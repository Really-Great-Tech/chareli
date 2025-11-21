import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Component to dynamically update the canonical tag based on the current route
 * This prevents duplicate content issues by specifying the preferred URL for each page
 */
const CanonicalTag = () => {
  const location = useLocation();
  const baseUrl = 'https://www.arcadesbox.com';

  useEffect(() => {
    // Get the current path without query parameters or hash
    const cleanPath = location.pathname;
    const canonicalUrl = `${baseUrl}${cleanPath}`;

    // Check if canonical link already exists
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    
    if (canonicalLink) {
      // Update existing canonical link
      canonicalLink.setAttribute('href', canonicalUrl);
    } else {
      // Create new canonical link if it doesn't exist
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      canonicalLink.setAttribute('href', canonicalUrl);
      document.head.appendChild(canonicalLink);
    }

    // Cleanup function (optional)
    return () => {
      // We keep the canonical tag, just update it on route change
    };
  }, [location.pathname]);

  return null; // This component doesn't render anything
};

export default CanonicalTag;
