// Global progress storage that persists across renders
const gameProgressStorage = new Map<string, number>();

export const setGameProgress = (gameId: string, progress: number) => {
  gameProgressStorage.set(gameId, progress);
  console.log(`💾 Stored progress for ${gameId}: ${progress}%`);
};

export const getGameProgress = (gameId: string): number | undefined => {
  return gameProgressStorage.get(gameId);
};

export const clearGameProgress = (gameId: string) => {
  gameProgressStorage.delete(gameId);
};

export const clearAllProgress = () => {
  gameProgressStorage.clear();
};
