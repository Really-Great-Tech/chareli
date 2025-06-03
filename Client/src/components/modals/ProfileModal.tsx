import { Dialog } from "../ui/dialog";
import { CustomDialogContent } from "../ui/custom-dialog-content";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

import { TbLogout } from "react-icons/tb";

interface ProfileModalProps {
    open: boolean;
    onClose: () => void;
}

export function ProfileModal({ open, onClose }: ProfileModalProps) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    
    const handleLogout = () => {
        logout();
        onClose();
        navigate('/');
    };
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <CustomDialogContent className="bg-white dark:bg-[#18192b] rounded-2xl shadow-lg p-8 min-w-[350px] max-w-[90vw] w-[400px] border-none">
                {/* Custom Close Button */}
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
                    <h1 className='font-boogaloo'>Profile</h1>
                </div>
                <div className="flex items-center mb-2">

                    <div>
                    <img
                        src="https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"
                        alt="Profile"
                        className="w-20 h-20 rounded-full object-cover mb-2 border-2 border-[#D946EF]"
                    />
                    </div>

                    <div className='ml-4'>
                    <div className="text-3xl font-extrabold font-boogaloo dark:text-[#D946EF] text-[#0F1621] mb-1">
                        {user ? `${user.firstName || '' } ${user.lastName || ''}` : 'Guest User'}
                    </div>
                    <div className="dark:text-white text-[#0F1621] font-pincuk text-xl tracking-wider">
                        {user?.email || ''}
                    </div>
                    </div>
                </div>
                {/* Profile Details */}
                <div className="dark:bg-[#18192b] bg-white rounded-xl p-4 mb-4 space-y-8">
                    <div className="flex justify-between py-2 border-b border-t border-[#CBD5E0] dark:border-[#475568] items-center mb-8">
                        <span className="dark:text-[#D946EF] font-boogaloo text-xl mt-4 mb-8">Name</span>
                        <span className="dark:text-white font-pincuk text-xl tracking-wider mt-4 mb-8">
                            {user ? `${user.firstName || ''} ${user.lastName || ''}` : 'Guest User'}
                        </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[#CBD5E0] dark:border-[#475568] items-center">
                        <span className="dark:text-[#D946EF] font-boogaloo text-xl mb-6">Email account</span> 
                        <span className="dark:text-white font-pincuk text-xl tracking-wider mb-6">
                            {user?.email || 'Not available'}
                        </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[#CBD5E0] dark:border-[#475568] items-center">
                        <span className="dark:text-[#D946EF] font-boogaloo text-xl mb-6">Mobile number</span>
                        <span className="dark:text-white font-pincuk text-xl tracking-wider mb-6">
                            {user?.phoneNumber || 'Not available'}
                        </span>
                    </div>
                </div>
                <div className="flex justify-end">
                  <button
                      className="w-24 mt-2 py-2 rounded-lg bg-[#EF4444] hover:bg-[#dc2626] text-white tracking-wider text-lg transition-colors"
                      onClick={handleLogout}
                  >
                    <div className='flex gap-2 items-center px-2 font-boogaloo'>
                        Logout
                        <TbLogout className="w-8 h-8" />
                    </div>
                  </button>
                </div>
            </CustomDialogContent>
        </Dialog>
    );
}
