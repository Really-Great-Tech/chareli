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


export type RoleType = "admin" | "superadmin" | "editor" | "player";
export type AdminRoleType = "admin" | "superadmin";


const validRoles: RoleType[] = ["admin", "superadmin"];

export function isValidRole(role: string): role is RoleType {
  return validRoles.includes(role as RoleType);
}


export function decodeHtmlEntities(text: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}
