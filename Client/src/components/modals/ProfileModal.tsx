import { Dialog } from "../ui/dialog";
import { CustomDialogContent } from "../ui/custom-dialog-content";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

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
    navigate("/");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <CustomDialogContent className="bg-white dark:bg-[#18192b] rounded-2xl shadow-lg p-6 sm:p-8 min-w-[320px] max-w-[90vw] w-full sm:w-[420px] border-none">
        {/* Custom Close Button */}
        <button
          className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-[#C026D3] flex items-center justify-center shadow-lg hover:bg-[#a21caf] transition-colors z-10"
          onClick={onClose}
          aria-label="Close"
        >
          <span className="text-white text-xl font-bold">×</span>
        </button>

        {/* Profile Header */}
        <div className="text-center mb-6">
          <h1 className="font-dmmono text-3xl text-[#C026D3]">Profile</h1>
        </div>

        {/* Profile Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center mb-6 p-4 rounded-lg bg-gray-50 dark:bg-[#1f2937] gap-4">
          <div className="flex-shrink-0 self-center sm:self-auto">
            <img
              src="https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"
              alt="Profile"
              className="w-16 h-16 rounded-full object-cover border-2 border-[#D946EF]"
            />
          </div>
          <div className="flex-1 min-w-0 text-center sm:text-left sm:ml-0">
            <div className="text-lg font-extrabold font-dmmono dark:text-[#D946EF] text-[#0F1621] break-words overflow-wrap-anywhere">
              {user
                ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Guest User"
                : "Guest User"}
            </div>
            <div className="dark:text-gray-300 text-gray-600 font-worksans text-sm break-words overflow-wrap-anywhere">
              {user?.email || "No email available"}
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="space-y-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 border-b border-[#CBD5E0] dark:border-[#475568] gap-1 sm:gap-0">
            <span className="dark:text-[#D946EF] text-[#0F1621] font-dmmono text-base font-medium">
              Name
            </span>
            <span className="dark:text-white text-[#0F1621] font-worksans text-base sm:text-right sm:flex-1 sm:ml-4 break-words overflow-wrap-anywhere word-break-break-all">
              {user
                ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Not available"
                : "Not available"}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 border-b border-[#CBD5E0] dark:border-[#475568] gap-1 sm:gap-0">
            <span className="dark:text-[#D946EF] text-[#0F1621] font-dmmono text-base font-medium">
              Email
            </span>
            <span className="dark:text-white text-[#0F1621] font-worksans text-base sm:text-right sm:flex-1 sm:ml-4 break-words overflow-wrap-anywhere word-break-break-all">
              {user?.email || "Not available"}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 border-b border-[#CBD5E0] dark:border-[#475568] gap-1 sm:gap-0">
            <span className="dark:text-[#D946EF] text-[#0F1621] font-dmmono text-base font-medium">
              Mobile
            </span>
            <span className="dark:text-white text-[#0F1621] font-worksans text-base sm:text-right sm:flex-1 sm:ml-4 break-words overflow-wrap-anywhere word-break-break-all">
              {user?.phoneNumber || "Not available"}
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <div className="flex justify-end pt-4">
          <button
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#EF4444] hover:bg-[#dc2626] text-white font-dmmono text-base transition-colors focus:outline-none focus:ring-2 focus:ring-[#EF4444] focus:ring-offset-2 cursor-pointer"
            onClick={handleLogout}
          >
            Logout
            <TbLogout className="w-5 h-5" />
          </button>
        </div>
      </CustomDialogContent>
    </Dialog>
  );
}
