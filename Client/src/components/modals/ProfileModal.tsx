import { Card } from "../ui/card";
import profileImg from '../../assets/profileModal-Img.svg';

import { TbLogout } from "react-icons/tb";

interface ProfileModalProps {
    open: boolean;
    onClose: () => void;
}

export function ProfileModal({ open, onClose }: ProfileModalProps) {
    if (!open) return null;
    return (
        <Card className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-white/10">
            <div className="relative bg-white dark:bg-[#18192b] rounded-2xl shadow-lg p-8 min-w-[350px] max-w-[90vw] w-[400px]">
                {/* Close Button */}
                <button
                    className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-[#C026D3] flex items-center justify-center shadow-lg hover:bg-[#a21caf] transition-colors"
                    onClick={onClose}
                    aria-label="Close"
                    style={{ border: 'none' }}
                >
                    <span className="text-white text-2xl font-bold">×</span>
                </button>
                {/* Profile Header */}
                <div className='justify-center text-center text-[#C026D3] mb-8 text-3xl'>
                    <h1 className=''>Profile</h1>
                </div>
                <div className="flex items-center mb-2">

                    <div>
                    <img
                        src={profileImg}
                        alt="Profile"
                        className="w-20 h-20 rounded-full object-cover mb-2"
                        />
                    </div>

                    <div className='ml-4'>
                    <div className="text-3xl font-extrabold font-boogaloo dark:text-[#D946EF] text-[#0F1621] mb-1">KiIIer Bean</div>
                    <div className="dark:text-white text-[#0F1621] font-thin text-base font-pincuk">killer1@gmail.com</div>
                    </div>
                </div>
                {/* Profile Details */}
                <div className="dark:bg-[#18192b] bg-white rounded-xl p-4 mb-4 space-y-8">
                    <div className="flex justify-between py-2 border-b border-t border-[#CBD5E0] dark:border-[#475568] items-center mb-8">
                        <span className="dark:text-[#D946EF] font-boogaloo text-xl mt-4 mb-8">Name</span>
                        <span className="dark:text-white font-pincuk mt-4 mb-8">John Doe</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[#CBD5E0] dark:border-[#475568] items-center">
                        <span className="dark:text-[#D946EF] font-boogaloo text-xl mb-6">Email account</span> 
                        <span className="dark:text-white font-pincuk mb-6">killer1@gmail.com</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[#CBD5E0] dark:border-[#475568] items-center">
                        <span className="dark:text-[#D946EF] font-boogaloo text-xl mb-6">Mobile number</span>
                        <span className="dark:text-white font-pincuk mb-6">+97622244777</span>
                    </div>
                </div>
                <div className="flex justify-end">
                  <button
                      className="w-24 mt-2 py-2 rounded-lg bg-[#EF4444] hover:bg-[#dc2626] text-white tracking-wider text-lg transition-colors"
                      onClick={onClose}
                  >
                    <div className='flex gap-2 items-center px-2'>
                        Logout
                        <TbLogout className="w-8 h-8" />
                    </div>
                  </button>
                </div>
                </div>
        </Card>
    );
}
  