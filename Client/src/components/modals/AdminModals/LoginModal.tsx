import React, { useState } from "react";

import { LuEye } from "react-icons/lu";
import { LuEyeOff } from "react-icons/lu";

import ResetPasswordModal from "./ResetPasswordModal";
import { useNavigate } from "react-router-dom";

interface AdminLoginModalProps {
  open: boolean;
  onClose: () => void;
  email?: string;
}

export default function LoginModal({ open, email }: AdminLoginModalProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  const navigate = useNavigate();

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement password reset logic
  };

  const handleHome = () => {
    // TODO: Implement home logic
    navigate("/admin");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <div className="bg-[#F1F5F9] rounded-2xl p-10 w-[420px] max-w-full shadow-none border border-[#E2E8F0] flex flex-col items-center relative">
        <h2 className="text-3xl font-bold text-[#D946EF] mb-6 underline underline-offset-4 text-center font-dmmono tracking-wider">
          Login
        </h2>
        <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <label className="block font-bold text-lg mb-1 font-dmmono tracking-wider">
              Email
            </label>
            <input
              type="email"
              className="w-full rounded-lg bg-[#E2E8F0] px-4 py-3 text-gray-500 font-worksans text-xl tracking-wider border border-[#CBD5E0]"
              placeholder="Email.com"
              value={email || ""}
              disabled
            />
          </div>
          <div>
            <label className="block font-bold text-lg mb-1 font-dmmono tracking-wider">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full rounded-lg bg-[#E2E8F0] px-4 py-3 font-worksans text-xl tracking-wider border border-[#CBD5E0]"
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  // Eye closed icon
                  <LuEyeOff className="w-6 h-6" />
                ) : (
                  // Eye open icon
                  <LuEye className="w-6 h-6" />
                )}
              </span>
            </div>
          </div>
          <button
            type="submit"
            className="w-full mt-4 bg-[#D946EF] text-white font-bold py-3 rounded-lg text-lg tracking-wider"
            onClick={handleHome}
          >
            Login
          </button>
          <div className="mt-2 text-[#D946EF]">
            <p
              className="text-2xl hover:underline cursor-pointer"
              onClick={() => setResetOpen(true)}
            >
              Reset Password
            </p>
          </div>
        </form>
      </div>
      <ResetPasswordModal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
      />
    </div>
  );
}
