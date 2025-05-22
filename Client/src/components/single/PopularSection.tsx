import { Card } from "../../components/ui/card";
import { Input } from "../ui/input";
import { IoIosSearch } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { useGames } from "../../backend/games.service";
import { useState } from "react";

const PopularSection = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const { data, isLoading, error } = useGames();
    const games: any = data || [];

    console.log("games for popular", data)

    const filteredGames = games.filter((game: any) => 
        game.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        game.status === 'active'
    );

    const handleGamePlay = (gameId: string) => {
        navigate(`/gameplay/${gameId}`);
    };

    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-[#D946EF] text-3xl font-boogaloo">Popular</h1>
                <div className="relative w-96">     
                    <IoIosSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#64748A] text-xl pointer-events-none" />
                    <Input 
                        className="pl-10 w-96 h-10 rounded-xl text-[#64748A] tracking-wider border border-[#D946EF] focus:border-[#D946EF] focus:outline-none shadow-[0_0_0_2px_rgba(217,70,239,0.1)] 
                        placeholder:text-[#64748A]
                        placeholder:text-sm"
                        placeholder="What game do you want to search for?"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
            <div className="">
                <Card className="border-hidden shadow-none p-0 dark:bg-[#0f1221]">
                    {isLoading ? (
                        <div className="text-center py-8">Loading games...</div>
                    ) : error ? (
                        <div className="text-center py-8 text-red-500">Error loading games</div>
                    ) : (
                        <div className="grid gap-1 w-full grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">
                            {filteredGames?.map((game: any) => (
                                <div key={game.id} className="relative aspect-square">
                                    <img 
                                        src={game.thumbnailFile?.s3Url} 
                                        alt={game.title}
                                        className="w-full h-full object-cover border-4 border-transparent hover:border-[#D946EF] hover:mt-0 hover:rounded-4xl box-border transition-transform duration-200 hover:scale-110"
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
