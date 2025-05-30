import { Card } from "../../components/ui/card";
import { Input } from "../ui/input";
import { IoIosSearch } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { useGames } from "../../backend/games.service";
import GamesSkeleton from "./GamesSkeleton";

interface PopularSectionProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
}

const PopularSection = ({ searchQuery, setSearchQuery }: PopularSectionProps) => {
    const navigate = useNavigate();
    const { data: gamesData, isLoading, error } = useGames({
        filter: "popular",
        status: "active",
        search: searchQuery || undefined,
        limit: 4
    });
    const games: any = gamesData || [];

    const handleGamePlay = (gameId: string) => {
        navigate(`/gameplay/${gameId}`);
    };

    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-[#D946EF] text-4xl font-boogaloo tracking-wide">Popular</h1>
                <div className="relative w-[400px]">     
                    <IoIosSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#64748A] text-xl pointer-events-none" />
                    <Input 
                        className="pl-12 w-full h-12 rounded-2xl text-[#64748A] tracking-wider border-2 border-[#D946EF] focus:border-[#D946EF] focus:outline-none shadow-[0_0_8px_rgba(217,70,239,0.2)] 
                        placeholder:text-[#64748A] bg-white/5
                        placeholder:text-sm"
                        placeholder="What game do you want to search for?"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
            <div className="">
                <Card className="border-hidden shadow-none p-0 dark:bg-[#0f1221]">
                    {isLoading && <GamesSkeleton count={4} />}
                    {error && <div className="text-center py-8 text-red-500">Error loading games</div>}
                    {!isLoading && !error && games.length === 0 && (
                        <div className="text-center py-8 min-h-[40vh] flex items-center justify-center text-gray-500">
                            No popular games found {searchQuery ? `for "${searchQuery}"` : ""}
                        </div>
                    )}
                    {!isLoading && !error && games.length > 0 && (
                        <div className="grid gap-[10px] w-full grid-cols-[repeat(auto-fit,minmax(268.8px,1fr))]">
                            {games.map((game: any) => (
                                <div key={game.id} className="relative p-[10px] group cursor-pointer">
                                    <img 
                                        src={game.thumbnailFile?.s3Key} 
                                        alt={game.title}
                                        loading="lazy"
                                        className="w-full h-[290px] min-h-[290px] max-h-[290px] object-cover rounded-[32px] border-4 border-transparent group-hover:border-[#D946EF] transition-all duration-300 ease-in-out group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(217,70,239,0.3)]"
                                        onClick={() => handleGamePlay(game.id)}
                                    />
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
