/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from "react";
import { useCreateUser } from "../../backend/user.service";
import { useTrackSignupClick } from "../../backend/signup.analytics.service";
import { useSystemConfigByKey } from "../../backend/configuration.service";
import { toast } from "sonner";
import { Formik, Form, Field, ErrorMessage } from "formik";
import type { FormikHelpers, FieldProps } from "formik";
import * as Yup from "yup";
import { passwordSchema, confirmPasswordSchema } from "../../validation/password";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import "../../styles/phone-input.css";
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
import { Checkbox } from "../../components/ui/checkbox";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { TbUser } from "react-icons/tb";
import { AiOutlineMail } from "react-icons/ai";

const getAuthFields = (config?: { value?: { settings: any } }) => {
  // Default state when no config or invalid config
  const defaultFields = { 
    showAll: true,
    showEmail: true,
    showPhone: true,
    firstName: true,
    lastName: true
  };

  if (!config?.value?.settings) return defaultFields;

  const { both, email, sms } = config.value.settings;

  // Guard against undefined settings
  if (!both || !email || !sms) return defaultFields;
  
  if (both.enabled) {
    return { 
      showAll: false,
      showEmail: true, 
      showPhone: true,
      firstName: true,
      lastName: true
    };
  }
  
  if (email.enabled) {
    return { 
      showAll: false,
      showEmail: true, 
      showPhone: false,
      firstName: !!email.firstName,
      lastName: !!email.lastName 
    };
  }
  
  if (sms.enabled) {
    return { 
      showAll: false,
      showEmail: false,
      showPhone: true,
      firstName: !!sms.firstName,
      lastName: !!sms.lastName 
    };
  }
  
  return defaultFields;
};

const getValidationSchema = (config?: { value?: { settings: any } }) => {
  const fields = getAuthFields(config);
  const schema: any = {
    password: passwordSchema,
    confirmPassword: confirmPasswordSchema,
    ageConfirm: Yup.boolean().default(false),
    terms: Yup.boolean()
      .oneOf([true], "You must accept the terms of use")
      .required("You must accept the terms of use")
  };

  if (fields.showAll || fields.showEmail) {
    schema.email = Yup.string().email("Invalid email address").required("Email is required");
  }

  if (fields.showAll || fields.showPhone) {
    schema.phoneNumber = Yup.string().required("Phone number is required");
  }

  if (fields.firstName) {
    schema.firstName = Yup.string().required("First name is required");
  }

  if (fields.lastName) {
    schema.lastName = Yup.string().required("Last name is required");
  }

  return Yup.object(schema);
};

const getInitialValues = (config?: { value?: { settings: any } }) => {
  const fields = getAuthFields(config);
  const values: any = {
    password: "",
    confirmPassword: "",
    ageConfirm: false,
    terms: false
  };

  if (fields.showAll || fields.showEmail) values.email = "";
  if (fields.showAll || fields.showPhone) values.phoneNumber = "";
  if (fields.firstName) values.firstName = "";
  if (fields.lastName) values.lastName = "";

  return values;
};

interface SignUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  openLoginModal: () => void;
}

// Format phone number
const formatPhoneNumber = (value?: string) => (value ? `+${value}` : value);

export function SignUpModal({
  open,
  onOpenChange,
  openLoginModal,
}: SignUpDialogProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { data: config } = useSystemConfigByKey('authentication_settings');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () =>
    setShowConfirmPassword(!showConfirmPassword);


  console.log("config", config)

  const createUser = useCreateUser();
  const { mutate: trackSignup } = useTrackSignupClick();

  const handleSignUp = async (values: ReturnType<typeof getInitialValues>, actions: FormikHelpers<ReturnType<typeof getInitialValues>>) => {
    try {
      // Track the final signup button click
      trackSignup({ type: 'signup-modal' });

      await createUser.mutateAsync({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
        phoneNumber: values.phoneNumber,
        isAdult: values.ageConfirm,
        hasAcceptedTerms: values.terms
      });

      // Close signup modal
      onOpenChange(false);

      toast.success("Account created successfully! Please login to continue.");
      openLoginModal();

    } catch (error: any) {
      actions.setStatus({ error: "Failed to create account" });
    } finally {
      actions.setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <CustomDialogContent className="w-[95%] max-w-[425px] p-4 sm:p-6 dark:bg-[#0F1221]">
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
          <DialogTitle className="text-xl sm:text-2xl font-bold text-[#E328AF] text-center font-boogaloo">
            Sign Up
          </DialogTitle>
          <DialogDescription className="text-center">
            <Formik
              initialValues={getInitialValues(config)}
              validationSchema={getValidationSchema(config)}
              onSubmit={handleSignUp}
              validateOnMount={false}
              validateOnChange={false}
              validateOnBlur={false}
            >
              {({ isSubmitting}) => (
                <Form className="space-y-1">
                  {/* Authentication Fields */}
                  {(() => {
                    const fields = getAuthFields(config);
                    return (
                      <>
                        {(fields.showAll || fields.showEmail) && (
                          <div className="relative">
                            <Label
                              htmlFor="email"
                              className="font-boogaloo text-base text-black dark:text-white"
                            >
                              E-Mail
                            </Label>
                            <div className="relative">
                              <AiOutlineMail
                                size={15}
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                              />
                              <Field
                                as={Input}
                                id="email"
                                name="email"
                                placeholder="Enter Email"
                                className="mt-1 bg-[#E2E8F0] border-0 pl-10 font-pincuk text-[11px] font-normal h-[48px]"
                              />
                            </div>
                            <ErrorMessage
                              name="email"
                              component="div"
                              className="text-red-500 text-xs mt-1 font-pincuk"
                            />
                          </div>
                        )}

                        {(fields.showAll || fields.showPhone) && (
                          <div className="relative">
                            <Label
                              htmlFor="phoneNumber"
                              className="font-boogaloo text-base text-black dark:text-white"
                            >
                              Phone Number
                            </Label>
                            <Field name="phoneNumber">
                              {({ field, form }: FieldProps) => (
                                <div className="w-full mt-1">
                                  <PhoneInput
                                    country="us"
                                    value={field.value}
                                    onChange={(value) => form.setFieldValue('phoneNumber', formatPhoneNumber(value))}
                                    inputStyle={{ 
                                      width: "100%", 
                                      height: "48px", 
                                      backgroundColor: "#E2E8F0", 
                                      border: "0", 
                                      borderRadius: "0.375rem", 
                                      fontFamily: "pincuk", 
                                      fontSize: "11px" 
                                    }}
                                    containerClass="dark:bg-[#191c2b]"
                                    buttonStyle={{ 
                                      backgroundColor: "#E2E8F0", 
                                      border: "0", 
                                      borderRadius: "0.375rem 0 0 0.375rem" 
                                    }}
                                    dropdownStyle={{ 
                                      backgroundColor: "#E2E8F0", 
                                      color: "#000" 
                                    }}
                                    searchStyle={{ 
                                      backgroundColor: "##E2E8F0", 
                                      color: "#000" 
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
                              name="phoneNumber"
                              component="div"
                              className="text-red-500 text-xs mt-1 font-pincuk"
                            />
                          </div>
                        )}

                        {/* Name Fields */}
                        {(fields.firstName || fields.lastName) && (
                          <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0 mt-4">
                            {fields.firstName && (
                              <div className="w-full sm:flex-1 relative">
                                <Label
                                  htmlFor="firstName"
                                  className="font-boogaloo text-base text-black dark:text-white"
                                >
                                  First Name
                                </Label>
                                <div className="relative">
                                  <TbUser
                                    size={15}
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                                  />
                                  <Field
                                    as={Input}
                                    id="firstName"
                                    name="firstName"
                                    placeholder="Enter First Name"
                                    className="mt-1 bg-[#E2E8F0] border-0 pl-10 font-pincuk text-[11px] font-normal h-[48px]"
                                  />
                                </div>
                                <ErrorMessage
                                  name="firstName"
                                  component="div"
                                  className="text-red-500 text-xs mt-1 font-pincuk"
                                />
                              </div>
                            )}
                            {fields.lastName && (
                              <div className="w-full sm:flex-1 relative">
                                <Label
                                  htmlFor="lastName"
                                  className="font-boogaloo text-base text-black dark:text-white"
                                >
                                  Last Name
                                </Label>
                                <div className="relative">
                                  <TbUser
                                    size={15}
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                                  />
                                  <Field
                                    as={Input}
                                    id="lastName"
                                    name="lastName"
                                    placeholder="Enter Last Name"
                                    className="mt-1 bg-[#E2E8F0] border-0 pl-10 font-pincuk text-[11px] font-normal h-[48px]"
                                  />
                                </div>
                                <ErrorMessage
                                  name="lastName"
                                  component="div"
                                  className="text-red-500 text-xs mt-1 font-pincuk"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {/* Password Fields */}
                  <div className="relative mt-4">
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
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
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
                        placeholder="Enter Password"
                        className="mt-1 bg-[#E2E8F0] border-0 pl-10 pr-10 font-pincuk text-[11px] font-normal h-[48px]"
                      />
                    </div>
                    <ErrorMessage
                      name="password"
                      component="div"
                      className="text-red-500 text-xs mt-1 font-pincuk"
                    />
                  </div>
                  <div className="relative mt-4">
                    <Label
                      htmlFor="confirmPassword"
                      className="font-boogaloo text-base text-black dark:text-white"
                    >
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={toggleConfirmPasswordVisibility}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"
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
                        placeholder="Confirm Password"
                        className="mt-1 bg-[#E2E8F0] border-0 pl-10 pr-10 font-pincuk text-[11px] font-normal h-[48px]"
                      />
                    </div>
                    <ErrorMessage
                      name="confirmPassword"
                      component="div"
                      className="text-red-500 text-xs mt-1 font-pincuk"
                    />
                  </div>
                    <div className="my-4 sm:my-5 flex flex-col gap-2 sm:gap-3">
                    <div className="flex items-center space-x-2">
                      <Field name="ageConfirm">
                        {({ field, form }: FieldProps) => (
                          <Checkbox
                            id="ageConfirm"
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              form.setFieldValue("ageConfirm", checked);
                              form.setFieldTouched("ageConfirm", true);
                            }}
                            className="border-2 border-gray-400 data-[state=checked]:bg-[#C026D3] data-[state=checked]:border-[#C026D3]"
                          />
                        )}
                      </Field>
                      <Label
                        htmlFor="ageConfirm"
                        className="font-boogaloo text-sm sm:text-base text-black dark:text-white cursor-pointer"
                      >
                        Confirm age 18+
                      </Label>
                    </div>
                    <ErrorMessage
                      name="ageConfirm"
                      component="div"
                      className="text-red-500 text-xs font-pincuk"
                    />
                    <div className="flex items-center space-x-2">
                      <Field name="terms">
                        {({ field, form }: FieldProps) => (
                          <Checkbox
                            id="terms"
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              form.setFieldValue("terms", checked);
                              form.setFieldTouched("terms", true);
                            }}
                            className="border-2 border-gray-400 data-[state=checked]:bg-[#C026D3] data-[state=checked]:border-[#C026D3]"
                          />
                        )}
                      </Field>
                      <Label
                        htmlFor="terms"
                        className="font-boogaloo text-sm sm:text-base text-black dark:text-white cursor-pointer"
                      >
                        Accept Terms of Use
                      </Label>
                    </div>
                    <ErrorMessage
                      name="terms"
                      component="div"
                      className="text-red-500 text-xs font-pincuk"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#D946EF] hover:bg-[#C026D3] text-white font-boogaloo text-base sm:text-lg py-2 sm:py-3"
                  >
                    {isSubmitting ? "Creating Account..." : "Sign Up"}
                  </Button>
                </Form>
              )}
            </Formik>
          </DialogDescription>
        </DialogHeader>
        <p className="text-xs sm:text-sm text-center text-black dark:text-white font-pincuk mt-4">
          Already have an account?{" "}
          <span
            className="underline text-[#C026D3] cursor-pointer font-boogaloo text-base sm:text-lg hover:underline"
            onClick={openLoginModal}
          >
            Login
          </span>
        </p>
      </CustomDialogContent>
    </Dialog>
  );
}
