import { useState } from 'react';
import Img1 from '../../assets/gamesImg/1.svg';
import Img2 from '../../assets/gamesImg/2.svg';
import Img3 from '../../assets/gamesImg/3.svg';
import Img4 from '../../assets/gamesImg/4.svg';
import Img5 from '../../assets/gamesImg/5.svg';

import IframeImg from '../../assets/iFrame.svg';
import { Card } from '../../components/ui/card';

import { LuExpand } from "react-icons/lu";
import KeepPlayingModal from '../../components/KeepPlayingModal';


export default function GamePlay() {


    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const [expanded, setExpanded] = useState(false);

    return (
        <div>
            {/* Game area */}
            <div className={`relative w-full ${expanded ? 'h-screen max-w-full fixed inset-0 z-40 bg-black bg-opacity-90' : 'max-w-full pl-6 pr-6'} mx-auto rounded-2xl border-4 border-purple-400`} style={{ background: '#18181b' }}>
                {/* Modal (inside game area, with blur) */}
                <KeepPlayingModal open={isModalOpen} onClose={handleCloseModal} />
                <img
                    src={IframeImg}
                    alt="Embedded Content"
                    className={`w-full ${expanded ? 'h-screen' : 'h-[80vh]'} object-contain rounded-2xl`}
                    style={{ display: 'block', background: 'transparent' }}
                />
                <div className="absolute bottom-0 left-0 w-full flex items-center justify-between px-6 py-2 bg-[#2d0036] rounded-b-2xl border-t border-purple-400">
                    <span className="text-white text-sm font-semibold">DUST-One Universe-One war</span>
                    <div className="flex items-center space-x-2">
                        <span role="img" aria-label="smile" className="text-xl">😍</span>
                        <span role="img" aria-label="smile" className="text-xl cursor-pointer" onClick={handleModal}>🥲</span>
                        <span
                            className="text-white text-xs cursor-pointer"
                            onClick={() => setExpanded(e => !e)}
                            title={expanded ? "Exit Fullscreen" : "Expand"}
                        ><LuExpand className='w-5 h-5' /></span>
                    </div>
                </div>
            </div>
            {/* Similar Games section */}
            <div>
                <h1 className='p-4 text-4xl font-semibold text-[#0F1621] mt-12'>Similar Games</h1>
            </div>
            <div>
                <div className="flex items-center justify-between mb-4"></div>
                <div className="">
                    <Card className="border-hidden shadow-none p-0 mb-12 dark:bg-[#0f1221]">
                        <div className="grid gap-1 w-full grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">
                            <img src={Img1} alt="Runner Maze" className="border-4 border-transparent hover:border-[#D946EF] hover:rounded-4xl box-border transition-transform duration-200 hover:scale-110" />
                            <img src={Img2} alt="Runner Maze" className="border-4 border-transparent hover:border-[#D946EF] hover:rounded-4xl box-border transition-transform duration-200 hover:scale-110" />
                            <img src={Img3} alt="Runner Maze" className="border-4 border-transparent hover:border-[#D946EF] hover:rounded-4xl box-border transition-transform duration-200 hover:scale-110" />
                            <img src={Img4} alt="Runner Maze" className="border-4 border-transparent hover:border-[#D946EF] hover:rounded-4xl box-border transition-transform duration-200 hover:scale-110" />
                            <img src={Img5} alt="Runner Maze" className="border-4 border-transparent hover:border-[#D946EF] hover:rounded-4xl box-border transition-transform duration-200 hover:scale-110" />
                        </div>
                    </Card>
                </div>
                {/* <footer className="text-center text-white dark:white py-8 bg-[#1E0420] dark:bg-[#1E0420] w-full mt-6">
                    <div className='w-full lg:w-[800px] mx-auto'>
                        <p className='font-boogaloo mb-2 text-xs'>These games are brought to you by Chareli, a web-based gaming platform.</p>
                        <p className='font-pincuk text-sm mt-2 mb-2'>By using this service, you agree to the Chareli <span className='text-[#C026D3] underline cursor-pointer'>Terms of Service</span>. Chareli's <span className='text-[#C026D3] underline cursor-pointer'>Privacy Policy</span> sets out how we handle your data.</p>
                        <p className='font-pincuk text-sm'>Chareli uses cookies to deliver and enhance the quality of its services, to analyze traffic, and to personalize the content that you see. Chareli uses analytics services to serve the content that you see. You can opt out of content personalization at
                          &nbsp;<span className='text-[#C026D3] underline cursor-pointer'>Personalization settings & cookies</span>. You can opt out of ads personalization with <span className='text-[#C026D3] underline cursor-pointer'>ad settings</span>. Note that this setting also affects ads personalization on other sites and apps that partner with Chareli. </p>
                    </div>
                </footer> */}
            </div>
        </div>
    );
}
