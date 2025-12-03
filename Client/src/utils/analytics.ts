/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Google Analytics utility functions for tracking gameplay events
 */

/**
 * Check if analytics is enabled and gtag is available
 */
export const isAnalyticsEnabled = (): boolean => {
  return (
    typeof window !== "undefined" &&
    (window as any).shouldLoadAnalytics === true &&
    typeof (window as any).gtag !== "undefined"
  );
};

/**
 * Track a custom event to Google Analytics
 */
export const trackEvent = (
  eventName: string,
  eventParams?: Record<string, any>
): void => {
  if (!isAnalyticsEnabled()) {
    return;
  }

  try {
    (window as any).gtag("event", eventName, {
      ...eventParams,
    });
  } catch (error) {
    console.error("Failed to track analytics event:", error);
  }
};

/**
 * Track gameplay-specific events
 */
export const trackGameplay = {
  /**
   * Track when a game session starts
   */
  gameStart: (gameId: string, gameTitle: string) => {
    trackEvent("game_start", {
      game_id: gameId,
      game_title: gameTitle,
      event_category: "Gameplay",
      event_label: gameTitle,
    });
  },

  /**
   * Track when a game session ends
   */
  gameEnd: (gameId: string, gameTitle: string, durationSeconds: number) => {
    trackEvent("game_end", {
      game_id: gameId,
      game_title: gameTitle,
      duration: durationSeconds,
      event_category: "Gameplay",
      event_label: gameTitle,
    });
  },

  /**
   * Track game session duration milestones
   */
  gameMilestone: (
    gameId: string,
    gameTitle: string,
    milestone: string,
    durationSeconds: number
  ) => {
    trackEvent("game_milestone", {
      game_id: gameId,
      game_title: gameTitle,
      milestone,
      duration: durationSeconds,
      event_category: "Gameplay",
      event_label: `${gameTitle} - ${milestone}`,
    });
  },

  /**
   * Track when a game is loaded
   */
  gameLoaded: (gameId: string, gameTitle: string, loadTimeMs: number) => {
    trackEvent("game_loaded", {
      game_id: gameId,
      game_title: gameTitle,
      load_time: loadTimeMs,
      event_category: "Gameplay",
      event_label: gameTitle,
    });
  },

  /**
   * Track when user exits game early
   */
  gameExit: (
    gameId: string,
    gameTitle: string,
    durationSeconds: number,
    reason?: string
  ) => {
    trackEvent("game_exit", {
      game_id: gameId,
      game_title: gameTitle,
      duration: durationSeconds,
      reason: reason || "user_action",
      event_category: "Gameplay",
      event_label: gameTitle,
    });
  },
};
