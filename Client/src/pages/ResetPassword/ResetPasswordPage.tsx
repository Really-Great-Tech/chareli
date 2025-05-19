import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { passwordSchema, confirmPasswordSchema } from "../../validation/password";
import { useResetPassword } from "../../backend/auth.service";
import { backendService } from "../../backend/api.service";
import { BackendRoute } from "../../backend/constants";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { LoginModal } from "../../components/modals/LoginModal";

const validationSchema = Yup.object({
  password: passwordSchema,
  confirmPassword: confirmPasswordSchema,
});

const initialValues = {
  password: "",
  confirmPassword: "",
};

export function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [isTokenChecking, setIsTokenChecking] = useState(true); // Start with true to show loading state
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const resetPassword = useResetPassword();
  const navigate = useNavigate();

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  // Use a ref to track if we've already verified the token
  const hasVerifiedToken = useRef(false);


  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }

    if (!hasVerifiedToken.current) {
      hasVerifiedToken.current = true;
          
      const verifyTokenDirectly = async () => {
        try {
          // Add cache-busting parameter to prevent 304 responses
          const response = await backendService.get(`${BackendRoute.AUTH_RESET_PASSWORD}/${token}?_=${Date.now()}`);
          console.log("Token verification response:", response);
          
          setIsTokenValid(true);
          setIsTokenChecking(false);
        } catch (error) {
          setIsTokenValid(false);
          setIsTokenChecking(false);
          toast.error("Invalid or expired reset token");
        }
      };
      
      verifyTokenDirectly();
    }
  }, [token, navigate]);


  const handleSubmit = async (values: typeof initialValues) => {
    try {
      await resetPassword.mutateAsync({
        token: token || "",
        password: values.password,
        confirmPassword: values.confirmPassword,
      });
      setIsSuccess(true);
      toast.success("Password reset successful");
    } catch (error: any) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to reset password. Please try again.");
      }
    }
  };

  const openLoginModal = () => {
    setIsLoginModalOpen(true);
  };

  const requestNewResetLink = () => {
    navigate("/");
    // We need to wait a bit before opening the forgot password modal
    setTimeout(() => {
      const forgotPasswordButton = document.querySelector('[data-forgot-password-trigger]');
      if (forgotPasswordButton) {
        (forgotPasswordButton as HTMLElement).click();
      }
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200">
      <div className="bg-white dark:bg-[#0F1221] rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold mb-6 text-center text-[#E328AF] font-pong">
          {isSuccess ? "Password Reset Successful" : "Reset Your Password"}
        </h1>

        {isTokenChecking ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E328AF]"></div>
            <p className="mt-4 text-sm text-black dark:text-white font-pincuk">
              Verifying your reset token...
            </p>
          </div>
        ) : !isTokenValid ? (
          <div className="space-y-4 py-4">
            <p className="text-sm text-center text-black dark:text-white font-pincuk">
              The password reset link is invalid or has expired.
            </p>
            <p className="text-sm text-center text-black dark:text-white font-pincuk">
              Please request a new password reset link.
            </p>
            <div className="flex flex-col space-y-2 mt-4">
              <Button
                type="button"
                onClick={requestNewResetLink}
                className="w-full bg-[#D946EF] hover:bg-[#C026D3] text-white font-pong"
              >
                Request New Reset Link
              </Button>
              <Button
                type="button"
                onClick={() => navigate("/")}
                className="w-full bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-black dark:text-white border border-gray-300 dark:border-gray-700 font-pong"
              >
                Return to Home
              </Button>
            </div>
          </div>
        ) : isSuccess ? (
          <div className="space-y-4 py-4">
            <p className="text-sm text-center text-black dark:text-white font-pincuk">
              Your password has been reset successfully.
            </p>
            <p className="text-sm text-center text-black dark:text-white font-pincuk">
              You can now log in with your new password.
            </p>
            <div className="flex flex-col space-y-2 mt-4">
              <Button
                type="button"
                onClick={openLoginModal}
                className="w-full bg-[#D946EF] hover:bg-[#C026D3] text-white font-pong"
              >
                Log In
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
                  Enter your new password below.
                </p>
                <div className="relative">
                  <Label
                    htmlFor="password"
                    className="font-pong text-base text-black dark:text-white"
                  >
                    New Password
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
                      placeholder="New password"
                      className="mt-1 bg-[#E2E8F0] dark:bg-[#191c2b] border-0 pl-10 font-pincuk text-[11px] font-normal h-[48px]"
                    />
                  </div>
                  <ErrorMessage
                    name="password"
                    component="div"
                    className="text-red-500 text-xs mt-1 font-pincuk"
                  />
                </div>
                <div className="relative">
                  <Label
                    htmlFor="confirmPassword"
                    className="font-pong text-base text-black dark:text-white"
                  >
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={toggleConfirmPasswordVisibility}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 z-10"
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showConfirmPassword ? (
                        <FaEyeSlash size={15} />
                      ) : (
                        <FaEye size={15} />
                      )}
                    </button>
                    <Field
                      as={Input}
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm password"
                      className="mt-1 bg-[#E2E8F0] dark:bg-[#191c2b] border-0 pl-10 font-pincuk text-[11px] font-normal h-[48px]"
                    />
                  </div>
                  <ErrorMessage
                    name="confirmPassword"
                    component="div"
                    className="text-red-500 text-xs mt-1 font-pincuk"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#D946EF] hover:bg-[#C026D3] text-white font-pong"
                >
                  {isSubmitting ? "Resetting..." : "Reset Password"}
                </Button>
              </Form>
            )}
          </Formik>
        )}
      </div>

      <LoginModal
        open={isLoginModalOpen}
        onOpenChange={setIsLoginModalOpen}
        openSignUpModal={() => {
          setIsLoginModalOpen(false);
          navigate("/");
        }}
      />
    </div>
  );
}
