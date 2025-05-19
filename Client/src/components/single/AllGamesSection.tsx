import { useState } from "react";
import { Card } from "../../components/ui/card";
import ImgA1 from '../../assets/gamesImg/a1.svg';
import ImgA2 from '../../assets/gamesImg/a2.svg';
import ImgA3 from '../../assets/gamesImg/a3.svg';
import { Button } from "../../components/ui/button";

// Categories and games data
const categories = [
    "Racing", "Fighting", "Adventure", "Arcade", "Sports", "Action", "Shooting"
];

const games = [
    {
        name: "Fortnite",
        img: ImgA1,
        category: "Action",
        tags: ["Recently Added", "Popular"]
    },
    {
        name: "G.O.T Minions",
        img: ImgA2,
        category: "Adventure",
        tags: ["Popular"]
    },
    {
        name: "H.E.R S.U.R.V.I.V.A.L",
        img: ImgA3,
        category: "Shooting",
        tags: ["Recently Added"]
    }
];

const AllGamesSection = () => {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // Filter games based on selected category
    const filteredGames = selectedCategory
        ? games.filter(game => game.category === selectedCategory)
        : games;

    return (
        <div className="p-4">
            <div>
                <h1 className="text-[#D946EF] text-3xl mb-4 font-pong">All Games</h1>
            </div>
            {/* filtering tabs */}
            <div className="flex gap-3 mb-8">
                <Button
                    className={`bg-[${selectedCategory === null ? "#C026D3" : "#94A3B7"}] text-white`}
                    onClick={() => setSelectedCategory(null)}
                >
                    All
                </Button>
                {categories.map((cat) => (
                    <Button
                        key={cat}
                        className={`text-white ${selectedCategory === cat ? "bg-[#C026D3]" : "bg-[#94A3B7]"}`}
                        onClick={() => setSelectedCategory(cat)}
                    >
                        {cat}
                    </Button>
                ))}
            </div>

            <div className="">
                <div className="grid gap-4 w-full grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
                    {filteredGames.map((game) => (
                        <Card key={game.name} className="border-hidden shadow-none p-0 dark:bg-[#0f1221] hover:rounded-full">
                            <div className="relative gradient-shadow-hover transition-all duration-300">
                                <img src={game.img} alt={game.name} className="w-full h-auto block rounded-xl" />
                                <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white font-bold text-2xl drop-shadow-md">{game.name}</span>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AllGamesSection;