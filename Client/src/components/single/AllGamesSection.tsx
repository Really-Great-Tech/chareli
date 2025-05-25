import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useNavigate } from "react-router-dom";
import { useGames } from "../../backend/games.service";
import { useCategories } from "../../backend/category.service";
import { useState } from "react";
import GamesSkeleton from "./GamesSkeleton";

const AllGamesSection = () => {
    const navigate = useNavigate();
    const { data: gamesData, isLoading: gamesLoading, error: gamesError } = useGames();
    const { data: categoriesData, isLoading: categoriesLoading } = useCategories();
    const games: any = gamesData || [];
    const [selectedCategory, setSelectedCategory] = useState("all");

    // Combine static filters with dynamic categories
    const allCategories = [
        { id: "all", name: "All Games", color: "#C026D3" },
        ...(categoriesData?.map(cat => ({
            id: cat.id,
            name: cat.name,
            color: "#94A3B7"
        })) || []),
        { id: "recent", name: "Recently Added", color: "#94A3B7" }
    ];

    const filteredGames = games.filter((game: any) => {
        if (selectedCategory === "all") return game.status === 'active';
        if (selectedCategory === "recent") {
            return game.status === 'active' && new Date(game.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        }
        return game.status === 'active' && game.categoryId === selectedCategory;
    });

    const handleGamePlay = (gameId: string) => {
        navigate(`/gameplay/${gameId}`);
    };

    return (
        <div className="p-4">
            <div>
                <h1 className="text-[#D946EF] text-3xl mb-4 font-boogaloo">All Games</h1>
            </div>
            {/* filtering tabs */}
            <div className="flex gap-3 mb-8 flex-wrap">
                {categoriesLoading ? (
                    <div>Loading categories...</div>
                ) : (
                    allCategories.map(category => (
                    <Button
                        key={category.id}
                        className={`text-white ${selectedCategory === category.id ? 'bg-[#C026D3]' : 'bg-[#94A3B7]'}`}
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
                        <div className="text-center py-8 text-red-500">Error loading games</div>
                    ) : filteredGames.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No games found for {selectedCategory === "all" ? "all categories" : 
                                              selectedCategory === "recent" ? "recently added" : 
                                              allCategories.find(cat => cat.id === selectedCategory)?.name || "this category"}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-[150px]">
                            {filteredGames.map((game: any, index: number) => {
                                // Alternate between different spans for subtle height variations
                                const spans = [1, 1.3, 1.1]; // More subtle height differences
                                const spanIndex = index % spans.length;
                                const rowSpan = spans[spanIndex];
                                
                                return (
                                    <div 
                                        key={game.id} 
                                        className="relative group cursor-pointer"
                                        style={{ gridRow: `span ${Math.round(rowSpan * 2)}` }}
                                        onClick={() => handleGamePlay(game.id)}
                                    >
                                        <div className="relative h-full overflow-hidden rounded-[20px]">
                                            <img 
                                                src={game.thumbnailFile?.url} 
                                                alt={game.title}
                                                loading="lazy"
                                                className="w-full h-full object-cover border-4 border-transparent group-hover:border-[#D946EF] transition-all duration-300 ease-in-out group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(217,70,239,0.3)]"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
                </Card>
            </div>
        </div>  
    );
};
    
export default AllGamesSection;
