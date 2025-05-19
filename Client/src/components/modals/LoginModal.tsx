import { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import type { FormikHelpers } from "formik";
import * as Yup from "yup";
import { useAuth } from "../../context/AuthContext";
// import { useRequestOtp } from "../../backend/auth.service";
import { toast } from "sonner";
import { ForgotPasswordModal } from "./ForgotPasswordModal";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { CustomDialogContent } from "../ui/custom-dialog-content";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { AiOutlineMail } from "react-icons/ai";
import { OTPPlatformModal } from "./OTPPlatformModal";
import { OTPVerificationModal } from "./OTPVerificationModal";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  openSignUpModal: () => void;
}

const validationSchema = Yup.object({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  password: Yup.string().required("Password is required"),
});


const initialValues = {
  email: "",
  password: "",
};

export function LoginModal({
  open,
  onOpenChange,
  openSignUpModal,
}: LoginDialogProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isOTPPlatformModalOpen, setIsOTPPlatformModalOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [hasBothContactMethods, setHasBothContactMethods] = useState(false);
  const [isOTPVerificationModalOpen, setIsOTPVerificationModalOpen] = useState(false);
  const [selectedOtpType, setSelectedOtpType] = useState<'EMAIL' | 'SMS'>('EMAIL');
  const [loginError, setLoginError] = useState("");
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);
  const { login } = useAuth();
  // const requestOtp = useRequestOtp();
  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleLogin = async (values: typeof initialValues, actions: FormikHelpers<typeof initialValues>) => {
    try {
      setLoginError("");
      const response = await login(values.email, values.password);
      const { userId, hasEmail, hasPhone, phoneNumber, email: userEmail } = response;
      
      setUserId(userId);
      setUserEmail(userEmail || values.email);
      setUserPhone(phoneNumber || '');
      setHasBothContactMethods(hasEmail && hasPhone);
      
      // Determine the OTP type based on available contact methods
      if (!hasEmail && hasPhone) {
        setSelectedOtpType('SMS');
      } else {
        setSelectedOtpType('EMAIL');
      }
      
      if (hasEmail && hasPhone) {
        setIsOTPPlatformModalOpen(true);
      } else {
        setIsOTPVerificationModalOpen(true);
      }
  
      onOpenChange(false);
    } catch (error: any) {

      if (error.response?.data?.message) {
        setLoginError(error.response.data.message);
        toast.error(error.response.data.message);
      } else {
        setLoginError("Invalid email or password. Please try again.");
        toast.error("Invalid email or password. Please try again.");
      }
    } finally {
      actions.setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <CustomDialogContent className="sm:max-w-[425px] dark:bg-[#0F1221]">
        <button
          className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-[#C026D3] flex items-center justify-center shadow-lg hover:bg-[#a21caf] transition-colors"
          onClick={() => onOpenChange(false)}
          aria-label="Close"
          style={{ border: "none" }}
        >
          <span className="text-white text-2xl font-bold">×</span>
        </button>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#E328AF] text-center font-boogaloo">
            Login
          </DialogTitle>
          <DialogDescription className="text-center">
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleLogin}
            >
              {({ isSubmitting }) => (
                <Form className="space-y-4">
                  <div className="relative">
                    <Label
                      htmlFor="email"
                      className="font-boogaloo text-base text-black dark:text-white"
                    >
                      Email
                    </Label>
                    <div className="relative">
                      <AiOutlineMail
                        size={15}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 z-10"
                      />
                      <Field
                        as={Input}
                        id="email"
                        name="email"
                        placeholder="email"
                        className="mt-1 bg-[#E2E8F0] dark:bg-[#191c2b] border-0 pl-10 font-pincuk text-[11px] font-normal h-[48px]"
                      />
                    </div>
                    <ErrorMessage
                      name="email"
                      component="div"
                      className="text-red-500 text-xs mt-1 font-pincuk"
                    />
                  </div>
                  <div className="relative">
                    <Label
                      htmlFor="password"
                      className="font-boogaloo text-base text-black dark:text-white"
                    >
                      Password
                    </Label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 z-10"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <FaEyeSlash size={15} />
                        ) : (
                          <FaEye size={15} />
                        )}
                      </button>
                      <Field
                        as={Input}
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="password"
                        className="mt-1 bg-[#E2E8F0] dark:bg-[#191c2b] border-0 pl-10 pr-10 font-pincuk text-[11px] font-normal h-[48px]"
                      />
                    </div>
                    <ErrorMessage
                      name="password"
                      component="div"
                      className="text-red-500 text-xs mt-1 font-pincuk"
                    />
                  </div>
                  {loginError && (
                    <div className="text-red-500 text-xs font-pincuk text-center">
                      {loginError}
                    </div>
                  )}
                  <div className="text-right">
                    <span
                      className="text-xs text-[#C026D3] cursor-pointer font-pincuk"
                      onClick={() => {
                        onOpenChange(false);
                        setIsForgotPasswordModalOpen(true);
                      }}
                      data-forgot-password-trigger
                    >
                      Forgot Password?
                    </span>
                  </div>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#D946EF] hover:bg-[#C026D3] text-white font-boogaloo"
                  >
                    Login
                  </Button>
                </Form>
              )}
            </Formik>
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-center text-black dark:text-white font-pincuk">
          Don't have an account?
          <span
            className="underline text-[#C026D3] cursor-pointer"
            onClick={openSignUpModal}
          >
            Sign Up
          </span>
        </p>
      </CustomDialogContent>
      {/* Show OTPPlatformModal if user has both email and phone */}
      <OTPPlatformModal
        open={isOTPPlatformModalOpen}
        onOpenChange={setIsOTPPlatformModalOpen}
        userId={userId}
        email={userEmail}
        phone={userPhone}
      />
      
      <OTPVerificationModal
        open={isOTPVerificationModalOpen}
        onOpenChange={setIsOTPVerificationModalOpen}
        userId={userId}
        contactMethod={selectedOtpType === 'EMAIL' ? userEmail : userPhone}
        otpType={selectedOtpType}
      />
      
      <ForgotPasswordModal
        open={isForgotPasswordModalOpen}
        onOpenChange={setIsForgotPasswordModalOpen}
        openLoginModal={() => {
          setIsForgotPasswordModalOpen(false);
          onOpenChange(true);
        }}
      />
    </Dialog>
  );
}
