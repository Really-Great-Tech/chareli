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
                <Card className="border-hidden shadow-none p-0">
                    <div className="grid gap-4 w-full grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
                        <img src={ImgA1} alt="Runner Maze" />
                        <img src={ImgA2} alt="Runner Maze" />
                        <img src={ImgA3} alt="Runner Maze" />
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default AllGamesSection;