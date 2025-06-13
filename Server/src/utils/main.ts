import config from '../config/config';

export const formatTime = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  let result = '';
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0) result += `${minutes}m `;
  if (remainingSeconds > 0) result += `${remainingSeconds}s`;

  return result.trim();
};

/**
 * Get frontend URL based on environment
 */
export const getFrontendUrl = (): string => {
  switch (config.env) {
    case 'development':
      return 'https://dev.chareli.reallygreattech.com';
    case 'staging':
      return 'https://staging.chareli.reallygreattech.com';
    case 'production':
      return ''; // Production URL not ready yet
    default:
      return 'https://dev.chareli.reallygreattech.com'; // Default fallback
  }
};
