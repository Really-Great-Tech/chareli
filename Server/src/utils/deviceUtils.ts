
export function detectDeviceType(userAgent: string): string {
  if (!userAgent) return 'unknown';
  
  const ua = userAgent.toLowerCase();
  
  if (
    ua.includes('ipad') || 
    ua.includes('tablet') || 
    (ua.includes('android') && !ua.includes('mobi'))
  ) {
    return 'tablet';
  }
  
  // Check for mobile devices
  if (
    ua.includes('mobi') || 
    ua.includes('android') ||
    ua.includes('iphone') ||
    ua.includes('ipod') ||
    ua.includes('blackberry') ||
    ua.includes('windows phone')
  ) {
    return 'mobile';
  }
  
  // Default to desktop
  return 'desktop';
}
