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


export type RoleType = "admin" | "superadmin" | "editor" | "player" | "viewer";
export type AdminRoleType = "admin" | "superadmin" | "viewer";


const validRoles: RoleType[] = ["admin", "superadmin", "viewer"];

export function isValidRole(role: string): role is RoleType {
  return validRoles.includes(role as RoleType);
}


export function decodeHtmlEntities(text: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

// User permission utilities
export interface UserWithRole {
  id: string;
  role?: {
    name: string;
  };
}

/**
 * Check if the current user can delete the target user based on role hierarchy
 * @param currentUser - The user performing the action
 * @param targetUser - The user to be deleted
 * @returns boolean - Whether the action is allowed
 */
export function canDeleteUser(currentUser: UserWithRole | null, targetUser: UserWithRole | null): boolean {
  if (!currentUser || !targetUser) return false;
  
  const currentUserRole = currentUser.role?.name;
  const targetUserRole = targetUser.role?.name;
  
  // Prevent users from deleting themselves
  if (currentUser.id === targetUser.id) return false;
  
  // Superadmin can delete anyone except themselves
  if (currentUserRole === 'superadmin') return true;
  
  // Admin can only delete players and editors, not other admins or superadmins
  if (currentUserRole === 'admin') {
    return targetUserRole === 'player' || targetUserRole === 'editor';
  }
  
  // Other roles cannot delete anyone
  return false;
}

/**
 * Get a user-friendly message explaining why deletion is not allowed
 * @param currentUser - The user performing the action
 * @param targetUser - The user to be deleted
 * @returns string - Error message explaining the restriction
 */
export function getDeletionErrorMessage(currentUser: UserWithRole | null, targetUser: UserWithRole | null): string {
  if (!currentUser || !targetUser) return "Invalid user data";
  
  const currentUserRole = currentUser.role?.name;
  const targetUserRole = targetUser.role?.name;
  
  // Self-deletion attempt
  if (currentUser.id === targetUser.id) {
    return "You cannot delete your own account";
  }
  
  // Admin trying to delete higher or equal role
  if (currentUserRole === 'admin') {
    if (targetUserRole === 'admin') {
      return "Admins cannot delete other admins";
    }
    if (targetUserRole === 'superadmin') {
      return "Admins cannot delete superadmins";
    }
  }
  
  // Default permission denied message
  return "You don't have permission to delete this user";
}
