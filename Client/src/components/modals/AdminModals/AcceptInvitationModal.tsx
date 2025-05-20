import React, { useState } from "react";
import { FaEye, FaEyeSlash } from 'react-icons/fa';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <div className="bg-[#F1F5F9] rounded-2xl p-10 w-[420px] max-w-full shadow-none border border-[#E2E8F0] flex flex-col items-center">
        <h2 className="text-3xl font-bold text-[#D946EF] mb-6 underline underline-offset-4 text-center font-boogaloo">
          Accept Invitation
        </h2>
        <form className="w-full flex flex-col gap-4">
          {isExistingUser ? (
            <> 
              <div>
                <label className="block font-bold text-lg mb-1 font-boogaloo trackig-wider">Email</label>
                <input
                  type="email"
                  className="w-full rounded-lg bg-gray-200 px-4 py-3 text-gray-500 font-pincuk text-sm"
                  placeholder="user@email.com"
                  disabled
                />
              </div>
              <div>
                <label className="block font-bold text-lg mb-1 font-boogaloo trackig-wider">Reset Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full rounded-lg bg-gray-200 px-4 py-3 font-pincuk text-sm"
                    placeholder="New password"
                  />
                  <span
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? <FaEye size={15} /> : <FaEyeSlash size={15} />}
                  </span>
                </div>
              </div>
              <div>
                <label className="block font-bold text-lg mb-1 font-boogaloo trackig-wider">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="w-full rounded-lg bg-gray-200 px-4 py-3 font-pincuk text-sm"
                    placeholder="Confirm password"
                  />
                  <span
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                  >
                    {showConfirmPassword ? <FaEye size={15} /> : <FaEyeSlash size={15} />}
                  </span>
                </div>
              </div>
              <button
                type="submit"
                className="w-full mt-4 bg-[#D946EF] text-white font-bold py-3 rounded-lg text-lg tracking-wider"
              >
                Login
              </button>
            </>
          ) : (
            <>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block font-bold text-lg mb-1 font-boogaloo tracking-wider">First Name</label>
                  <input
                    type="text"
                    className="w-full rounded-lg bg-gray-200 px-4 py-3 font-pincuk text-sm"
                    placeholder="First name"
                  />
                </div>
                <div className="flex-1">
                  <label className="block font-bold text-lg mb-1 font-boogaloo tracking-wider">Last Name</label>
                  <input
                    type="text"
                    className="w-full rounded-lg bg-gray-200 px-4 py-3 font-pincuk text-sm"
                    placeholder="Last Name"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-lg mb-1 font-boogaloo tracking-wider">Phone Number</label>
                <input
                  type="tel"
                  className="w-full rounded-lg bg-gray-200 px-4 py-3 font-pincuk text-sm"
                  placeholder="Number"
                />
              </div>
              <div>
                <label className="block font-bold text-lg mb-1 font-boogaloo tracking-wider">Reset Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full rounded-lg bg-gray-200 px-4 py-3 font-pincuk text-sm"
                    placeholder="New password"
                  />
                  <span
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? <FaEye size={15} /> : <FaEyeSlash size={15} />}
                  </span>
                </div>
              </div>
              <div>
                <label className="block font-bold text-lg mb-1 font-boogaloo tracking-wider">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="w-full rounded-lg bg-gray-200 px-4 py-3 font-pincuk text-sm"
                    placeholder="Confirm password"
                  />
                  <span
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                  >
                    {showConfirmPassword ? <FaEye size={15} /> : <FaEyeSlash size={15} />}
                  </span>
                </div>
              </div>
              <button
                type="submit"
                className="w-full mt-4 bg-[#D946EF] text-white font-bold py-3 rounded-lg text-lg tracking-wider"
              >
                Sign Up
              </button>
            </>
          )}
        </form>
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
          onClick={() => onOpenChange(false)}
          aria-label="Close"
        >
          &times;
        </button>
      </div>
    </div>
  );
};