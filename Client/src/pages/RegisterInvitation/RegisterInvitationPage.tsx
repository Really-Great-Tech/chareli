import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useVerifyInvitation } from "../../backend/teams.service";
import { ResetPasswordForm } from "./ResetPasswordForm";
import { RegisterForm } from "./RegisterForm";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import { LoginModal } from "../../components/modals/LoginModal";

export function RegisterInvitationPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useVerifyInvitation(token || "");
  const [isLoginModalOpen, setIsLoginModalOpen] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  console.log(data);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#0F1621]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            Verifying invitation...
          </p>
        </div>
      </div>
    );
  }

  if (!(data as any)?.email) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#0F1621]">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-[#121C2D] rounded-lg shadow-lg p-8 text-center">
            <h1 className="text-2xl font-dmmono mb-4">Invalid Invitation</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              This invitation link is invalid or has expired.
            </p>
            <Button
              onClick={() => navigate("/")}
              className="bg-[#D946EF] dark:text-white hover:text-[#D946EF] hover:bg-[#F3E8FF]"
            >
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#0F1621] p-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-[#121C2D] rounded-lg shadow-lg p-8">
            <h1 className="text-xl font-dmmono text-center mb-8">
              {(data as any)?.userExists
                ? "Reset Password"
                : "Complete Registration"}
            </h1>

            {isSuccess ? (
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {(data as any)?.userExists
                    ? "Your password has been reset successfully."
                    : "Your account has been created successfully."}
                </p>
                <div className="space-y-4">
                  <Button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="w-full bg-[#D946EF] dark:text-white hover:text-[#D946EF] hover:bg-[#F3E8FF]"
                  >
                    Log In Now
                  </Button>
                  <Button
                    onClick={() => navigate("/")}
                    variant="outline"
                    className="w-full"
                  >
                    Return to Home
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {(data as any)?.userExists ? (
                  <ResetPasswordForm
                    email={(data as any)?.email || ""}
                    token={token || ""}
                    onSuccess={() => {
                      toast.success(
                        "Password reset successful. Please log in."
                      );
                      setIsSuccess(true);
                      setIsLoginModalOpen(true);
                    }}
                  />
                ) : (
                  <RegisterForm
                    email={(data as any)?.email || ""}
                    token={token || ""}
                    onSuccess={() => {
                      toast.success("Registration successful. Please log in.");
                      setIsSuccess(true);
                      setIsLoginModalOpen(true);
                    }}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <LoginModal
        open={isLoginModalOpen}
        onOpenChange={setIsLoginModalOpen}
        openSignUpModal={() => {}} // Not needed since we're in the registration flow
        defaultEmail={(data as any)?.email || ""}
        hideSignUpLink={true}
      />
    </>
  );
}
