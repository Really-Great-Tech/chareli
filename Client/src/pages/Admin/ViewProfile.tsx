import { CiEdit } from "react-icons/ci";
import { Button } from "../../components/ui/button";
import { IoChevronBack } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import EditProfileSheet from "../../components/single/EditProfile-Sheet";
import { useState } from "react";
import { useUserData } from "../../backend/user.service";

export default function ViewProfile() {
  const { data: user, isLoading } = useUserData();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);

  const handleBack = () => {
    navigate("/admin/settings");
  };

  if (isLoading) {
    return (
      <div className="px-8 flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-[#D946EF] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="px-8 flex items-center justify-center h-96">
        <p className="text-gray-500">Failed to load profile</p>
      </div>
    );
  }

  return (
    <div className="px-8 flex flex-col gap-6">
      <Button
        className="flex items-center justify-center gap-2 text-[#121C2D] mb-2 border border-gray-400 rounded-lg w-22 py-2 px-1 hover:bg-transparent bg-transparent dark:text-white"
        onClick={handleBack}
      >
        <IoChevronBack />
        <p>Back</p>
      </Button>
      <div className="flex flex-col md:flex-row gap-8">
        {/* LEFT: Profile Card */}
        <div className="flex flex-col items-center">
          <div className="w-96 bg-[#f6f8fc] rounded-2xl p-6 flex flex-col items-center mb-8 dark:bg-[#334154]">
            <img
              src="https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"
              alt="Profile"
              className="w-20 h-20 rounded-full border-2 border-[#D946EF]"
            />
            <div className="flex gap-3 items-center mt-4">
              <h2 className="mb-0 text-lg  text-[#121C2D] dark:text-white tracking-wider">
                {user.firstName} {user.lastName}
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-green-500 font-bold text-lg">●</span>
                <span className="text-gray-700 dark:text-white font-worksans text-lg tracking-wider">
                  {user.role?.name || "User"}
                </span>
              </div>
            </div>
            <Button
              className="w-full mt-3 border border-white bg-transparent shadow-none text-[#121C2D] h-14 hover:bg-fuchsia-500 dark:text-white"
              onClick={() => setEditOpen(true)}
            >
              Edit <CiEdit />
            </Button>
            <EditProfileSheet
              open={editOpen}
              onOpenChange={setEditOpen}
              profile={{
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phoneNumber || "",
              }}
            />
          </div>
        </div>
        {/* RIGHT: Profile Details */}
        <div className="flex-1 flex flex-col items-center md:items-start ">
          <div className="bg-[#f6f8fc] rounded-2xl p-8 mb-6 dark:bg-[#121C2D] w-full">
            <h3 className="text-lg mb-4 text-[#121C2D] tracking-wide dark:text-white">
              Profile Details
            </h3>
            <div className="grid grid-cols-2 gap-y-6 gap-x-8 dark:text-white space-y-6">
              <div className="text-fuchsia-500 tracking-wide text-base">Name</div>
              <div className="text-[#334154] font-worksans text-sm tracking-wider dark:text-white whitespace-pre-line">
                {user.firstName} {user.lastName}
              </div>
              <div className="text-fuchsia-500 tracking-wide text-base">
                Email
              </div>
              <div className="text-[#334154] font-worksans text-sm tracking-wider dark:text-white">
                {user.email}
              </div>
              <div className="text-fuchsia-500 tracking-wide text-base">
                Mobile number
              </div>
              <div className="text-[#334154] font-worksans text-sm tracking-wider dark:text-white">
                {user.phoneNumber || "Not provided"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
