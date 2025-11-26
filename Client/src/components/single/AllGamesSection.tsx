import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { LazyImage } from "../../components/ui/LazyImage";
import { useGames } from "../../backend/games.service";
import { useCategories } from "../../backend/category.service";
import { useGameClickHandler } from "../../hooks/useGameClickHandler";
import { useState, useEffect, useRef } from "react";
import GamesSkeleton from "./GamesSkeleton";

import emptyGameImg from "../../assets/empty-game.png";

interface AllGamesSectionProps {
  searchQuery: string;
}

const AllGamesSection = ({ searchQuery }: AllGamesSectionProps) => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  const containerRef = useRef<HTMLDivElement>(null);
  const savedScrollPosition = useRef<number>(0);
  
  const { data: categoriesData, isLoading: categoriesLoading } =
    useCategories();
  const {
    data: gamesData,
    isLoading: gamesLoading,
    error: gamesError,
  } = useGames({
    categoryId:
      selectedCategory === "all"
        ? undefined
        : selectedCategory === "recent"
        ? undefined
        : selectedCategory,
    filter: selectedCategory === "recent" ? "recently_added" : undefined,
    status: "active",
    search: searchQuery || undefined,
  });

  // Combine static filters with dynamic categories
  const allCategories = [
    { id: "all", name: "All Games", color: "#64748A" },
    ...(categoriesData?.map((cat) => ({
      id: cat.id,
      name: cat.name,
      color: "#94A3B7",
    })) || []),
    { id: "recent", name: "Recently Added", color: "#94A3B7" },
  ];

  const games: any = gamesData || [];
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
              top: Math.min(savedScrollPosition.current, document.documentElement.scrollTop),
              behavior: 'instant'
            });
          }
        } else {
          // On desktop, restore saved position
          if (savedScrollPosition.current > 0) {
            window.scrollTo({
              top: savedScrollPosition.current,
              behavior: 'smooth'
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
        <h2 className="text-[#6A7282] dark:text-[#FEFEFE] text-3xl mb-4 font-worksans">All Games</h2>
      </div>
      {/* filtering tabs */}
      <div className="relative mb-8">
        {categoriesLoading ? (
          <div>Loading categories...</div>
        ) : (
          <div className="relative">
            {/* Fade effect for left edge */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-[#0f1221] to-transparent z-10 pointer-events-none opacity-0 transition-opacity duration-300" id="left-fade"></div>
            
            {/* Fade effect for right edge */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-[#0f1221] to-transparent z-10 pointer-events-none opacity-0 transition-opacity duration-300" id="right-fade"></div>
            
            {/* Scrollable container */}
            <div 
              className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
              onScroll={(e) => {
                const container = e.currentTarget;
                const leftFade = document.getElementById('left-fade');
                const rightFade = document.getElementById('right-fade');
                
                if (leftFade && rightFade) {
                  // Show left fade if scrolled right
                  leftFade.style.opacity = container.scrollLeft > 10 ? '1' : '0';
                  
                  // Show right fade if not at the end
                  const isAtEnd = container.scrollLeft >= container.scrollWidth - container.clientWidth - 10;
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
                      const isAtEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 10;
                      rightFade.style.opacity = isAtEnd ? '0' : '1';
                    }
                  }, 100);
                }
              }}
            >
              {allCategories.map((category) => {
                const truncatedName = category.name.length > 18 
                  ? `${category.name.substring(0, 18)}...` 
                  : category.name;
                
                return (
                  <Button
                    key={category.id}
                    className={`text-white cursor-pointer min-w-[120px] max-w-[200px] px-4 py-2 relative group flex-shrink-0 ${
                      selectedCategory === category.id
                        ? "bg-[#64748A]"
                        : "bg-[#94A3B8]"
                    }`}
                    onClick={() => setSelectedCategory(category.id)}
                    title={category.name.length > 18 ? category.name : undefined}
                  >
                    <span className="block truncate text-sm font-medium">
                      {truncatedName}
                    </span>
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
          {gamesLoading ? (
            <GamesSkeleton count={9} showCategories={true} />
          ) : gamesError ? (
            <div className="text-center py-8 text-red-500">
              Error loading games
            </div>
          ) : games.length === 0 ? (
            <div className="text-center py-8 min-h-[60vh] flex flex-col items-center justify-center gap-4 text-[#64748A] text-4xl">
              <img
                src={emptyGameImg}
                alt="No games"
                className="w-80 h-80 object-contain"
              />
              No games found for{" "}
              {selectedCategory === "all"
                ? "all categories"
                : selectedCategory === "recent"
                ? "recently added"
                : allCategories.find((cat) => cat.id === selectedCategory)
                    ?.name || "this category"}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 md:gap-6 auto-rows-[1fr] sm:auto-rows-[160px] md:auto-rows-[150px]">
              {games.map((game: any, index: number) => {
                // Different behavior for mobile vs desktop
                let colSpan = 1;
                let rowSpan = 1;

                if (screenSize === 'mobile') {
                  // Mobile: uniform sizes (no varied widths)
                  colSpan = 1;
                } else {
                  // Desktop: keep original varied heights
                  const spans = [1.2, 1.3, 1.25]; // Even more uniform heights with minimal variation
                  const spanIndex = index % spans.length;
                  const heightSpan = spans[spanIndex];
                  rowSpan = Math.round(heightSpan * 2);
                }

                return (
                  <div
                    key={game.id}
                    className="relative group cursor-pointer"
                    style={{ 
                      gridColumn: screenSize === 'mobile' ? `span ${colSpan}` : 'span 1',
                      gridRow: screenSize === 'mobile' ? 'span 1' : `span ${rowSpan}`
                    }}
                    onClick={() => handleGameClick(game.id)}
                  >
                    <div className="relative h-full overflow-hidden rounded-[20px] transition-all duration-300 ease-in-out group-hover:shadow-[0_0px_20px_#64748A,0_0px_10px_rgba(100,116,138,0.8)] aspect-square sm:aspect-auto">
                      <div className="w-full h-full rounded-[16px] overflow-hidden">
                        <LazyImage
                          src={game.thumbnailFile?.s3Key}
                          alt={game.title}
                          className="w-full h-full object-fill"
                          loadingClassName="rounded-[16px]"
                          spinnerColor="#64748A"
                          rootMargin="50px"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent group-hover:opacity-100 transition-opacity duration-300 lg:opacity-0 lg:group-hover:opacity-100 rounded-[16px]">
                          <span className="absolute bottom-2 left-2 md:bottom-3 md:left-4 text-white font-semibold text-xs md:text-base drop-shadow-lg text-shadow-black/55 text-shadow-lg">
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
