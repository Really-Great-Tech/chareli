import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { useInviteTeamMember } from "../../backend/teams.service";
import { toast } from "sonner";
import * as Yup from "yup";
import type { InviteUserRequest } from "../../backend/teams.service";

const inviteSchema = Yup.object().shape({
  email: Yup.string()
    .email("Invalid email format")
    .required("Email is required"),
  role: Yup.string()
    .oneOf(["admin"], "Invalid role")
    .required("Role is required"),
});

const initialValues: InviteUserRequest = {
  email: "",
  role: "admin",
};

export function InviteSheet({ children }: { children: React.ReactNode }) {
  const formikRef = React.useRef<any>(null);
  const { mutate: inviteTeamMember, isPending } = useInviteTeamMember();
  const [open, setOpen] = React.useState(false);

  const handleInvite = async (
    values: InviteUserRequest,
    { resetForm }: any
  ) => {
    inviteTeamMember(values, {
      onSuccess: () => {
        toast.success("Invitation sent successfully");
        resetForm();
        setOpen(false);
      },
      onError: (error: any) => {
        console.log("my error", error)
        const message =
          error?.response?.data?.message ||
          error?.message ||
          "Failed to send invitation";

        toast.error(message);
      },
    });
  };

  return (
    <Sheet 
      open={open} 
      onOpenChange={(newOpen) => {
        if (!newOpen && formikRef.current) {
          formikRef.current.resetForm();
        }
        setOpen(newOpen);
      }}
    >
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="font-boogaloo dark:bg-[#0F1621] max-w-md w-full">
        <SheetHeader>
          <SheetTitle className="text-xl font-normal tracking-wider mt-6">
            Share Admin Invite
          </SheetTitle>
          <div className="border border-b-gray-200"></div>
        </SheetHeader>
        <Formik
          initialValues={initialValues}
          validationSchema={inviteSchema}
          onSubmit={handleInvite}
          innerRef={formikRef}
        >
          {({ isSubmitting, isValid, dirty }) => (
            <Form className="grid gap-6 px-4">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="email" className="text-lg">
                  User Email
                </Label>
                <Field
                  as={Input}
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter email"
                  className="col-span-3 shadow-none text-gray-400 font-thin text-xl tracking-wider h-14 bg-[#F1F5F9] border border-[#CBD5E0] dark:bg-[#121C2D] dark:text-white"
                />
                <ErrorMessage
                  name="email"
                  component="div"
                  className="text-red-500 text-xs mt-1"
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Label htmlFor="role" className="text-lg">
                  Role
                </Label>
                <Field
                  as="select"
                  id="role"
                  name="role"
                  className="col-span-3 shadow-none text-gray-400 font-thin font-pincuk text-xl tracking-wider h-14 bg-[#F1F5F9] border border-[#CBD5E0] rounded-lg dark:bg-[#121C2D] dark:text-white p-2"
                >
                  <option value="admin">Admin</option>
                </Field>
                <ErrorMessage
                  name="role"
                  component="div"
                  className="text-red-500 text-xs mt-1"
                />
              </div>
              <div className="flex gap-3 justify-end px-2">
                <SheetClose asChild>
                  <Button
                    type="button"
                    className="w-20 h-12 text-[#334154] bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-accent"
                    onClick={() => formikRef.current?.resetForm()}
                  >
                    Cancel
                  </Button>
                </SheetClose>
                <Button
                  type="submit"
                  className="w-22 h-12 bg-[#D946EF] dark:text-white hover:text-[#D946EF] hover:bg-[#F3E8FF]"
                  disabled={isSubmitting || isPending || !isValid || !dirty}
                >
                  {isSubmitting || isPending ? "Sending..." : "Send Invite"}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </SheetContent>
    </Sheet>
  );
}
