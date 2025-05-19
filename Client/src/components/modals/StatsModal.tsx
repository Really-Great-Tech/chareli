import { Dialog } from "../ui/dialog";
import { CustomDialogContent } from "../ui/custom-dialog-content";
import { FiClock } from "react-icons/fi";
import { LuGamepad2 } from "react-icons/lu";
import statImg from '../../assets/stat-img.svg';

interface StatsModalProps {
  open: boolean;
  onClose: () => void;
}

export function StatsModal({ open, onClose }: StatsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <CustomDialogContent className="bg-white dark:bg-[#18192b] rounded-2xl shadow-lg p-8 max-w-[90vw] w-[800px] border-none">
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
        <h2 className="text-4xl font-bold text-center mb-8 text-[#C026D3]">User Stats</h2>
        
        {/* Scrollable Content */}
        <div className="max-h-[70vh] overflow-y-auto overflow-x-hidden scrollbar-hide w-full">
          {/* Stats Summary */}
          <div className="flex gap-6 justify-center mb-8">
            <div className="bg-[#F1F5F9] dark:bg-[#121C2D] rounded-xl p-6 w-full flex items-start">
              <div className="bg-[#E879F9] rounded-full p-3 flex items-center justify-center">
                <FiClock className="w-8 h-8 text-white" />
              </div>
              <div className="ml-4">
                <div className="dark:text-white text-[#0F1621] font-bold text-lg">Minutes Played</div>
                <div className="dark:text-white text-[#0F1621] text-xl">1,300 minutes</div>
              </div>
            </div>
            <div className="flex items-center bg-[#F1F5F9] dark:bg-[#121C2D] rounded-xl p-6 w-full">
              <div className="bg-[#E879F9] rounded-full p-3 mb-2">
              <LuGamepad2 className='w-10 h-10 text-white dark:text-[#OF1621]' />
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
            <h3 className="text-3xl font-bold mb-6 text-[#C026D3]">Games Played</h3>
            
            <div className="mb-4 grid grid-cols-3 gap-4">
              <div className="text-xl font-bold dark:text-white text-[#0F1621]">Game</div>
              <div className="text-xl font-bold dark:text-white text-[#0F1621]">Total Time Spent</div>
              <div className="text-xl font-bold dark:text-white text-[#0F1621]">Last Played</div>
            </div>
            
            <div className="divide-y divide-[#35364d]">
              <div className="py-4 grid grid-cols-3 gap-4 items-center">
                <div className="flex items-center">
                  <img src={statImg} alt="Game" className="w-12 h-12 rounded-lg mr-3" />
                  <span className="font-bold">War Shooting</span>
                </div>
                <div className="dark:text-[#bdbdbd] text-[#334154]">289 minutes</div>
                <div className="dark:text-[#bdbdbd] text-[#334154]">1 minute ago</div>
              </div>
              
              <div className="py-4 grid grid-cols-3 gap-4 items-center">
                <div className="flex items-center">
                  <img src={statImg} alt="Game" className="w-12 h-12 rounded-lg mr-3" />
                  <span className="font-bold">War Shooting</span>
                </div>
                <div className="dark:text-[#bdbdbd] text-[#334154]">290 minutes</div>
                <div className="dark:text-[#bdbdbd] text-[#334154]">5 minutes ago</div>
              </div>
              
              <div className="py-4 grid grid-cols-3 gap-4 items-center">
                <div className="flex items-center">
                  <img src={statImg} alt="Game" className="w-12 h-12 rounded-lg mr-3" />
                  <span className="font-bold">War Shooting</span>
                </div>
                <div className="dark:text-[#bdbdbd] text-[#334154]">300 minutes</div>
                <div className="dark:text-[#bdbdbd] text-[#334154]">20 minutes ago</div>
              </div>
            </div>
          </div>
        </div>
      </CustomDialogContent>
    </Dialog>
  );
}
