import React, { useState } from "react";
import { Button } from "../../ui/button";
import { IoIosArrowBack } from "react-icons/io";
import { OTPModal } from "./OTPModal";

interface ResetPasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ResetPasswordModal({
  open,
  onClose,
}: ResetPasswordModalProps) {
  const [email, setEmail] = useState("");
  const [oTPOpen, setOTPOpen] = useState(false);

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
        <h2 className="text-3xl font-bold text-[#D946EF] mb-8 underline underline-offset-4 text-center font-dmmono tracking-wider">
          Reset Password
        </h2>
        <form className="w-full flex flex-col gap-6" onSubmit={handleSubmit}>
          <div>
            <label className="block font-bold text-2xl mb-2 font-dmmono tracking-wider">
              Email
            </label>
            <input
              type="email"
              className="w-full rounded-lg bg-[#E2E8F0] px-4 py-3 text-gray-500 font-worksans text-xl tracking-wider  border border-[#CBD5E0]"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full mt-2 bg-[#D946EF] text-white py-3 rounded-xl text-lg tracking-wider"
            onClick={() => setOTPOpen(true)}
          >
            Send email
          </button>
        </form>
      </div>
      <OTPModal open={oTPOpen} onClose={() => setOTPOpen(false)} />
    </div>
  );
}
