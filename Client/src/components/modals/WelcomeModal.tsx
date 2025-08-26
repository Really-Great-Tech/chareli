import {
  Dialog,
} from "../ui/dialog";
import { CustomDialogContent } from "../ui/custom-dialog-content";
import { Button } from "../ui/button";

interface WelcomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: () => void;
}

export function WelcomeModal({ open, onOpenChange, onContinue }: WelcomeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <CustomDialogContent className="w-[95vw] sm:max-w-[800px] dark:bg-[#0F1221] border-0 shadow-2xl">
        <div className="relative p-4 sm:p-6">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#6A7282] via-[#6A7282] to-[#5A626F] rounded-t-lg"></div>
          
          {/* Background decorative circles */}
          <div className="absolute top-4 right-4 w-12 h-12 bg-gradient-to-br from-[#6A7282]/10 to-[#6A7282]/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-4 left-4 w-10 h-10 bg-gradient-to-br from-[#5A626F]/10 to-[#6A7282]/10 rounded-full blur-lg"></div>
          
          {/* Welcome Icon */}
          <div className="flex justify-center mb-3 sm:mb-4">
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#6A7282] to-[#6A7282] rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              {/* Outer ring */}
              <div className="absolute -inset-2 bg-gradient-to-br from-[#6A7282]/20 to-[#6A7282]/20 rounded-full animate-ping"></div>
            </div>
          </div>

          {/* Welcome Title */}
          <div className="text-center mb-3 sm:mb-5">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#6A7282] dark:text-white font-dmmono mb-1 sm:mb-2 tracking-wide">
              Welcome Aboard! 🎮
            </h2>
            <div className="w-20 sm:w-24 h-1 bg-gradient-to-r from-[#6A7282] to-[#6A7282] mx-auto rounded-full shadow-sm"></div>
          </div>

          {/* Welcome Message */}
          <div className="bg-gradient-to-br from-[#F8FAFC] to-[#E2E8F0] dark:from-[#1E293B] dark:to-[#334155] rounded-2xl p-4 sm:p-6 mb-3 sm:mb-5 border border-[#6A7282]/20 shadow-lg backdrop-blur-sm">
            <div className="flex items-start space-x-3 sm:space-x-4 mb-3 sm:mb-4">
              <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-[#6A7282] to-[#6A7282] rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-gray-700 dark:text-gray-200 font-dmmono leading-relaxed text-sm">
                  You will now be redirected to the login page. You will receive a{" "}
                  <span className="font-bold text-[#6A7282] bg-[#6A7282]/10 px-2 py-1 rounded">one-time password (OTP)</span>{" "}
                  on your phone to verify that you are a real gamer.
                </p>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-[#6A7282]/5 to-[#6A7282]/5 rounded-xl p-3 sm:p-4 border-l-4 border-[#6A7282] shadow-inner">
              <div className="flex items-start space-x-2 sm:space-x-3">
                <div className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 bg-[#6A7282] rounded-full flex items-center justify-center">
                  <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-300 font-dmmono text-xs leading-relaxed">
                    <span className="font-bold text-[#6A7282]">Good news:</span> This verification is only required for your first login.
                    After that, you can log in using your mobile number or email address with your password.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Gaming Elements */}
          <div className="flex justify-center items-center space-x-4 sm:space-x-6 mb-3 sm:mb-5">
            <div className="flex space-x-1 sm:space-x-2">
              <div className="w-2 h-2 bg-[#6A7282] rounded-full animate-pulse shadow-sm"></div>
              <div className="w-2 h-2 bg-[#6A7282] rounded-full animate-pulse shadow-sm" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-[#5A626F] rounded-full animate-pulse shadow-sm" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <div className="text-[#6A7282] font-dmmono text-xs">●●●</div>
            <div className="flex space-x-1 sm:space-x-2">
              <div className="w-2 h-2 bg-[#5A626F] rounded-full animate-pulse shadow-sm" style={{ animationDelay: '0.6s' }}></div>
              <div className="w-2 h-2 bg-[#6A7282] rounded-full animate-pulse shadow-sm" style={{ animationDelay: '0.8s' }}></div>
              <div className="w-2 h-2 bg-[#6A7282] rounded-full animate-pulse shadow-sm" style={{ animationDelay: '1s' }}></div>
            </div>
          </div>

          {/* Continue Button */}
          <div className="relative">
            <Button
              onClick={onContinue}
              className="w-full bg-gradient-to-r from-[#6A7282] to-[#6A7282] hover:from-[#5A626F] hover:to-[#5A626F] text-white font-dmmono py-3 text-base rounded-xl shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-xl border-0 relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center space-x-2 cursor-pointer">
                <span>Continue to Login</span>
                <span className="text-lg">🚀</span>
              </span>
              {/* Button shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </Button>
          </div>
        </div>
      </CustomDialogContent>
    </Dialog>
  );
}
