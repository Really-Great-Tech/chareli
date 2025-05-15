// import React from 'react';

import ImgA1 from '../../assets/gamesImg/a1.svg';
import ImgA2 from '../../assets/gamesImg/a2.svg';
import ImgA3 from '../../assets/gamesImg/a3.svg';
import ImgA4 from '../../assets/gamesImg/a4.svg';
import ImgA5 from '../../assets/gamesImg/a5.svg';
import ImgA6 from '../../assets/gamesImg/a6.svg';
import { Card } from '../../components/ui/card';
const categories = [
  "Racing", "Fighting", "Adventure", "Arcade", "Sports", "Action", "Puzzle", "Board", "Party", "Card", "Shooting"
];

const secondary = [
  "Recently Added", "Popular", "Recommended for you"
];

export default function Categories() {
  return (
    <div className="flex min-h-[calc(100vh-80px)] bg-white dark:bg-[#0f1221]">
      {/* Sidebar */}
      <aside className="w-56 min-w-[220px] bg-transparent py-6 px-2 flex flex-col gap-2">
        <nav>
          <ul className="flex flex-col gap-1">
            <li>
              <button className="w-full flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-white bg-[#D946EF] shadow transition">
                All
              </button>
            </li>
            {categories.map(cat => (
              <li key={cat}>
                <button className="w-full text-left text-2xl px-4 py-2 rounded-lg font-semibold text-[#64748A] hover:bg-[#F3E8FF] hover:text-[#D946EF] transition">
                  {cat}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-[#E5E7EB] my-4" />
        <nav>
          <ul className="flex flex-col gap-1">
            {secondary.map(sec => (
              <li key={sec}>
                <button className="w-full text-left text-2xl px-4 py-2 rounded-lg font-semibold text-[#64748A] hover:bg-[#F3E8FF] hover:text-[#D946EF] transition">
                  {sec}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      {/* Main Content Placeholder */}
      <div className="flex-1 p-8">
        {/* <div className="text-2xl font-bold text-[#D946EF]">Categories Content</div> */}
        <div>
        <div className="grid gap-4 w-full grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
                    <div className="grid gap-4 w-full grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
                    <Card className="border-hidden shadow-none p-0 dark:bg-[#0f1221] hover:rounded-full">
                        <div className="relative gradient-shadow-hover transition-all duration-300">
                            {/* Recently Added Tag */}
                            <span className="absolute top-3 right-3 bg-[#94A3B7] text-xs font-semibold tracking-wide text-white px-3 py-1 rounded-lg shadow-md z-10">
                                Recently Added
                            </span>
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

                    <Card className="border-hidden shadow-none p-0 dark:bg-[#0f1221]">
                        <div className="relative gradient-shadow-hover transition-all duration-300">
                            <img src={ImgA4} alt="Runner Maze" className="w-full h-auto block rounded-xl" />
                            <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white font-bold text-2xl drop-shadow-md">D..E.A.T.H</span>
                        </div>
                    </Card>

                    <Card className="border-hidden shadow-none p-0 dark:bg-[#0f1221]">
                        <div className="relative gradient-shadow-hover transition-all duration-300">
                            {/* Recently Added Tag */}
                            <span className="absolute top-3 right-3 bg-[#94A3B7] text-xs font-semibold tracking-wide text-white px-3 py-1 rounded-lg shadow-md z-10">
                                Recently Added
                            </span>
                            <img src={ImgA5} alt="Runner Maze" className="w-full h-auto block rounded-xl" />
                            <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white font-bold text-2xl drop-shadow-md">SCAR: The Green Nin</span>
                        </div>
                    </Card>

                    <Card className="border-hidden shadow-none p-0 dark:bg-[#0f1221]">
                        <div className="relative gradient-shadow-hover transition-all duration-300">
                            <img src={ImgA6} alt="Runner Maze" className="w-full h-auto block rounded-xl" />
                            <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white font-bold text-2xl drop-shadow-md">Shooters Range</span>
                        </div>
                    </Card>
                    </div>
            </div>
        </div>
      </div>
    </div>
  );
}
