import { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import type { FormikHelpers } from "formik";
import * as Yup from "yup";
import { useForgotPassword } from "../../backend/auth.service";
import { toast } from "sonner";
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
import { AiOutlineMail } from "react-icons/ai";

interface ForgotPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  openLoginModal: () => void;
}

// Validation schema
const validationSchema = Yup.object({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
});

// Initial values
const initialValues = {
  email: "",
};

export function ForgotPasswordModal({
  open,
  onOpenChange,
  openLoginModal,
}: ForgotPasswordModalProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const forgotPassword = useForgotPassword();

  const handleSubmit = async (
    values: typeof initialValues,
    actions: FormikHelpers<typeof initialValues>
  ) => {
    try {
      await forgotPassword.mutateAsync(values.email);
      setSubmittedEmail(values.email);
      setIsSubmitted(true);
      toast.success("Password reset instructions sent to your email");
    } catch (error: any) {
      console.error("Forgot password error:", error);
      // We don't show specific errors to prevent email enumeration
      toast.success("If your email exists in our system, you will receive password reset instructions");
      setSubmittedEmail(values.email);
      setIsSubmitted(true);
    } finally {
      actions.setSubmitting(false);
    }
  };

  const handleBackToLogin = () => {
    onOpenChange(false);
    openLoginModal();
  };

  const resetForm = () => {
    setIsSubmitted(false);
    setSubmittedEmail("");
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          resetForm();
        }
        onOpenChange(newOpen);
      }}
    >
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
            {isSubmitted ? "Check Your Email" : "Forgot Password"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isSubmitted ? (
              <div className="space-y-4">
                <p className="text-sm text-center text-black dark:text-white font-pincuk">
                  We've sent password reset instructions to:
                </p>
                <p className="text-md font-semibold text-center text-black dark:text-white">
                  {submittedEmail}
                </p>
                <p className="text-sm text-center text-black dark:text-white font-pincuk">
                  Please check your email and follow the instructions to reset your password.
                </p>
                <div className="flex flex-col space-y-2 mt-4">
                  <Button
                    type="button"
                    onClick={resetForm}
                    className="w-full bg-[#D946EF] hover:bg-[#C026D3] text-white font-boogaloo"
                  >
                    Try Another Email
                  </Button>
                  <Button
                    type="button"
                    onClick={handleBackToLogin}
                    className="w-full bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-700 font-boogaloo"
                  >
                    Back to Login
                  </Button>
                </div>
              </div>
            ) : (
              <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
              >
                {({ isSubmitting }) => (
                  <Form className="space-y-4">
                    <p className="text-sm text-center text-black dark:text-white font-pincuk mb-4">
                      Enter your email address and we'll send you instructions to reset your password.
                    </p>
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
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-[#D946EF] hover:bg-[#C026D3] text-white font-boogaloo"
                    >
                      {isSubmitting ? "Sending..." : "Send Reset Instructions"}
                    </Button>
                    <Button
                      type="button"
                      onClick={handleBackToLogin}
                      className="w-full bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-700 font-boogaloo"
                    >
                      Back to Login
                    </Button>
                  </Form>
                )}
              </Formik>
            )}
          </DialogDescription>
        </DialogHeader>
      </CustomDialogContent>
    </Dialog>
  );
}
