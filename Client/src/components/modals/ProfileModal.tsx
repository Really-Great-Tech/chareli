import { Dialog } from "../ui/dialog";
import { CustomDialogContent } from "../ui/custom-dialog-content";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";
import { TbLogout } from "react-icons/tb";
import { RiDeleteBin6Line } from "react-icons/ri";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";
import { useDeleteUser } from "../../backend/user.service";
import { toast } from "sonner";

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export function ProfileModal({ open, onClose }: ProfileModalProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const deleteUser = useDeleteUser();

  const handleLogout = () => {
    logout();
    onClose();
    navigate("/");
  };

  const handleDeleteAccount = async () => {
    if (!user?.id) return;
    
    try {
      await deleteUser.mutateAsync(user.id);
      
      // Close modal immediately and wait a bit before logout/navigation
      setShowDeleteModal(false);
      
      // Use setTimeout to ensure modal is fully closed before logout
      setTimeout(() => {
        toast.success("Account deleted successfully");
        logout(true);
        navigate("/");
      }, 100);
    } catch (error) {
      toast.error("Failed to delete account");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <CustomDialogContent className="bg-white dark:bg-[#18192b] rounded-2xl shadow-lg p-6 sm:p-8 min-w-[320px] max-w-[90vw] w-full sm:w-[420px] max-h-[80vh] overflow-y-auto overflow-x-hidden border-none">
        <button
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-[#C026D3] flex items-center justify-center shadow-lg hover:bg-[#a21caf] transition-colors z-10"
          onClick={onClose}
          aria-label="Close"
        >
          <span className="text-white text-lg font-bold">×</span>
        </button>

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

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 justify-end">
          <button
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[#6B7280] hover:bg-[#4B5563] text-white font-dmmono text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#6B7280] focus:ring-offset-2 cursor-pointer"
            onClick={handleLogout}
          >
            <TbLogout className="w-4 h-4" />
            Logout
          </button>
          <button
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[#EF4444] hover:bg-[#dc2626] text-white font-dmmono text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#EF4444] focus:ring-offset-2 cursor-pointer"
            onClick={() => {
              onClose(); // Close the profile modal first
              setShowDeleteModal(true); // Then open the delete confirmation modal
            }}
          >
            <RiDeleteBin6Line className="w-4 h-4" />
            Deactivate Account
          </button>
        </div>
      </CustomDialogContent>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onConfirm={handleDeleteAccount}
        isDeleting={deleteUser.isPending}
        title="Deactivate Account"
        description={
          <span>
            Are you sure you want to delete your account? This action cannot be undone and you will lose access to all your data.
          </span>
        }
        confirmButtonText="Deactivate My Account"
        loadingText="Deactivating Account..."
      />
    </Dialog>
  );
}
