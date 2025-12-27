import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { useSystemConfigByKey } from '../../backend/configuration.service';
import { useGames } from '../../backend/games.service';
import { Loader2, ChevronDown, X } from 'lucide-react';
import { LazyImage } from '../ui/LazyImage';
import emptyGameImg from '../../assets/empty-game.png';

interface PopularGamesConfigurationRef {
  getSettings: () => { mode: 'auto' | 'manual'; selectedGameIds: string[] };
}

interface PopularGamesConfigurationProps {
  disabled?: boolean;
}

const PopularGamesConfiguration = forwardRef<
  PopularGamesConfigurationRef,
  PopularGamesConfigurationProps
>(({ disabled = false }, ref) => {
  const [isManualMode, setIsManualMode] = useState(false);
  const [selectedGameIds, setSelectedGameIds] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const { data: popularConfigData, isLoading: isLoadingConfig } =
    useSystemConfigByKey('popular_games_settings');
  const { data: allGamesData, isLoading: isLoadingGames } = useGames({
    status: 'active',
  });

  const allGames = Array.isArray(allGamesData) ? allGamesData : [];

  // Load initial configuration
  useEffect(() => {
    if (popularConfigData?.value) {
      setIsManualMode(popularConfigData.value.mode === 'manual');
      const gameIds = popularConfigData.value.selectedGameIds;
      // Handle both array and object formats from database
      if (Array.isArray(gameIds)) {
        setSelectedGameIds(gameIds);
      } else if (gameIds && typeof gameIds === 'object') {
        // Convert object to array (e.g., {"0": "id1", "1": "id2"} -> ["id1", "id2"])
        setSelectedGameIds(Object.values(gameIds));
      } else {
        setSelectedGameIds([]);
      }
    }
  }, [popularConfigData]);

  // Expose settings to parent component
  useImperativeHandle(ref, () => ({
    getSettings: () => ({
      mode: isManualMode ? 'manual' : 'auto',
      selectedGameIds: isManualMode ? selectedGameIds : [],
    }),
  }));

  const handleToggleManualMode = (checked: boolean) => {
    setIsManualMode(checked);
    if (!checked) {
      setSelectedGameIds([]);
    }
  };

  const handleGameSelect = (gameId: string) => {
    if (selectedGameIds.includes(gameId)) {
      setSelectedGameIds((prev) => prev.filter((id) => id !== gameId));
    } else {
      setSelectedGameIds((prev) => [...prev, gameId]);
    }
    // Close dropdown after selection
    setIsDropdownOpen(false);
  };

  const handleRemoveGame = (gameId: string) => {
    setSelectedGameIds((prev) => prev.filter((id) => id !== gameId));
  };

  const selectedGames = allGames.filter((game) =>
    selectedGameIds.includes(game.id)
  );
  const availableGames = allGames.filter(
    (game) => !selectedGameIds.includes(game.id)
  );

  return (
    <div>
      <h2 className="text-lg sm:text-xl font-worksans text-[#6A7282] dark:text-white mb-4">
        Popular Games
      </h2>
      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-6 relative">
        {(isLoadingConfig || isLoadingGames) && (
          <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 flex items-center justify-center rounded-lg">
            <Loader2 className="h-6 w-6 animate-spin text-[#6A7282]" />
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Checkbox
              checked={isManualMode}
              onCheckedChange={handleToggleManualMode}
              id="manual-popular-games"
              color="#6A7282"
              disabled={disabled || isLoadingConfig || isLoadingGames}
            />
            <Label
              htmlFor="manual-popular-games"
              className="text-sm font-medium text-black dark:text-white cursor-pointer"
            >
              Games
            </Label>
          </div>

          {isManualMode && (
            <div className="space-y-4">
              {/* Dropdown for selecting games */}
              <div className="relative w-full max-w-md">
                <button
                  type="button"
                  onClick={() =>
                    !disabled && setIsDropdownOpen(!isDropdownOpen)
                  }
                  disabled={disabled || isLoadingGames}
                  className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-left text-sm text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between hover:border-[#6A7282] focus:border-[#6A7282] focus:outline-none"
                >
                  <span className="text-gray-500">Select Games</span>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-500 transition-transform ${
                      isDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isDropdownOpen && availableGames.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {availableGames.map((game) => (
                      <button
                        key={game.id}
                        type="button"
                        onClick={() => handleGameSelect(game.id)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-600 first:rounded-t-lg last:rounded-b-lg text-gray-900 dark:text-white"
                      >
                        {game.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected games preview */}
              {selectedGames.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
                  {selectedGames.map((game) => (
                    <div key={game.id} className="relative group">
                      <div className="relative h-32 w-full rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-600">
                        <LazyImage
                          src={game.thumbnailFile?.s3Key || emptyGameImg}
                          alt={game.title}
                          className="w-full h-full object-cover"
                          variants={game.thumbnailFile?.variants}
                          dimensions={game.thumbnailFile?.dimensions}
                          enableTransform={!game.thumbnailFile?.variants}
                          loadingClassName="rounded-lg"
                          spinnerColor="#6A7282"
                        />
                        <button
                          onClick={() => handleRemoveGame(game.id)}
                          className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                          disabled={disabled}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-xs font-medium text-gray-900 dark:text-white mt-1 truncate">
                        {game.title}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {selectedGames.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No games selected. Use the dropdown above to select games for
                  the popular section.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

PopularGamesConfiguration.displayName = 'PopularGamesConfiguration';

export default PopularGamesConfiguration;
export type { PopularGamesConfigurationRef };
