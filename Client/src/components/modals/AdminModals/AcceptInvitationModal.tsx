import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

interface AcceptInvitationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isExistingUser: boolean;
}

export const AcceptInvitationModal: React.FC<AcceptInvitationModalProps> = ({
  open,
  onOpenChange,
  isExistingUser,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[#F1F5F9] rounded-2xl p-4 sm:p-6 md:p-8 w-[90%] sm:w-[420px] md:w-[450px] lg:w-[480px] max-w-[90vw] shadow-xl border border-[#E2E8F0] flex flex-col items-center mx-4">
        <h2 className="text-2xl sm:text-2xl font-bold text-[#D946EF] mb-4 sm:mb-6 underline underline-offset-4 text-center font-dmmono">
          Accept Invitation
        </h2>
        <form className="w-full flex flex-col gap-4">
          {isExistingUser ? (
            <>
              <div>
                <label className="block font-bold text-base sm:text-lg mb-1 font-dmmono tracking-wider">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full rounded-lg bg-gray-200 px-3 sm:px-4 py-2 sm:py-3 text-gr text-xl tracking-wider"
                  placeholder="user@email.com"
                  disabled
                />
              </div>
              <div>
                <label className="block font-bold text-base sm:text-lg mb-1 font-dmmono tracking-wider">
                  Reset Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full rounded-lg bg-gray-200 px-3 sm:px-4 py-2 sm:py-3 font-worksans text-xl tracking-wider"
                    placeholder="New password"
                  />
                  <span
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? (
                      <FaEye size={15} />
                    ) : (
                      <FaEyeSlash size={15} />
                    )}
                  </span>
                </div>
              </div>
              <div>
                <label className="block font-bold text-base sm:text-lg mb-1 font-dmmono tracking-wider">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="w-full rounded-lg bg-gray-200 px-3 sm:px-4 py-2 sm:py-3 font-worksans text-xl tracking-wider"
                    placeholder="Confirm password"
                  />
                  <span
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                  >
                    {showConfirmPassword ? (
                      <FaEye size={15} />
                    ) : (
                      <FaEyeSlash size={15} />
                    )}
                  </span>
                </div>
              </div>
              <button
                type="submit"
                className="w-full mt-4 bg-[#D946EF] text-white font-bold py-2 sm:py-3 rounded-lg text-base sm:text-lg tracking-wider cursor-pointer"
              >
                Login
              </button>
            </>
          ) : (
            <>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block font-bold text-base sm:text-lg mb-1 font-dmmono tracking-wider">
                    First Name
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg bg-gray-200 px-3 sm:px-4 py-2 sm:py-3 font-worksans text-xl tracking-wider"
                    placeholder="First name"
                  />
                </div>
                <div className="flex-1">
                  <label className="block font-bold text-base sm:text-lg mb-1 font-dmmono tracking-wider">
                    Last Name
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg bg-gray-200 px-3 sm:px-4 py-2 sm:py-3 font-worksans text-xl tracking-wider"
                    placeholder="Last Name"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-base sm:text-lg mb-1 font-dmmono tracking-wider">
                  Phone Number
                </label>
                <input
                  type="tel"
                  className="w-full rounded-lg bg-gray-200 px-3 sm:px-4 py-2 sm:py-3 font-worksans text-xl tracking-wider"
                  placeholder="Number"
                />
              </div>
              <div>
                <label className="block font-bold text-base sm:text-lg mb-1 font-dmmono tracking-wider">
                  Reset Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full rounded-lg bg-gray-200 px-3 sm:px-4 py-2 sm:py-3 font-worksans text-xl tracking-wider"
                    placeholder="New password"
                  />
                  <span
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? (
                      <FaEye size={15} />
                    ) : (
                      <FaEyeSlash size={15} />
                    )}
                  </span>
                </div>
              </div>
              <div>
                <label className="block font-bold text-base sm:text-lg mb-1 font-dmmono tracking-wider">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="w-full rounded-lg bg-gray-200 px-3 sm:px-4 py-2 sm:py-3 font-worksans text-xl tracking-wider"
                    placeholder="Confirm password"
                  />
                  <span
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                  >
                    {showConfirmPassword ? (
                      <FaEye size={15} />
                    ) : (
                      <FaEyeSlash size={15} />
                    )}
                  </span>
                </div>
              </div>
              <button
                type="submit"
                className="w-full mt-4 bg-[#D946EF] text-white font-bold py-2 sm:py-3 rounded-lg text-base sm:text-lg tracking-wider cursor-pointer"
              >
                Sign Up
              </button>
            </>
          )}
        </form>
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl cursor-pointer"
          onClick={() => onOpenChange(false)}
          aria-label="Close"
        >
          &times;
        </button>
      </div>
    </div>
  );
};
