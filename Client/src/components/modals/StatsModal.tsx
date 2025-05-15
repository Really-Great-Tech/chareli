// import React from 'react';
import { Card } from "../ui/card";

import { FiClock } from "react-icons/fi";
import { LuGamepad2 } from "react-icons/lu";

import statImg from '../../assets/stat-img.svg'

interface StatsModalProps {
    open: boolean;
    onClose: () => void;
  }
  
  export function StatsModal({ open, onClose }: StatsModalProps) {
    if (!open) return null;
    return (
      <Card className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-white/10">
        <div className="relative bg-white dark:bg-[#18192b] rounded-2xl shadow-lg p-8 min-w-[350px] max-w-[90vw] w-[500px]">
          {/* Close Button */}
          <button
          className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-[#C026D3] flex items-center justify-center shadow-lg hover:bg-[#a21caf] transition-colors"
          onClick={onClose}
          aria-label="Close"
          style={{ border: 'none' }}
        >
          <span className="text-white text-2xl font-bold">×</span>
        </button>
          {/* Header */}
          <h2 className="text-4xl font-bold text-center mb-8 text-[#C026D3] tracking-wide">User Stats</h2>
          {/* Stats Summary */}
          <div className="flex gap-6 justify-center mb-8">
            <div className="flex items-center bg-[#F1F5F9] dark:bg-[#121C2D] rounded-xl p-6 w-full">
              <div className="bg-[#E879F9] rounded-full p-3 mb-2">
              <FiClock className='w-10 h-10  text-white dark:text-[#OF1621]' />
              </div>
              <div>
              </div>
              <div className="flex flex-col ml-6">
              <span className="dark:text-white text-[#0F1621] font-bold text-lg tracking-widest mb-2">Minutes Played</span>
              <div className='flex gap-2 items-center'>
              <span className="dark:text-white text-[#0F1621] text-xl font-thin mt-1 font-sans">1,300</span>
              <span className="dark:text-white text-[#0F1621] text-xl font-thin font-sans">minutes</span>
              </div>
              </div>
            </div>
            <div className="flex items-center bg-[#F1F5F9] dark:bg-[#121C2D] rounded-xl p-6 w-full">
              <div className="bg-[#E879F9] rounded-full p-3 mb-2">
              <LuGamepad2 className='w-10 h-10 text-white dark:text-[#OF1621]' />
              </div>
              <div>
              </div>
              <div className="flex flex-col ml-6">
              <span className="dark:text-white text-[#0F1621] font-bold text-lg tracking-widest mb-2">Total Plays</span>
              <div className=''>
              <span className="dark:text-white text-[#0F1621] text-xl font-thin mt-1 font-sans">500</span>
              </div>
              </div>
            </div>
          </div>
          {/* Games Played */}
          <div className="bg-[#F1F5F9] dark:bg-[#121C2D] rounded-xl p-6">
            <h3 className="text-4xl font-bold mb-8 text-[#C026D3]">Games Played</h3>
            <div className="grid grid-cols-4 gap-4 text-white font-bold mb-2 items-center">
              <span className="col-span-2 text-3xl tracking-wider text-[#0F1621] dark:text-white">Game</span>
              <span className="text-xl dark:text-white text-[#0F1621]">Total Time Spent</span>
              <span className="text-xl dark:text-white text-[#0F1621]">Last Played</span>
            </div>
            <div className="divide-y divide-[#35364d]">
              {/* Example row, repeat for each game */}
              <div className="grid grid-cols-4 gap-4 py-3 items-center">
                <div className="flex items-center col-span-2">
                  <img src={statImg} alt="Game" className="w-12 h-12 rounded-lg mr-3 " />
                  <span className="font-bold text-lg tracking-wider ">War Shooting</span>
                </div>
                <span className="font-sans dark:text-[#bdbdbd] text-[#334154] text-sm">289 minutes</span>
                <span className="dark:text-[#bdbdbd] font-sans text-shadow-amber-300 text-[#334154]">1 minute ago</span>
              </div>
              <div className="grid grid-cols-4 gap-4 py-3 items-center">
                <div className="flex items-center col-span-2">
                  <img src={statImg} alt="Game" className="w-12 h-12 rounded-lg mr-3" />
                  <span className="font-bold text-lg tracking-wider">War Shooting</span>
                </div>
                <span className="font-sans dark:text-[#bdbdbd] text-[#334154] text-sm">290 minutes</span>
                <span className="dark:text-[#bdbdbd] font-sans text-sm text-[#334154]">5 minutes ago</span>
              </div>
              <div className="grid grid-cols-4 gap-4 py-3 items-center">
                <div className="flex items-center col-span-2">
                  <img src={statImg} alt="Game" className="w-12 h-12 rounded-lg mr-3"/>
                  <span className="font-bold text-lg tracking-wider">War Shooting</span>
                </div>
                <span className="font-sans dark:text-[#bdbdbd] text-[#334154] text-sm">300 minutes</span>
                <span className="dark:text-[#bdbdbd] font-sans text-sm text-[#334154]">20 minutes ago</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }
  