import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCategories } from '../../backend/category.service';
import { useGames } from '../../backend/games.service';
import GamesSkeleton from '../../components/single/GamesSkeleton';
import type { Category, GameResponse } from '../../backend/types';

const secondary = [
  "Recently Added", "Popular", "Recommended for you"
];

export default function Categories() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSecondary, setSelectedSecondary] = useState<string | null>(null);
  
  const { data: categoriesData, isLoading: categoriesLoading, error: categoriesError } = useCategories();
  const { data: gamesData, isLoading: gamesLoading, error: gamesError } = useGames();
  const categories = (categoriesData || []) as Category[];
  const games = gamesData || [];
  
  const filteredGames = (games as any).filter((game: GameResponse) => {
    console.log('Filtering Game:', game);
    const categoryMatch = selectedCategory ? game.categoryId === selectedCategory : true;
    const secondaryMatch = selectedSecondary
      ? (selectedSecondary === "Recently Added" 
         ? new Date(game.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
         : false) // For now, only support "Recently Added" filter
      : true;
    return categoryMatch && secondaryMatch;
  });

  return (
    <div className="flex min-h-[calc(100vh-80px)] bg-white dark:bg-[#0f1221]">
      <aside className="w-56 min-w-[220px] bg-transparent py-6 px-2 flex flex-col gap-2">
        {categoriesLoading ? (
          <div className="p-4 text-center">Loading categories...</div>
        ) : categoriesError ? (
          <div className="p-4 text-center text-red-500">Error loading categories</div>
        ) : (
          <div>
            <nav>
              <ul className="flex flex-col gap-1">
                <li>
                  <button
                    className={`w-full flex items-center gap-2 px-4 py-2 text-2xl rounded-lg font-bold tracking-widest transition
                      ${!selectedCategory && !selectedSecondary
                        ? 'bg-[#D946EF] text-white dark:text-white tracking-wider'
                        : 'bg-transparent text-[#121C2D] hover:bg-[#F3E8FF] hover:text-[#D946EF] dark:text-white tracking-wider'}
                    `}
                    onClick={() => { setSelectedCategory(null); setSelectedSecondary(null); }}
                  >
                    All
                  </button>
                </li>
                {categories.map(cat => (
                  <li key={cat.id}>
                    <button
                      className={`w-full text-left text-2xl px-4 py-2 rounded-lg font-semibold transition
                        ${selectedCategory === cat.id
                          ? 'bg-[#D946EF] text-white shadow dark:text-white tracking-wider'
                          : 'text-[#121C2D] hover:bg-[#F3E8FF] hover:text-[#D946EF] dark:text-white tracking-wider'}
                      `}
                      onClick={() => { setSelectedCategory(cat.id); setSelectedSecondary(null); }}
                    >
                      {cat.name}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="border-t border-[#E5E7EB] my-4" />
            <nav>
              <ul className="flex flex-col gap-1 tracking-widest">
                {secondary.map(sec => (
                  <li key={sec}>
                    <button
                      className={`w-full text-left text-2xl px-4 py-2 rounded-lg font-semibold text-[#121C2D] hover:bg-[#F3E8FF] hover:text-[#D946EF] dark:text-white tracking-wider transition ${selectedSecondary === sec ? 'bg-[#D946EF] text-white' : ''}`}
                      onClick={() => { setSelectedSecondary(sec); setSelectedCategory(null); }}
                    >
                      {sec}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        )}
      </aside>
      {/* Main Content */}
      <div className="flex-1 p-8">
        {gamesLoading ? (
          <GamesSkeleton count={9} showCategories={true} />
        ) : gamesError ? (
          <div className="text-center py-8 text-red-500">Error loading games</div>
        ) : (
          <div className="flex flex-col">
            {filteredGames.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No games found {selectedCategory ? "in this category" : selectedSecondary ? "for this filter" : ""}
              </div>
            ) : (
              <div className="grid gap-4 w-full grid-cols-3">
              {filteredGames.map((game: any, index: number) => {
                const spans = [1, 1.3, 1.1];
                const spanIndex = index % spans.length;
                const rowSpan = spans[spanIndex];
                
                return (
                  <div 
                    key={game.id} 
                    className="relative group cursor-pointer"
                    style={{ gridRow: `span ${Math.round(rowSpan * 2)}` }}
                    onClick={() => navigate(`/gameplay/${game.id}`)}
                  >
                    <div className="relative h-full overflow-hidden rounded-[20px]">
                    {/* Tag if Recently Added */}
                    {new Date(game.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && (
                      <span className="absolute top-3 right-3 bg-[#94A3B7] text-xs font-semibold tracking-wide text-white px-3 py-1 rounded-lg shadow-md z-10">
                        Recently Added
                      </span>
                    )}
                      <img 
                        src={game.thumbnailFile?.url} 
                        alt={game.title}
                        loading="lazy"
                        className="w-full h-full object-cover border-4 border-transparent group-hover:border-[#D946EF] transition-all duration-300 ease-in-out group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(217,70,239,0.3)]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent">
                        <span className="absolute bottom-3 left-4 text-white font-bold text-xl drop-shadow-lg">
                          {game.title}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
