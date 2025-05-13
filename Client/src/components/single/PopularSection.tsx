import { Card } from "../../components/ui/card";
import Img1 from '../../assets/gamesImg/1.svg';
import Img2 from '../../assets/gamesImg/2.svg';
import Img3 from '../../assets/gamesImg/3.svg';
import Img4 from '../../assets/gamesImg/4.svg';
import Img5 from '../../assets/gamesImg/5.svg';

const PopularSection = () => {
    return (
        <div className="p-4">
            <div>
                <h1 className="text-[#D946EF] text-3xl mb-4">Popular</h1>
            </div>
            <div className="">
                <Card className="border-hidden shadow-none p-0">
                    <div className="grid gap-4 w-full grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
                        <img src={Img1} alt="Runner Maze" />
                        <img src={Img2} alt="Runner Maze" />
                        <img src={Img3} alt="Runner Maze" />
                        <img src={Img4} alt="Runner Maze" />
                        <img src={Img5} alt="Runner Maze" />
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default PopularSection;