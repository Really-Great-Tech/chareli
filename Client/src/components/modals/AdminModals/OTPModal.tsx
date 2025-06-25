import React, { useState } from "react";
import { Button } from "../../ui/button";
import { IoIosArrowBack } from "react-icons/io";
import OTPInput from "react-otp-input";
import CreateNewPassModal from "./CreateNewPassModal";

interface OTPModalProps {
  open: boolean;
  onClose: () => void;
}

export function OTPModal({ open, onClose }: OTPModalProps) {
  const [otp, setOtp] = useState("235");
  const [newPassOpen, setNewPassOpen] = useState(false);

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

      <div className="bg-white rounded-2xl p-10 w-[500px] max-w-full shadow-none border border-none flex flex-col items-center relative">
        <form
          className="w-full flex flex-col gap-6 justify-start"
          onSubmit={handleSubmit}
        >
          <div>
            <label className="block text-3xl mb-2 font-dmmono tracking-wider">
              Verify Account
            </label>
            <p className="font-worksans text-lg tracking-wider mb-8">
              Enter the verification code we just sent via email
            </p>
            <div className="flex justify-start">
              <OTPInput
                value={otp}
                onChange={setOtp}
                numInputs={6}
                renderInput={(props, idx) => {
                  const isFilled = !!otp[idx];
                  return (
                    <div className="px-2 py-0 border-1 border-[#E328AF] mx-4 rounded">
                      <input
                        {...props}
                        readOnly={isFilled}
                        className="w-12 h-12 text-center bg-transparent rounded-none dark:text-white text-black font-dmmono text-xl font-bold mx-1 focus:outline-none focus:ring-0"
                      />
                    </div>
                  );
                }}
                inputType="tel"
                shouldAutoFocus
                placeholder=""
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full mt-2 bg-[#D946EF] text-white py-3 rounded-xl text-lg tracking-wider"
            onClick={() => setNewPassOpen(true)}
          >
            Verify
          </button>
        </form>
        <div className="flex mt-4 items-center gap-2">
          <p className="font-worksans text-lg tracking-wider">
            Didn't recieve a code?
          </p>
          <p className="text-[#D946EF] hover:underline">Resend</p>
        </div>
      </div>
      <CreateNewPassModal
        open={newPassOpen}
        onClose={() => setNewPassOpen(false)}
      />
    </div>
  );
}
