/**
 * Utility functions for session management
 */

/**
 * Generate or retrieve a visitor session ID
 * This ID persists across browser sessions and is used for analytics tracking
 * @returns {string} The visitor session ID
 */
export const getVisitorSessionId = (): string => {
  let sessionId = sessionStorage.getItem('visitor_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('visitor_session_id', sessionId);
  }
  return sessionId;
};
