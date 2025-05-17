import { Card } from "../../components/ui/card";
import Img1 from '../../assets/gamesImg/1.svg';
import Img2 from '../../assets/gamesImg/2.svg';
import Img3 from '../../assets/gamesImg/3.svg';
import Img4 from '../../assets/gamesImg/4.svg';
import Img5 from '../../assets/gamesImg/5.svg';
import { Input } from "../ui/input";

import { IoIosSearch } from "react-icons/io";
import { useNavigate } from "react-router-dom";

const PopularSection = () => {
    const navigate = useNavigate();

    const handleGamePlay = () => {
        navigate('/gameplay');
    };

    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-[#D946EF] text-3xl font-pong">Popular</h1>
                <div className="relative w-96">     
                    <IoIosSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#64748A] text-xl pointer-events-none" />
                    <Input 
                        className="pl-10 w-96 h-10 rounded-xl text-[#64748A] tracking-wider border border-[#D946EF] focus:border-[#D946EF] focus:outline-none shadow-[0_0_0_2px_rgba(217,70,239,0.1)] 
                        // placeholder:font-semibold 
                        placeholder:text-[#64748A]
                        placeholder:text-sm"
                        placeholder="What game do you want to search for?"
                    />
                </div>
            </div>
            <div className="">
                <Card className="border-hidden shadow-none p-0 dark:bg-[#0f1221]">
                    <div className="grid gap-1 w-full grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">
                        <img src={Img1} alt="Runner Maze" className="border-4 border-transparent hover:border-[#D946EF] hover:mt-0 hover:rounded-4xl box-border transition-transform duration-200 hover:scale-110" onClick={handleGamePlay}/>
                        <img src={Img2} alt="Runner Maze" className="border-4 border-transparent hover:border-[#D946EF] hover:mt-0 hover:rounded-4xl box-border transition-transform duration-200 hover:scale-110" onClick={handleGamePlay}/>
                        <img src={Img3} alt="Runner Maze" className="border-4 border-transparent hover:border-[#D946EF] hover:mt-0 hover:rounded-4xl box-border transition-transform duration-200 hover:scale-110" onClick={handleGamePlay} />
                        <img src={Img4} alt="Runner Maze" className="border-4 border-transparent hover:border-[#D946EF] hover:mt-0 hover:rounded-4xl box-border transition-transform duration-200 hover:scale-110" onClick={handleGamePlay}/>
                        <img src={Img5} alt="Runner Maze" className="border-4 border-transparent hover:border-[#D946EF] hover:mt-0 hover:rounded-4xl box-border transition-transform duration-200 hover:scale-110" onClick={handleGamePlay}/>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default PopularSection;