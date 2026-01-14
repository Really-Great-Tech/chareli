import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { LazyImage } from '../../components/ui/LazyImage';
import { useGames } from '../../backend/games.service';
import { useCategories } from '../../backend/category.service';
import { useGameClickHandler } from '../../hooks/useGameClickHandler';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import GamesSkeleton from './GamesSkeleton';
import './AllGamesSection.css';
import { trackInteraction } from '../../utils/analytics';

import emptyGameImg from '../../assets/empty-game.png';

interface AllGamesSectionProps {
  searchQuery: string;
}

const GAMES_PER_PAGE = 40;

const AllGamesSection = ({ searchQuery }: AllGamesSectionProps) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>(
    'mobile'
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const savedScrollPosition = useRef<number>(0);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [accumulatedGames, setAccumulatedGames] = useState<any[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const { data: categoriesData, isLoading: categoriesLoading } =
    useCategories();

  // Determine if we should use pagination (not for 'recent' filter which has its own limit)
  const shouldUsePagination = selectedCategory !== 'recent';

  const {
    data: gamesData,
    isLoading: gamesLoading,
    error: gamesError,
    isFetching,
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
    // Only add pagination params when pagination is enabled
    ...(shouldUsePagination && {
      page: currentPage,
      limit: GAMES_PER_PAGE,
    }),
  });

  // Use accumulated games for display
  // Fall back to gamesData.data when accumulatedGames is empty (handles initial load and category switches)
  const games: any = shouldUsePagination
    ? (accumulatedGames.length > 0 ? accumulatedGames : (gamesData?.data || []))
    : (gamesData?.data || []);

  // Calculate if there are more games to load
  const totalGames = gamesData?.total || 0;
  const hasMoreGames = shouldUsePagination && totalGames > 0 && games.length < totalGames && games.length > 0;

  // Combine static filters with dynamic categories
  const allCategories = useMemo(
    () => [
      { id: 'all', name: 'All Games', color: '#64748A' },
      ...(categoriesData?.map((cat) => ({
        id: cat.id,
        name: cat.name,
        color: '#94A3B7',
      })) || []),
      { id: 'recent', name: 'Recently Added', color: '#94A3B7' },
    ],
    [categoriesData]
  );

  // Compute section header based on selected category
  const sectionHeader = useMemo(() => {
    const category = allCategories.find((cat) => cat.id === selectedCategory);
    return category?.name || 'All Games';
  }, [selectedCategory, allCategories]);

  // Accumulate games from paginated responses
  useEffect(() => {
    if (gamesData?.data && gamesData.data.length > 0) {
      if (currentPage === 1) {
        // First page: replace all games
        setAccumulatedGames(gamesData.data);
      } else {
        // Subsequent pages: append to existing games (avoid duplicates)
        setAccumulatedGames((prev) => {
          const existingIds = new Set(prev.map((g: any) => g.id));
          const newGames = gamesData.data.filter((g: any) => !existingIds.has(g.id));
          return [...prev, ...newGames];
        });
      }
      setIsLoadingMore(false);
    }
  }, [gamesData?.data, currentPage]);

  // Reset pagination when category or search changes
  useEffect(() => {
    setCurrentPage(1);
    setAccumulatedGames([]);
  }, [selectedCategory, searchQuery]);

  // Handle "See More Games" button click
  const handleSeeMoreGames = useCallback(() => {
    const nextPage = currentPage + 1;
    setIsLoadingMore(true);

    // Track the interaction for analytics
    trackInteraction.seeMoreGames(nextPage, sectionHeader, games.length);

    setCurrentPage(nextPage);
  }, [currentPage, sectionHeader, games.length]);

  const { handleGameClick } = useGameClickHandler();

  // Screen size detection
  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScreenSize('mobile'); // 2 columns
      } else if (width < 1024) {
        setScreenSize('tablet'); // 3 columns
      } else {
        setScreenSize('desktop'); // 3+ columns
      }
    };

    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  // Scroll position management - prevent auto-scroll to bottom
  useEffect(() => {
    // Save current scroll position before category change
    const saveScrollPosition = () => {
      savedScrollPosition.current = window.scrollY;
    };

    // Save scroll position when category is about to change
    if (selectedCategory !== 'all') {
      saveScrollPosition();
    }
  }, [selectedCategory]);

  // Restore scroll position after games load and prevent layout shifts
  useEffect(() => {
    if (!gamesLoading && games.length > 0) {
      // Small delay to ensure DOM has updated
      const timer = setTimeout(() => {
        // On mobile, prevent automatic scrolling to bottom
        if (screenSize === 'mobile') {
          // Force scroll to a controlled position instead of auto-scroll
          if (savedScrollPosition.current > 0) {
            window.scrollTo({
              top: Math.min(
                savedScrollPosition.current,
                document.documentElement.scrollTop
              ),
              behavior: 'instant',
            });
          }
        } else {
          // On desktop, restore saved position
          if (savedScrollPosition.current > 0) {
            window.scrollTo({
              top: savedScrollPosition.current,
              behavior: 'smooth',
            });
          }
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [gamesLoading, games.length, screenSize]);

  // Prevent unwanted scroll behavior on mobile
  useEffect(() => {
    if (screenSize === 'mobile') {
      // Override scroll restoration for mobile
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
      }

      // Prevent automatic scrolling caused by layout changes
      const preventAutoScroll = (e: Event) => {
        // If user didn't initiate the scroll, prevent it
        if (!e.isTrusted) {
          e.preventDefault();
          return false;
        }
      };

      // Add passive event listener to monitor scrolls
      window.addEventListener('scroll', preventAutoScroll, { passive: false });

      return () => {
        window.removeEventListener('scroll', preventAutoScroll);
        if ('scrollRestoration' in history) {
          history.scrollRestoration = 'auto';
        }
      };
    }
  }, [screenSize]);

  return (
    <div ref={containerRef} className="p-4">
      <div>
        <h2 className="text-[#6A7282] dark:text-[#FEFEFE] text-3xl mb-4 font-worksans">
          {sectionHeader}
        </h2>
      </div>
      {/* filtering tabs */}
      <div className="relative mb-8">
        {categoriesLoading ? (
          <div>Loading categories...</div>
        ) : (
          <div className="relative">
            {/* Fade effect for left edge */}
            <div
              className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-[#0f1221] to-transparent z-10 pointer-events-none opacity-0 transition-opacity duration-300"
              id="left-fade"
            ></div>

            {/* Fade effect for right edge */}
            <div
              className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-[#0f1221] to-transparent z-10 pointer-events-none opacity-0 transition-opacity duration-300"
              id="right-fade"
            ></div>

            {/* Scrollable container */}
            <div
              className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
              onScroll={(e) => {
                const container = e.currentTarget;
                const leftFade = document.getElementById('left-fade');
                const rightFade = document.getElementById('right-fade');

                if (leftFade && rightFade) {
                  // Show left fade if scrolled right
                  leftFade.style.opacity =
                    container.scrollLeft > 10 ? '1' : '0';

                  // Show right fade if not at the end
                  const isAtEnd =
                    container.scrollLeft >=
                    container.scrollWidth - container.clientWidth - 10;
                  rightFade.style.opacity = isAtEnd ? '0' : '1';
                }
              }}
              ref={(el) => {
                if (el) {
                  // Initial fade state check
                  setTimeout(() => {
                    const leftFade = document.getElementById('left-fade');
                    const rightFade = document.getElementById('right-fade');

                    if (leftFade && rightFade) {
                      leftFade.style.opacity = el.scrollLeft > 10 ? '1' : '0';
                      const isAtEnd =
                        el.scrollLeft >= el.scrollWidth - el.clientWidth - 10;
                      rightFade.style.opacity = isAtEnd ? '0' : '1';
                    }
                  }, 100);
                }
              }}
            >
              {allCategories.map((category) => {
                const truncatedName =
                  category.name.length > 18
                    ? `${category.name.substring(0, 18)}...`
                    : category.name;

                return (
                  <Button
                    key={category.id}
                    className={`text-white cursor-pointer min-w-[120px] max-w-[200px] px-4 py-2 relative group flex-shrink-0 ${
                      selectedCategory === category.id
                        ? 'bg-[#64748A]'
                        : 'bg-[#94A3B8]'
                    }`}
                    onClick={() => setSelectedCategory(category.id)}
                    title={
                      category.name.length > 18 ? category.name : undefined
                    }
                  >
                    <h3 className="block truncate text-sm font-medium m-0 font-worksans">
                      {truncatedName}
                    </h3>
                    {category.name.length > 18 && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20 shadow-lg">
                        {category.name}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                      </div>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="">
        <Card className="border-hidden shadow-none p-0 dark:bg-[#0f1221]">
          {gamesLoading || (isFetching && games.length === 0) ? (
            <GamesSkeleton count={9} showCategories={true} />
          ) : gamesError ? (
            <div className="text-center py-8 text-red-500">
              Error loading games
            </div>
          ) : games.length === 0 && !isFetching ? (
            <div className="text-center py-8 min-h-[60vh] flex flex-col items-center justify-center gap-4 text-[#64748A] text-4xl">
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
            <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-2 auto-rows-[1fr] sm:auto-rows-[160px] md:auto-rows-[150px] all-games-grid sm:min-h-[500px]">
              {games.map((game: any) => {
                return (
                  <div
                    key={game.id}
                    className="relative group cursor-pointer"
                    onClick={() => handleGameClick(game.id, game.slug)}
                  >
                    <div className="relative h-full overflow-hidden rounded-[20px] transition-all duration-300 ease-in-out group-hover:shadow-[0_0px_20px_#64748A,0_0px_10px_rgba(100,116,138,0.8)] aspect-square sm:aspect-auto">
                      <div className="w-full h-full rounded-[16px] overflow-hidden">
                        <LazyImage
                          src={game.thumbnailFile?.s3Key}
                          alt={game.title}
                          className="w-full h-full object-fill"
                          aspectRatio="1/1"
                          width={400}
                          sizes="(max-width: 640px) 256px, (max-width: 1024px) 400px, 512px"
                          variants={game.thumbnailFile?.variants}
                          dimensions={game.thumbnailFile?.dimensions}
                          enableTransform={!game.thumbnailFile?.variants}
                          loadingClassName="rounded-[16px]"
                          spinnerColor="#64748A"
                          rootMargin="50px"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent group-hover:opacity-100 transition-opacity duration-300 lg:opacity-0 lg:group-hover:opacity-100 rounded-[16px]">
                          <h4 className="absolute bottom-2 left-2 md:bottom-3 md:left-4 text-white font-semibold text-xs md:text-base drop-shadow-lg text-shadow-black/55 text-shadow-lg m-0 font-worksans">
                            {game.title}
                          </h4>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* See More Games Button */}
          {!gamesLoading && !gamesError && games.length > 0 && hasMoreGames && (
            <div className="flex justify-center mt-8 mb-4">
              <Button
                type="button"
                onClick={handleSeeMoreGames}
                disabled={isLoadingMore || isFetching}
                className="bg-[#64748A] hover:bg-[#4e5c6e] text-white px-8 py-3 rounded-lg font-worksans text-base transition-all duration-300 flex items-center gap-2 cursor-pointer"
              >
                {isLoadingMore || isFetching ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                  </>
                ) : (
                  <>
                    See More Games
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                )}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AllGamesSection;
