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

            {/* Games Grid Skeleton */}
            <Card className="border-hidden shadow-none p-0 dark:bg-[#0f1221]">
                <div className={`grid ${count > 4 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-[repeat(auto-fit,minmax(268.8px,1fr))]'} gap-4`}>
                    {[...Array(count)].map((_, i) => (
                        <div key={i} className="relative p-[10px] group">
                            <div className="relative h-[290px] rounded-[32px] overflow-hidden">
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
