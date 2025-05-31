import React, { useState } from "react";
import { FaChevronRight } from "react-icons/fa";
import { FaRegUser } from "react-icons/fa6";
import { MdLockOutline } from "react-icons/md";
import { IoDocumentTextOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import ChangePasswordSheet from "../../components/single/ChangePassword-Sheet";
import { TermsSheet } from "../../components/single/Terms-Sheet";

const Settings: React.FC = () => {
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const navigate = useNavigate();

  const settings = [
    {
      icon: <FaRegUser size={16} />,
      title: "Profile",
      description: "Update your Profile",
      action: "Update",
      onClick: () => {
        navigate("/admin/view-profile");
      },
    },
    {
      icon: <MdLockOutline size={16} />,
      title: "Change Password",
      description: "Update your Password",
      action: "Update",
      onClick: () => {
        setShowChangePassword(true);
      },
    },
    {
      icon: <IoDocumentTextOutline size={16} />,
      title: "Accept Terms of Use",
      description: "Upload",
      action: "Upload",
      onClick: () => {
        setShowTerms(true);
      },
    },
  ];

  return (
    <div className="px-8">
      <h1 className="text-3xl font-bold text-[#D946EF] mb-8">Settings</h1>
      <div className="flex flex-col gap-6">
        {settings.map((item, _idx) => (
          <div
            key={item.title}
            onClick={item.onClick}
            className="bg-[#F5F7FB] dark:bg-[#181B2A] rounded-2xl px-6 py-6 flex items-center justify-between hover:bg-gray-200 cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="bg-[#F0ABFC] flex items-center justify-center rounded-full w-12 h-12 text-2xl text-white">
                {item.icon}
              </div>
              <div>
                <div className="text-md text-gray-900 dark:text-white">{item.title}</div>
                <div className="text-gray-500 text-sm font-pincuk dark:text-white">{item.description}</div>
              </div>
            </div>
            <FaChevronRight className="text-gray-900 dark:text-white"/>
          </div>
        ))}
      </div>
      <ChangePasswordSheet 
        open={showChangePassword} 
        onOpenChange={setShowChangePassword}
      />
      <TermsSheet 
        open={showTerms} 
        onOpenChange={setShowTerms}
      />
    </div>
  );
};

export default Settings;
