import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useGames } from '../../backend/games.service';
import { useCategories } from '../../backend/category.service';
import { useGameClickHandler } from '../../hooks/useGameClickHandler';
import { useState } from 'react';
import GamesSkeleton from './GamesSkeleton';

import emptyGameImg from '../../assets/empty-game.png';
import { SecureImage } from './SecureImage';

interface AllGamesSectionProps {
  searchQuery: string;
}

const AllGamesSection = ({ searchQuery }: AllGamesSectionProps) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { data: categoriesData, isLoading: categoriesLoading } =
    useCategories();
  const {
    data: gamesData,
    isLoading: gamesLoading,
    error: gamesError,
  } = useGames({
    categoryId:
      selectedCategory === 'all'
        ? undefined
        : selectedCategory === 'recent'
        ? undefined
        : selectedCategory,
    filter: selectedCategory === 'recent' ? 'recently_added' : undefined,
    status: 'active',
    search: searchQuery || undefined,
  });

  // Combine static filters with dynamic categories
  const allCategories = [
    { id: 'all', name: 'All Games', color: '#C026D3' },
    ...(categoriesData?.map((cat) => ({
      id: cat.id,
      name: cat.name,
      color: '#94A3B7',
    })) || []),
    { id: 'recent', name: 'Recently Added', color: '#94A3B7' },
  ];

  const games: any = gamesData || [];
  const { handleGameClick } = useGameClickHandler();

  return (
    <div className="p-4">
      <div>
        <h1 className="text-[#D946EF] text-3xl mb-4 font-worksans">
          All Games
        </h1>
      </div>
      {/* filtering tabs */}
      <div className="flex gap-3 mb-8 flex-wrap">
        {categoriesLoading ? (
          <div>Loading categories...</div>
        ) : (
          allCategories.map((category) => (
            <Button
              key={category.id}
              className={`text-white ${
                selectedCategory === category.id
                  ? 'bg-[#C026D3]'
                  : 'bg-[#94A3B7]'
              }`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </Button>
          ))
        )}
      </div>

      <div className="">
        <Card className="border-hidden shadow-none p-0 dark:bg-[#0f1221]">
          {gamesLoading ? (
            <GamesSkeleton count={9} showCategories={true} />
          ) : gamesError ? (
            <div className="text-center py-8 text-red-500">
              Error loading games
            </div>
          ) : games.length === 0 ? (
            <div className="text-center py-8 min-h-[60vh] flex flex-col items-center justify-center gap-4 text-[#C026D3] text-4xl">
              <img
                src={emptyGameImg}
                alt="No games"
                className="w-80 h-80 object-contain"
              />
              No games found for{' '}
              {selectedCategory === 'all'
                ? 'all categories'
                : selectedCategory === 'recent'
                ? 'recently added'
                : allCategories.find((cat) => cat.id === selectedCategory)
                    ?.name || 'this category'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[150px]">
              {games.map((game: any, index: number) => {
                // Alternate between different spans for subtle height variations
                const spans = [1, 1.3, 1.1]; // More subtle height differences
                const spanIndex = index % spans.length;
                const rowSpan = spans[spanIndex];

                return (
                  <div
                    key={game.id}
                    className="relative group cursor-pointer"
                    style={{ gridRow: `span ${Math.round(rowSpan * 2)}` }}
                    onClick={() => handleGameClick(game.id)}
                  >
                    <div className="relative h-full overflow-hidden rounded-[20px] transition-all duration-300 ease-in-out group-hover:scale-105 group-hover:shadow-[0_0px_20px_#D946EF,0_0px_10px_rgba(217,70,239,0.8)]">
                      <div className="w-full h-full rounded-[16px] overflow-hidden">
                        <SecureImage
                          src={game.thumbnailFile?.url}
                          alt={game.title}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                        {/* <img
                          src={game.thumbnailFile?.url}
                          alt={game.title}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        /> */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent group-hover:opacity-100 transition-opacity duration-300 lg:opacity-0 lg:group-hover:opacity-100 rounded-[16px]">
                          <span className="absolute bottom-3 left-4 text-white font-semibold text-base drop-shadow-lg text-shadow-black/55 text-shadow-lg">
                            {game.title}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AllGamesSection;
