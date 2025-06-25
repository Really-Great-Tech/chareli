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
import { useUpdateUserData } from "../../backend/user.service";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import { Formik, Form, Field, ErrorMessage } from "formik";
import type { FieldProps } from "formik";
import * as Yup from "yup";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import "../../styles/phone-input.css";

interface EditProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

const validationSchema = Yup.object().shape({
  firstName: Yup.string()
    .required("First name is required")
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be less than 50 characters"),
  lastName: Yup.string()
    .required("Last name is required")
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be less than 50 characters"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  phone: Yup.string()
    .nullable()
    .matches(
      /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
      "Invalid phone number format"
    ),
});

export function EditProfileSheet({
  open,
  onOpenChange,
  profile,
}: EditProfileSheetProps) {
  const updateUser = useUpdateUserData();
  const { user } = useAuth();

  const initialValues = {
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    phone: profile.phone,
  };

  const handleSubmit = async (values: typeof initialValues) => {
    try {
      if (!user?.id) {
        toast.error("User ID not found");
        return;
      }

      await updateUser.mutateAsync({
        id: user.id,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email,
        phoneNumber: values.phone || undefined,
      });

      toast.success("Profile updated successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="max-w-md w-full p-6 font-dmmono dark:bg-[#0F1621]"
      >
        <SheetHeader>
          <SheetTitle className="text-lg mt-4 tracking-wider">
            Edit Profile
          </SheetTitle>
        </SheetHeader>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched }) => (
            <Form className="flex flex-col gap-6 mt-4 px-2">
              <div>
                <Label htmlFor="firstName" className="text-base mb-1">
                  First Name
                </Label>
                <Field
                  as={Input}
                  id="firstName"
                  name="firstName"
                  placeholder="Enter first name"
                  className={`bg-[#F1F5F9] mt-1 font-worksans text-sm tracking-wider dark:bg-[#121C2D] dark:text-white ${
                    errors.firstName && touched.firstName
                      ? "border-red-500"
                      : ""
                  }`}
                />
                <ErrorMessage
                  name="firstName"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-base mb-1">
                  Last Name
                </Label>
                <Field
                  as={Input}
                  id="lastName"
                  name="lastName"
                  placeholder="Enter last name"
                  className={`bg-[#F1F5F9] mt-1 font-worksans text-sm tracking-wider dark:bg-[#121C2D] dark:text-white ${
                    errors.lastName && touched.lastName ? "border-red-500" : ""
                  }`}
                />
                <ErrorMessage
                  name="lastName"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-base mb-1">
                  Email
                </Label>
                <Field
                  as={Input}
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter email"
                  className={`bg-[#F1F5F9] mt-1 font-worksans text-sm tracking-wider dark:bg-[#121C2D] dark:text-white ${
                    errors.email && touched.email ? "border-red-500" : ""
                  }`}
                />
                <ErrorMessage
                  name="email"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-base mb-1">
                  Phone Number
                </Label>
                <Field name="phone">
                  {({ field, form }: FieldProps) => (
                    <div className="w-full mt-1">
                      <PhoneInput
                        country="us"
                        value={field.value}
                        onChange={(value) =>
                          form.setFieldValue("phone", value ? `+${value}` : "")
                        }
                        inputStyle={{
                          width: "100%",
                          height: "48px",
                          backgroundColor: "#F1F5F9",
                          border: "0",
                          borderRadius: "0.375rem",
                          fontFamily: "pincuk",
                          fontSize: "11px",
                        }}
                        containerClass="dark:bg-[#121C2D]"
                        buttonStyle={{
                          backgroundColor: "#F1F5F9",
                          border: "0",
                          borderRadius: "0.375rem 0 0 0.375rem",
                        }}
                        dropdownStyle={{
                          backgroundColor: "#F1F5F9",
                          color: "#000",
                        }}
                        searchStyle={{
                          backgroundColor: "#F1F5F9",
                          color: "#000",
                        }}
                        enableAreaCodeStretch
                        autoFormat
                        enableSearch
                        disableSearchIcon
                        autocompleteSearch
                        countryCodeEditable={false}
                      />
                    </div>
                  )}
                </Field>
                <ErrorMessage
                  name="phone"
                  component="div"
                  className="text-red-500 text-sm mt-1"
                />
              </div>
              <SheetFooter className="flex flex-row justify-end mt-8 gap-4">
                <SheetClose asChild>
                  <Button
                    variant="outline"
                    className="w-20 h-12 text-[#334154] bg-[#F8FAFC] border border-[#E2E8F0] dark:text-white"
                  >
                    Cancel
                  </Button>
                </SheetClose>
                <Button
                  type="submit"
                  className="w-20 h-12 bg-[#D946EF] text-white tracking-wide"
                  disabled={updateUser.isPending}
                >
                  {updateUser.isPending ? "..." : "Update"}
                </Button>
              </SheetFooter>
            </Form>
          )}
        </Formik>
      </SheetContent>
    </Sheet>
  );
}

export default EditProfileSheet;
