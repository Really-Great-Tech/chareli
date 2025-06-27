/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import type { FieldProps, FormikHelpers } from "formik";
import type { LoginCredentials } from "../../backend/types";
import * as Yup from "yup";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";
import { ForgotPasswordModal } from "./ForgotPasswordModal";
import { Dialog, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { CustomDialogContent } from "../ui/custom-dialog-content";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { AiOutlineMail } from "react-icons/ai";
import { OTPVerificationModal } from "./OTPVerificationModal";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import "../../styles/phone-input.css";
import { useNavigate } from "react-router-dom";
import { isValidRole } from "../../utils/main";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  openSignUpModal: () => void;
  defaultEmail?: string;
  hideSignUpLink?: boolean;
}

interface LoginFormValues {
  email?: string;
  phoneNumber?: string;
  password: string;
}

interface LoginResponse {
  success?: boolean;
  userId: string;
  hasEmail: boolean;
  hasPhone: boolean;
  phoneNumber?: string;
  email?: string;
  requiresOtp: boolean;
  role: string;
  otpType?: "EMAIL" | "SMS" | "NONE";
  message: string;
  tokens?: {
    accessToken: string;
    refreshToken: string;
  };
  debug?: {
    error: string;
    type: string;
    timestamp: string;
  };
}

const emailValidationSchema = Yup.object({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  password: Yup.string().required("Password is required"),
});

const phoneValidationSchema = Yup.object({
  phoneNumber: Yup.string().required("Phone number is required"),
  password: Yup.string().required("Password is required"),
});

const getInitialValues = (
  defaultEmail?: string,
  isEmailTab = true
): LoginFormValues => ({
  email: isEmailTab ? defaultEmail || "" : undefined,
  phoneNumber: isEmailTab ? undefined : "",
  password: "",
});

export function LoginModal({
  open,
  onOpenChange,
  openSignUpModal,
  defaultEmail,
  hideSignUpLink = false,
}: LoginDialogProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [loginResponse, setLoginResponse] = useState<LoginResponse | null>(
    null
  );
  const [isOTPVerificationModalOpen, setIsOTPVerificationModalOpen] =
    useState(false);
  const [loginError, setLoginError] = useState("");
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] =
    useState(false);
  const [activeTab, setActiveTab] = useState<"email" | "phone">("email");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  // Clear error message when switching tabs
  useEffect(() => {
    setLoginError("");
  }, [activeTab]);

  // Clear error message when modal is opened/closed
  useEffect(() => {
    if (!open) {
      setLoginError("");
    }
  }, [open]);

  const handleLogin = async (
    values: LoginFormValues,
    actions: FormikHelpers<LoginFormValues>
  ) => {
    try {
      setLoginError("");
      setIsLoggingIn(true);
      const credentials: LoginCredentials = {
        identifier: activeTab === "email" ? values.email! : values.phoneNumber!,
        password: values.password,
      };

      const response: LoginResponse = await login(credentials);
      setLoginResponse(response);
      setLoginError("");

      // Check if login failed due to configuration or service issues
      if (response.success === false) {
        // Handle structured error responses
        setLoginError(response.message);
        toast.error(response.message);

        // Log debug info for developers (only in development)
        if (response.debug && process.env.NODE_ENV !== "production") {
          console.error("Login Debug Info:", response.debug);
        }

        setIsLoggingIn(false);
        return;
      }

      if (response.requiresOtp) {
        setIsOTPVerificationModalOpen(true);
        onOpenChange(false);
        toast.info(response.message);
        setIsLoggingIn(false);
      } else {
        // No OTP required, show success and redirect
        toast.success(response.message);
        if (isValidRole(response.role)) {
          navigate("/admin");
        } else {
          navigate("/");
        }
        onOpenChange(false);
        setIsLoggingIn(false);
      }
    } catch (error: any) {
      setIsLoggingIn(false);
      if (error.response?.data?.message) {
        setLoginError(error.response.data.message);
        toast.error(error.response.data.message);
      } else {
        const errorMsg =
          activeTab === "phone"
            ? "Invalid phone number or password. Please try again."
            : "Invalid email or password. Please try again.";
        setLoginError(errorMsg);
        toast.error(errorMsg);
      }
    } finally {
      actions.setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open && !isLoggingIn}
      onOpenChange={isLoggingIn ? () => {} : onOpenChange}
    >
      <CustomDialogContent className="sm:max-w-[425px] dark:bg-[#0F1221] p-0">
        {/* Custom Close Button */}
        <button
          className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-[#C026D3] flex items-center justify-center shadow-lg hover:bg-[#a21caf] transition-colors"
          onClick={() => onOpenChange(false)}
          aria-label="Close"
          style={{ border: "none" }}
        >
          <span className="text-white text-2xl font-bold">×</span>
        </button>
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl font-bold text-[#E328AF] text-center font-dmmono py-4">
            Login
          </DialogTitle>
          <div className="flex font-dmmono text-lg tracking-wide">
            <div className="px-6 flex w-full border-b">
              <button
                className={`flex-1 py-2 font-semibold ${
                  activeTab === "email"
                    ? "text-[#E328AF] border-b-2 border-[#E328AF]"
                    : "text-gray-500"
                }`}
                onClick={() => setActiveTab("email")}
              >
                Email
              </button>
              <button
                className={`flex-1 py-2 font-semibold ${
                  activeTab === "phone"
                    ? "text-[#E328AF] border-b-2 border-[#E328AF]"
                    : "text-gray-500"
                }`}
                onClick={() => setActiveTab("phone")}
              >
                Phone Number
              </button>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6">
          <Formik
            initialValues={getInitialValues(
              defaultEmail,
              activeTab === "email"
            )}
            validationSchema={
              activeTab === "email"
                ? emailValidationSchema
                : phoneValidationSchema
            }
            onSubmit={handleLogin}
            enableReinitialize
          >
            {({ isSubmitting }) => (
              <Form className="space-y-4">
                <div className="space-y-1">
                  <Label
                    htmlFor={activeTab === "email" ? "email" : "phoneNumber"}
                    className="font-dmmono text-base text-black dark:text-white"
                  >
                    {activeTab === "email" ? "Email" : "Phone Number"}
                  </Label>
                  <div className="relative">
                    {activeTab === "email" && (
                      <AiOutlineMail
                        size={15}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 z-10"
                      />
                    )}
                    {activeTab === "phone" ? (
                      <Field name="phoneNumber">
                        {({ field, form }: FieldProps) => (
                          <PhoneInput
                            country={"us"}
                            value={field.value}
                            onChange={(value) =>
                              form.setFieldValue("phoneNumber", `+${value}`)
                            }
                            inputProps={
                              {
                                // className: 'w-full rounded-md',
                              }
                            }
                            inputStyle={{
                              width: "100%",
                              height: "48px",
                              backgroundColor: "#E2E8F0",
                              border: "0",
                              borderRadius: "0.375rem",
                              fontFamily: "Work Sans, cursive",
                              fontSize: "11px",
                            }}
                            containerClass="dark:bg-[#191c2b] relative z-50"
                            buttonStyle={{
                              backgroundColor: "#E2E8F0",
                              border: "0",
                              borderRadius: "0.375rem 0 0 0.375rem",
                            }}
                            dropdownStyle={{
                              backgroundColor: "#E2E8F0",
                              color: "#000",
                              zIndex: 999,
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
                    ) : (
                      <Field
                        as={Input}
                        id={activeTab === "email" ? "email" : "phoneNumber"}
                        name={activeTab === "email" ? "email" : "phoneNumber"}
                        placeholder={
                          activeTab === "email"
                            ? "Enter your email"
                            : "Enter your phone number"
                        }
                        className={`mt-1 bg-[#E2E8F0] border-0 pl-10 font-dmmono text-sm tracking-wider font-normal h-[48px] ${
                          activeTab === "email" ? "pl-10" : ""
                        }`}
                      />
                    )}
                  </div>
                  <ErrorMessage
                    name={activeTab === "email" ? "email" : "phoneNumber"}
                    component="div"
                    className="text-red-500 mt-1 font-dmmono text-sm tracking-wider"
                  />
                </div>
                <div className="relative">
                  <Label
                    htmlFor="password"
                    className="font-dmmono text-base text-black dark:text-white"
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
                      className="mt-1 bg-[#E2E8F0] border-0 pl-10 font-dmmono text-sm tracking-wider font-normal h-[48px]"
                    />
                  </div>
                  <ErrorMessage
                    name="password"
                    component="div"
                    className="text-red-500  mt-1 font-dmmono text-sm tracking-wider"
                  />
                </div>
                {loginError && (
                  <div className="text-red-500 font-dmmono text-sm tracking-wider text-center">
                    {loginError}
                  </div>
                )}
                <div className="text-right">
                  <span
                    className="text-[#C026D3] cursor-pointer font-dmmono text-md hover:underline"
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
                  className="w-full bg-[#D946EF] hover:bg-[#C026D3] text-white font-dmmono"
                >
                  Login
                </Button>
                {!hideSignUpLink && (
                  <p className=" text-center text-black dark:text-white font-dmmono text-md tracking-wider">
                    Don't have an account?{" "}
                    <span
                      className="text-[#C026D3] cursor-pointer hover:underline text-lg font-dmmono"
                      onClick={openSignUpModal}
                    >
                      Sign Up
                    </span>
                  </p>
                )}
              </Form>
            )}
          </Formik>
        </div>
      </CustomDialogContent>
      <OTPVerificationModal
        open={isOTPVerificationModalOpen}
        onOpenChange={setIsOTPVerificationModalOpen}
        userId={loginResponse?.userId || ""}
        contactMethod={
          loginResponse?.otpType === "EMAIL"
            ? loginResponse?.email || "your registered email"
            : loginResponse?.otpType === "SMS"
            ? loginResponse?.phoneNumber || "your registered phone number"
            : "your registered contact method"
        }
        otpType={loginResponse?.otpType}
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
