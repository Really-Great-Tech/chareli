import React, { useState } from "react";
import { FaChevronRight } from "react-icons/fa";
import { FaRegUser } from "react-icons/fa6";
import { MdLockOutline } from "react-icons/md";
import { IoDocumentTextOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import ChangePasswordSheet from "../../components/single/ChangePassword-Sheet";
import { TermsSheet } from "../../components/single/Terms-Sheet";
import { PrivacySheet } from "../../components/single/Privacy-Sheet";

const Settings: React.FC = () => {
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
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
    {
      icon: <IoDocumentTextOutline size={16} />,
      title: "Privacy Policy",
      description: "Upload",
      action: "Upload",
      onClick: () => {
        setShowPrivacy(true);
      },
    },
  ];

  return (
    <div className="px-8">
      <h1 className="text-3xl font-normal text-[#6A7282] dark:text-white mb-8 font-worksans">Settings</h1>
      <div className="flex flex-col gap-6">
        {settings.map((item, _idx) => (
          <div
            key={item.title}
            onClick={item.onClick}
            className="bg-[#F5F7FB] dark:bg-[#181B2A] rounded-2xl px-6 py-6 flex items-center justify-between hover:bg-gray-200 cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="bg-[#6A7282] flex items-center justify-center rounded-full w-10 h-10 sm:w-12 sm:h-12 text-lg sm:text-2xl text-white min-w-[2.5rem] min-h-[2.5rem] sm:min-w-[3rem] sm:min-h-[3rem] flex-shrink-0">
                {item.icon}
              </div>
              <div>
                <div className="text-sm sm:text-md text-gray-900 dark:text-white font-dmmono">
                  {item.title}
                </div>
                <div className="text-gray-500 font-worksans text-sm sm:text-lg tracking-wider dark:text-white font-dmmono">
                  {item.description}
                </div>
              </div>
            </div>
            <FaChevronRight className="text-gray-900 dark:text-white" />
          </div>
        ))}
      </div>
      <ChangePasswordSheet
        open={showChangePassword}
        onOpenChange={setShowChangePassword}
      />
      <TermsSheet open={showTerms} onOpenChange={setShowTerms} />
      <PrivacySheet open={showPrivacy} onOpenChange={setShowPrivacy} />
    </div>
  );
};

export default Settings;
