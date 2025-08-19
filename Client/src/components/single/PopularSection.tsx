import { Card } from "../../components/ui/card";
import { Input } from "../ui/input";
import { LazyImage } from "../../components/ui/LazyImage";
import { IoIosSearch } from "react-icons/io";
import { useGames } from "../../backend/games.service";
import { useGameClickHandler } from "../../hooks/useGameClickHandler";
import { useUISettings } from "../../hooks/useUISettings";
import GamesSkeleton from "./GamesSkeleton";

import emptyGameImg from "../../assets/empty-game.png";

interface PopularSectionProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const PopularSection = ({
  searchQuery,
  setSearchQuery,
}: PopularSectionProps) => {
  const { uiSettings } = useUISettings();
  const {
    data: gamesData,
    isLoading,
    error,
  } = useGames({
    filter: "popular",
    status: "active",
    search: searchQuery || undefined,
    limit: 4, // This limit will only apply to auto mode, manual mode ignores it
  });
  const games: any = gamesData || [];
  const { handleGameClick } = useGameClickHandler();

  // If no games and no search query, only show search bar (if enabled)
  if (!isLoading && !error && games.length === 0 && !searchQuery) {
    return (
      <div className="p-4">
        {uiSettings.showSearchBar && (
          <div className="flex justify-end mb-8">
            <div className="relative w-full md:w-[400px]">
              <IoIosSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#64748A] text-xl pointer-events-none" />
              <Input
                className="pl-12 w-full h-12 rounded-2xl text-[#64748A] tracking-wider border-2 border-[#DC8B18] focus:border-[#DC8B18] focus:outline-none shadow-[0_0_8px_rgba(220,139,24,0.2)] 
                            placeholder:text-[#64748A] bg-white/5
                            placeholder:text-sm"
                placeholder="What game do you want to search for?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className={`flex flex-col sm:flex-row items-start sm:items-center ${uiSettings.showSearchBar ? 'justify-between' : 'justify-start'} gap-4 mb-8`}>
        <h1 className="text-[#DC8B18] text-2xl font-worksans tracking-wide">
          Popular
        </h1>
        {uiSettings.showSearchBar && (
          <div className="relative w-full md:w-[400px]">
            <IoIosSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#64748A] text-xl pointer-events-none" />
            <Input
              className="pl-12 w-full h-12 rounded-2xl text-[#64748A] tracking-wider border-2 border-[#DC8B18] focus:border-[#DC8B18] focus:outline-none shadow-[0_0_8px_rgba(220,139,24,0.2)] 
                          placeholder:text-[#64748A] bg-white/5
                          placeholder:text-sm"
              placeholder="What game do you want to search for?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}
      </div>
      <div className="">
        <Card className="border-hidden shadow-none p-0 dark:bg-[#0f1221]">
          {isLoading && <GamesSkeleton count={4} />}
          {error && (
            <div className="text-center py-8 text-red-500">
              Error loading games
            </div>
          )}
          {!isLoading && !error && games.length === 0 && searchQuery && (
            <div className="text-center py-8 min-h-[60vh] flex flex-col items-center justify-center gap-4 text-[#C17600] text-4xl">
              <img
                src={emptyGameImg}
                alt="No games"
                className="w-80 h-80 object-contain"
              />
              No popular games found for "{searchQuery}"
            </div>
          )}
          {!isLoading && !error && games.length > 0 && (
            <div className="grid gap-6 w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-4 3xl:grid-cols-4 justify-center">
              {games.map((game: any) => (
                <div
                  key={game.id}
                  className="relative group cursor-pointer w-full"
                >
                  <div className="relative h-[290px] min-h-[290px] max-h-[290px] rounded-[32px] border-4 border-transparent group-hover:border-[#DC8B18] transition-all duration-300 ease-in-out group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(220,139,24,0.3)] box-border overflow-hidden"
                       onClick={() => handleGameClick(game.id)}>
                    <LazyImage
                      src={game.thumbnailFile?.s3Key || emptyGameImg}
                      alt={game.title}
                      className="w-full h-full object-cover"
                      loadingClassName="rounded-[28px]"
                      spinnerColor="#DC8B18"
                      rootMargin="50px"
                    />
                    {/* Game Info Overlay - Only visible on hover */}
                    <div className="absolute bottom-0 left-0 right-0 rounded-b-[28px] p-4 group-hover:opacity-100 transition-opacity duration-300 ease-in-out lg:opacity-0 lg:group-hover:opacity-100">
                      <h3 className="text-white font-semibold text-shadow-black/55 text-shadow-lg text-lg mb-1 truncate">
                        {game.title}
                      </h3>
                      {game.description && (
                        <p className="text-gray-200 text-sm leading-tight">
                          {game.description.length > 80
                            ? `${game.description.substring(0, 80)}...`
                            : game.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default PopularSection;
