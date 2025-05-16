import { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import type { FormikHelpers } from "formik";
import * as Yup from "yup";
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

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  openSignUpModal: () => void;
}

// Validation schema
const validationSchema = Yup.object({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

// Initial values
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
  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleLogin = (values: typeof initialValues, actions: FormikHelpers<typeof initialValues>) => {
    console.log("Login form values:", values);
    setIsOTPPlatformModalOpen(true);
    onOpenChange(false);
    actions.setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <CustomDialogContent className="sm:max-w-[425px] dark:bg-[#0F1221]">
        {/* Custom Close Button */}
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
          Don't have an account?{" "}
          <span
            className="underline text-[#C026D3] cursor-pointer"
            onClick={openSignUpModal}
          >
            Sign Up
          </span>
        </p>
      </CustomDialogContent>
      <OTPPlatformModal
        open={isOTPPlatformModalOpen}
        onOpenChange={setIsOTPPlatformModalOpen}
      />
    </Dialog>
  );
}
