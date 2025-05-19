import { CiEdit } from "react-icons/ci";
import { Button } from "../../components/ui/button";
import gameImg from "@/assets/gamesImg/1.svg";
import { IoChevronBack } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import EditProfileSheet from "../../components/single/EditProfile-Sheet";
import { useState } from "react";


export default function ViewProfile() {

    const dummyUser = {
        name: "John Doe",
        email: "killer1@gmail.com",
        mobile: "+97622244777",
        role: "Admin",
        avatar: gameImg,
        minutesPlayed: 1300,
        gamesPlayed: 20,
        sessions: 30,
      };

  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/admin/settings");
  };

  const [editOpen, setEditOpen] = useState(false);

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
              src={dummyUser.avatar}
              alt="avatar"
              className="w-20 h-20 rounded-full"
            />
            <div className="flex gap-3 items-center mt-4">
              <h2 className="mb-0 text-xl font-semibold text-[#121C2D] dark:text-white tracking-wider">
                {dummyUser.name}
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-green-500 font-bold text-lg">●</span>
                <span className="text-gray-700 text-sm dark:text-white font-pincuk">{dummyUser.role}</span>
              </div>
            </div>
            <Button
                className="w-full mt-3 border border-white bg-transparent shadow-none text-[#121C2D] h-14 hover:bg-[#3b495d] dark:text-white"
                onClick={() => setEditOpen(true)}
            >
                Edit <CiEdit />
            </Button>
            <EditProfileSheet
                open={editOpen}
                onOpenChange={setEditOpen}
                profile={{
                    name: dummyUser.name,
                    email: dummyUser.email,
                    phone: dummyUser.mobile,
                }}
            />
          </div>
        </div>
        {/* RIGHT: Profile Details */}
        <div className="flex-1 flex flex-col items-center md:items-start ">
          <div className="bg-[#f6f8fc] rounded-2xl p-8 mb-6 dark:bg-[#121C2D] w-full">
            <h3 className="text-xl mb-4 text-[#121C2D] tracking-wide dark:text-white">Profile Details</h3>
            <div className="grid grid-cols-2 gap-y-6 gap-x-8 dark:text-white space-y-6">
              <div className="text-fuchsia-500 tracking-wide text-lg">Name</div>
              <div className="text-[#334154] font-pincuk dark:text-white whitespace-pre-line">{dummyUser.name}</div>
              <div className="text-fuchsia-500 tracking-wide text-lg">Email</div>
              <div className="text-[#334154] font-pincuk dark:text-white">{dummyUser.email}</div>
              <div className="text-fuchsia-500 tracking-wide text-lg">Mobile number</div>
              <div className="text-[#334154] font-pincuk dark:text-white">{dummyUser.mobile}</div>
            </div>
          </div>
        </div>
      
    </div>
      </div>
  );
}