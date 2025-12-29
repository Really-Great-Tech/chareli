import { Card } from "../ui/card";

interface GamesSkeletonProps {
    count?: number;
    showCategories?: boolean;
}

const GamesSkeleton = ({ count = 4, showCategories = false }: GamesSkeletonProps) => {
    return (
        <div className="w-full">
            {/* Title Skeleton */}
            <div className="mb-4">
                <div className="h-8 w-48 bg-gradient-to-r from-[#0f1221] via-[#6A7282]/10 to-[#0f1221] animate-shimmer rounded-lg"></div>
            </div>

            {/* Categories Skeleton */}
            {showCategories && (
                <div className="flex gap-3 mb-8 flex-wrap">
                    {[...Array(7)].map((_, i) => (
                        <div
                            key={i}
                            className="h-10 w-24 bg-gradient-to-r from-[#0f1221] via-[#6A7282]/10 to-[#0f1221] animate-shimmer rounded-lg"
                        ></div>
                    ))}
                </div>
            )}

            {/* Games Grid Skeleton - Matches AllGamesSection varied-height layout */}
            <Card className="border-hidden shadow-none p-0 dark:bg-[#0f1221]">
                <div className={`grid ${count > 4 ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 md:gap-6 auto-rows-[1fr] sm:auto-rows-[160px] md:auto-rows-[150px] all-games-grid min-h-[600px] sm:min-h-[500px]' : 'grid-cols-[repeat(auto-fit,minmax(268.8px,1fr))] gap-4'}`}>
                    {[...Array(count)].map((_, i) => (
                        <div key={i} className="relative group">
                            <div className={`relative ${count > 4 ? '' : 'aspect-square'} rounded-[20px] overflow-hidden`}>
                                <div className="absolute inset-0 bg-gradient-to-r from-[#0f1221] via-[#6A7282]/10 to-[#0f1221] animate-shimmer"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};

export default GamesSkeleton;
