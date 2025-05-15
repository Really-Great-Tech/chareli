import { Card } from "../../components/ui/card";
import ImgA1 from '../../assets/gamesImg/a1.svg';
import ImgA2 from '../../assets/gamesImg/a2.svg';
import ImgA3 from '../../assets/gamesImg/a3.svg';
import { Button } from "../../components/ui/button";

const AllGamesSection = () => {
    return (
        <div className="p-4">
            <div>
                <h1 className="text-[#D946EF] text-3xl mb-4">All Games</h1>
            </div>
            {/* filtering tabs */}
            <div className="flex gap-3 mb-8">
                <Button className="bg-[#C026D3] text-white">Racing</Button>
                <Button className="bg-[#94A3B7] text-white">Fighting</Button>
                <Button className="bg-[#94A3B7] text-white">Adventure</Button>
                <Button className="bg-[#94A3B7] text-white">Arcade</Button>
                <Button className="bg-[#94A3B7] text-white">Sports</Button>
                <Button className="bg-[#94A3B7] text-white">Action</Button>
                <Button className="bg-[#94A3B7] text-white">Recently Added</Button>
            </div>

            <div className="">
                    <div className="grid gap-4 w-full grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
                    <Card className="border-hidden shadow-none p-0 dark:bg-[#0f1221] hover:rounded-full">
                        <div className="relative gradient-shadow-hover transition-all duration-300">
                            <img src={ImgA1} alt="Runner Maze" className="w-full h-auto block rounded-xl" />
                            <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white font-bold text-2xl drop-shadow-md">Fortnite</span>
                        </div>
                    </Card>

                    <Card className="border-hidden shadow-none p-0 dark:bg-[#0f1221]">
                        <div className="relative gradient-shadow-hover transition-all duration-300">
                            <img src={ImgA2} alt="Runner Maze" className="w-full h-auto block rounded-xl" />
                            <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white font-bold text-2xl drop-shadow-md">G.O.T Minions</span>
                        </div>
                    </Card>
                        
                    <Card className="border-hidden shadow-none p-0 dark:bg-[#0f1221]">
                        <div className="relative gradient-shadow-hover transition-all duration-300">
                            <img src={ImgA3} alt="Runner Maze" className="w-full h-auto block rounded-xl" />
                            <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white font-bold text-2xl drop-shadow-md">H.E.R S.U.R.V.I.V.A.L</span>
                        </div>
                    </Card>
                    </div>
            </div>
        </div>
    );
};
    
export default AllGamesSection;