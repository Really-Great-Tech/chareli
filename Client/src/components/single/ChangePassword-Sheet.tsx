import { useState } from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "../ui/sheet";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { useChangePassword } from "../../backend/user.service";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";
import { passwordSchema } from "../../validation/password";

interface ChangePasswordSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ChangePasswordValues {
  oldPassword: string;
  newPassword: string;
}

const validationSchema = Yup.object({
  oldPassword: Yup.string().required("Old password is required"),
  newPassword: passwordSchema
});

const initialValues: ChangePasswordValues = {
  oldPassword: "",
  newPassword: ""
};

export function ChangePasswordSheet({ open, onOpenChange }: ChangePasswordSheetProps) {
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const changePassword = useChangePassword();
  const { user } = useAuth();

  const handleSubmit = async (values: ChangePasswordValues) => {
    try {
      if (!user?.id) {
        toast.error("User ID not found");
        return;
      }

      await changePassword.mutateAsync({
        password: values.newPassword,
        oldPassword: values.oldPassword
      });
      toast.success("Password changed successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to change password. Please check your old password.");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="max-w-md w-full p-6 font-boogaloo dark:bg-[#0F1621]">
        <SheetHeader>
          <SheetTitle className="text-lg mt-4 tracking-wider border-b">Change Password</SheetTitle>
        </SheetHeader>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, isSubmitting }) => (
            <Form className="space-y-6">
              <div className="flex flex-col gap-6 px-2">
                <div>
                  <Label htmlFor="oldPassword" className="text-base mb-1">
                    Old Password
                  </Label>
                  <div className="relative">
                    <Field
                      as={Input}
                      id="oldPassword"
                      name="oldPassword"
                      type={showOldPassword ? "text" : "password"}
                      placeholder="Enter old password"
                      className="bg-[#F1F5F9] mt-1 text-sm font-pincuk dark:bg-[#121C2D] dark:text-white h-14 shadow-none pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500"
                      tabIndex={-1}
                    >
                      {showOldPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  {errors.oldPassword && touched.oldPassword && (
                    <p className="text-red-500 text-xs mt-1">{errors.oldPassword}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="newPassword" className="text-base mb-1">
                    New Password
                  </Label>
                  <div className="relative">
                    <Field
                      as={Input}
                      id="newPassword"
                      name="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      className="bg-[#F1F5F9] mt-1 text-sm font-pincuk dark:bg-[#121C2D] dark:text-white h-14 shadow-none pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-white"
                      tabIndex={-1}
                    >
                      {showNewPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  {errors.newPassword && touched.newPassword && (
                    <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>
                  )}
                </div>
              </div>
              <SheetFooter className="flex flex-row justify-end mt-8 gap-4">
                <SheetClose asChild>
                  <Button 
                    type="button"
                    variant="outline" 
                    className="w-24 h-12 text-[#334154] bg-[#F8FAFC] border border-[#E2E8F0] shadow-none dark:text-white"
                  >
                    Cancel
                  </Button>
                </SheetClose>
                <Button 
                  type="submit"
                  className="w-24 h-12 bg-[#D946EF] hover:bg-[#e782f7] text-white"
          disabled={isSubmitting || changePassword.isPending}
        >
          {(isSubmitting || changePassword.isPending) ? "..." : "Update"}
                </Button>
              </SheetFooter>
            </Form>
          )}
        </Formik>
      </SheetContent>
    </Sheet>
  );
}

export default ChangePasswordSheet;
