export function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "0 seconds";
  const displayMinutes = Math.floor(seconds / 60);
  const displaySeconds = Math.floor(seconds % 60);
  
  const minuteText = displayMinutes === 1 ? 'minute' : 'minutes';
  const secondText = displaySeconds === 1 ? 'second' : 'seconds';
  
  if (displayMinutes === 0) {
    return `${displaySeconds} ${secondText}`;
  }
  
  return `${displayMinutes} ${minuteText} ${displaySeconds} ${secondText}`;
}
