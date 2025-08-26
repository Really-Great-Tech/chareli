import React, { useState } from "react";
import { Button } from "../../ui/button";
import { IoIosArrowBack } from "react-icons/io";
// import { OTPModal } from './OTPModal';
import { FaEye, FaEyeSlash } from "react-icons/fa";

interface ResetPasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateNewPassModal({
  open,
  onClose,
}: ResetPasswordModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement send reset email logic
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      {/* Back Button (Top Left of Fullscreen Modal) */}
      <Button
        className="absolute top-4 left-4 text-black hover:bg-transparent px-3 py-2 flex items-center gap-2 border border-gray-400 bg-transparent"
        onClick={onClose}
      >
        <IoIosArrowBack /> Back
      </Button>

      <div className="bg-[#F1F5F9] rounded-2xl p-10 w-[500px] max-w-full shadow-none border border-[#E2E8F0] flex flex-col items-center relative">
        <h2 className="text-2xl font-bold text-[#6A7282] mb-8 underline underline-offset-4 text-center font-dmmono tracking-wider">
          Create New Password
        </h2>
        <form className="w-full flex flex-col gap-6" onSubmit={handleSubmit}>
          <div>
            <label className="block font-bold text-1xl mb-2 font-dmmono tracking-wider">
              Set New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full rounded-lg bg-gray-200 px-4 py-3 font-worksans text-xl tracking-wider"
                placeholder="New password"
              />
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? (
                  <FaEye size={15} className="text-white" />
                ) : (
                  <FaEyeSlash size={15} className="text-white" />
                )}
              </span>
            </div>
          </div>
          <div>
            <label className="block font-bold text-lg mb-1 font-dmmono tracking-wider">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                className="w-full rounded-lg bg-gray-200 px-4 py-3 font-worksans text-xl tracking-wider"
                placeholder="Confirm password"
              />
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
              >
                {showConfirmPassword ? (
                  <FaEye size={15} className="text-white" />
                ) : (
                  <FaEyeSlash size={15} className="text-white" />
                )}
              </span>
            </div>
          </div>
          <button
            type="submit"
            className="w-full mt-4 bg-[#6A7282] text-white font-bold py-3 rounded-lg cursor-pointer text-lg tracking-wider"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
