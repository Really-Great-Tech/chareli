/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import type { FieldProps, FormikHelpers } from "formik";
import * as Yup from "yup";
import {
  useForgotPassword,
  useForgotPasswordPhone,
} from "../../backend/auth.service";
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
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import "../../styles/phone-input.css";
import { ResetPasswordOTPModal } from "./ResetPasswordOTPModal";

interface ForgotPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  openLoginModal: () => void;
}

// Validation schemas
const emailValidationSchema = Yup.object({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
});

const phoneValidationSchema = Yup.object({
  phoneNumber: Yup.string().required("Phone number is required"),
});

interface FormValues {
  email: string | undefined;
  phoneNumber: string | undefined;
}

// Initial values
const getInitialValues = (isEmailTab = true): FormValues => ({
  email: isEmailTab ? "" : undefined,
  phoneNumber: isEmailTab ? undefined : "",
});

export function ForgotPasswordModal({
  open,
  onOpenChange,
  openLoginModal,
}: ForgotPasswordModalProps) {
  const [activeTab, setActiveTab] = useState<"email" | "phone">("email");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedContact, setSubmittedContact] = useState("");
  const [isOTPVerificationModalOpen, setIsOTPVerificationModalOpen] =
    useState(false);
  const [userId, setUserId] = useState("");
  const forgotPassword = useForgotPassword();
  const forgotPasswordPhone = useForgotPasswordPhone();

  const handleSubmit = async (
    values: FormValues,
    actions: FormikHelpers<FormValues>
  ) => {
    try {
      if (activeTab === "email") {
        try {
          await forgotPassword.mutateAsync(values.email!);
        } catch (error) {
          console.log(error);
        }
        setSubmittedContact(values.email!);
        setIsSubmitted(true);
        toast.success(
          "If your email exists in our system, you will receive password reset instructions"
        );
      } else {
        try {
          const response = await forgotPasswordPhone.mutateAsync(
            values.phoneNumber!
          );
          setSubmittedContact(values.phoneNumber!);

          if (response.data?.userId) {
            // Valid phone number - show OTP verification
            setUserId(response.data.userId);
            onOpenChange(false);
            setIsOTPVerificationModalOpen(true);
            setIsSubmitted(false); // Ensure submitted state is false to show the form
            toast.success("Reset code sent to your phone number");
          } else {
            // Invalid phone number - show generic message
            setIsSubmitted(true);
            toast.success(
              "If your phone number exists in our system, you will receive a reset code shortly"
            );
          }
        } catch (error) {
          toast.error("An error occurred. Please try again later.");
          setIsSubmitted(true); // Show the error state
        }
      }
    } finally {
      actions.setSubmitting(false);
    }
  };

  const navigate = useNavigate();

  const handleVerificationSuccess = () => {
    setIsOTPVerificationModalOpen(false);
    onOpenChange(false);
    navigate(`/reset-password/phone/${userId}`);
    toast.success(
      "OTP verified successfully. You can now reset your password."
    );
  };

  const handleBackToLogin = () => {
    onOpenChange(false);
    openLoginModal();
  };

  const resetForm = () => {
    setIsSubmitted(false);
    setSubmittedContact("");
    setUserId("");
  };

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open]);

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
          <DialogTitle className="text-2xl font-bold text-[#E328AF] text-center font-dmmono">
            {isSubmitted
              ? activeTab === "email"
                ? "Check Your Email"
                : "Password Reset"
              : "Forgot Password"}
          </DialogTitle>
          <div className="flex font-dmmono text-xl tracking-wide">
            <div className="px-6 flex w-full border-b">
              <button
                className={`flex-1 py-2 font-semibold ${
                  activeTab === "email"
                    ? "text-[#E328AF] border-b-2 border-[#E328AF]"
                    : "text-gray-500"
                }`}
                onClick={() => {
                  setActiveTab("email");
                  resetForm(); // Reset form state when switching tabs
                }}
              >
                Email
              </button>
              <button
                className={`flex-1 py-2 font-semibold ${
                  activeTab === "phone"
                    ? "text-[#E328AF] border-b-2 border-[#E328AF]"
                    : "text-gray-500"
                }`}
                onClick={() => {
                  setActiveTab("phone");
                  resetForm(); // Reset form state when switching tabs
                }}
              >
                Phone Number
              </button>
            </div>
          </div>
          <DialogDescription className="text-center">
            {(isSubmitted && !isOTPVerificationModalOpen) ||
            (activeTab === "email" && isSubmitted) ? (
              <div className="space-y-4">
                <p className=" text-center text-black dark:text-white font-worksans text-xl tracking-wider">
                  We've sent{" "}
                  {activeTab === "email"
                    ? "password reset instructions"
                    : "a reset code"}{" "}
                  to:
                  <p className="text-md font-semibold text-center text-black dark:text-white mt-2">
                    {submittedContact}
                  </p>
                  <p className=" text-center text-black dark:text-white font-worksans text-[18px] tracking-wider mt-2">
                    {activeTab === "email"
                      ? "Check your email to reset your password."
                      : "Reset code will be sent if the number is registered."}
                  </p>
                </p>
                <div className="flex flex-col space-y-2 mt-4">
                  <Button
                    type="button"
                    onClick={resetForm}
                    className="w-full bg-[#D946EF] hover:bg-[#C026D3] text-white font-dmmono"
                  >
                    {activeTab === "email"
                      ? "Try Another Email"
                      : "Try Another Number"}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleBackToLogin}
                    className="w-full bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-700 font-dmmono"
                  >
                    Back to Login
                  </Button>
                </div>
              </div>
            ) : (
              <Formik
                initialValues={getInitialValues(activeTab === "email")}
                validationSchema={
                  activeTab === "email"
                    ? emailValidationSchema
                    : phoneValidationSchema
                }
                onSubmit={handleSubmit}
                enableReinitialize
              >
                {({ isSubmitting }) => (
                  <Form className="space-y-6">
                    <p className="text-center text-black dark:text-white font-worksans text-[15px] tracking-wider my-4">
                      {activeTab === "email"
                        ? "Enter your email to reset your password."
                        : "Enter your phone number to reset your password."}
                    </p>
                    <div className="relative">
                      <Label
                        htmlFor={
                          activeTab === "email" ? "email" : "phoneNumber"
                        }
                        className="font-dmmono text-base text-black dark:text-white"
                      >
                        {activeTab === "email" ? "Email" : "Phone Number"}
                      </Label>
                      <div className="relative">
                        {activeTab === "email" ? (
                          <>
                            <AiOutlineMail
                              size={15}
                              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 z-10"
                            />
                            <Field
                              as={Input}
                              id="email"
                              name="email"
                              placeholder="email"
                              className="mt-1 bg-[#E2E8F0] dark:bg-[#191c2b] border-0 pl-10 font-worksans text-xl tracking-wider text-[11px] font-normal h-[48px]"
                            />
                          </>
                        ) : (
                          <Field name="phoneNumber">
                            {({ field, form }: FieldProps) => (
                              <PhoneInput
                                country={"us"}
                                value={field.value}
                                onChange={(value) =>
                                  form.setFieldValue("phoneNumber", `+${value}`)
                                }
                                inputStyle={{
                                  width: "100%",
                                  height: "48px",
                                  backgroundColor: "#E2E8F0",
                                  border: "0",
                                  borderRadius: "0.375rem",
                                  fontFamily: "pincuk",
                                  fontSize: "11px",
                                }}
                                containerClass="dark:bg-[#191c2b]"
                                buttonStyle={{
                                  backgroundColor: "#E2E8F0",
                                  border: "0",
                                  borderRadius: "0.375rem 0 0 0.375rem",
                                }}
                                dropdownStyle={{
                                  backgroundColor: "#E2E8F0",
                                  color: "#000",
                                }}
                                searchStyle={{
                                  backgroundColor: "#E2E8F0",
                                  color: "#000",
                                }}
                                enableAreaCodeStretch
                                autoFormat
                                enableSearch
                                disableSearchIcon
                                autocompleteSearch
                                countryCodeEditable={false}
                              />
                            )}
                          </Field>
                        )}
                      </div>
                      <ErrorMessage
                        name={activeTab === "email" ? "email" : "phoneNumber"}
                        component="div"
                        className="text-red-500 mt-1 font-worksans text-xl tracking-wider"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-[#D946EF] hover:bg-[#C026D3] text-white font-dmmono cursor-pointer"
                    >
                      {isSubmitting ? "Sending..." : "Send Reset Instructions"}
                    </Button>
                    <Button
                      type="button"
                      onClick={handleBackToLogin}
                      className="w-full bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-700 font-dmmono cursor-pointer"
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

      <ResetPasswordOTPModal
        open={isOTPVerificationModalOpen}
        onOpenChange={setIsOTPVerificationModalOpen}
        userId={userId}
        contactMethod={submittedContact}
        onVerificationSuccess={handleVerificationSuccess}
      />
    </Dialog>
  );
}
