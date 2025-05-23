/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useMemo, useCallback } from "react";
import { useRegister } from "../../backend/auth.service";
import { useTrackSignupClick } from "../../backend/signup.analytics.service";
import { toast } from "sonner";
import { useConfig } from "../../context/ConfigContext";
import type { SignUpConfig } from "../../backend/config.service";
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

type SignUpValues = {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  phoneNumber?: string;
  ageConfirm?: boolean;
  terms?: boolean;
};

// type SignUpPayload = {
//   firstName?: string;
//   lastName?: string;
//   email?: string;
//   password?: string;
//   phoneNumber?: string;
//   isAdult?: boolean;
//   hasAcceptedTerms?: boolean;
// };

// Create validation schema based on config
const createValidationSchema = (config: SignUpConfig | null) => {
  if (!config?.fields) {
    return Yup.object({});
  }

  const schema: { [key: string]: any } = {};

  // Only add validation for enabled fields
  if (config.fields.firstName) {
    schema.firstName = Yup.string().required("First name is required");
  }
  if (config.fields.lastName) {
    schema.lastName = Yup.string().required("Last name is required");
  }
  if (config.fields.email) {
    schema.email = Yup.string()
      .email("Invalid email address")
      .required("Email is required");
  }
  if (config.fields.phoneNumber) {
    schema.phoneNumber = Yup.string().required("Phone number is required");
  }
  if (config.fields.password) {
    schema.password = passwordSchema;
    schema.confirmPassword = confirmPasswordSchema;
  }
  if (config.fields.ageConfirm) {
    schema.ageConfirm = Yup.boolean().default(false);
  }
  if (config.fields.terms) {
    schema.terms = Yup.boolean()
    .oneOf([true], "You must accept the terms of use")
    .required("You must accept the terms of use");
  }

  return Yup.object(schema);
};

// Create initial values based on config
const createInitialValues = (config: SignUpConfig | null): SignUpValues => {
  if (!config?.fields) {
    return {};
  }

  return {
    firstName: config.fields.firstName ? "" : undefined,
    lastName: config.fields.lastName ? "" : undefined,
    email: config.fields.email ? "" : undefined,
    phoneNumber: config.fields.phoneNumber ? "" : undefined,
    password: config.fields.password ? "" : undefined,
    confirmPassword: config.fields.password ? "" : undefined,
    ageConfirm: config.fields.ageConfirm ? false : undefined,
    terms: config.fields.terms ? false : undefined,
  };
};

interface SignUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  openLoginModal: () => void;
}

// Format phone number
const formatPhoneNumber = (value?: string) => (value ? `+${value}` : value);

// Move config check before loading state render
export function SignUpModal({
  open,
  onOpenChange,
  openLoginModal,
}: SignUpDialogProps) {
  const { signUpConfig, isLoading } = useConfig();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const register = useRegister();

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const toggleConfirmPasswordVisibility = useCallback(() => {
    setShowConfirmPassword(prev => !prev);
  }, []);

  // Debug the values
  console.log('Config:', signUpConfig);
  console.log('Loading:', isLoading);

  // Always call hooks before any early returns
  const validationSchema = useMemo(
    () => createValidationSchema(signUpConfig), 
    [signUpConfig]
  );
  
  const initialValues = useMemo(
    () => createInitialValues(signUpConfig), 
    [signUpConfig]
  );
  const { mutate: trackSignup } = useTrackSignupClick();

  const handleSignUp = async (values: typeof initialValues, actions: FormikHelpers<typeof initialValues>) => {
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

  const handleSignUp = useCallback(async (
    values: SignUpValues, 
    actions: FormikHelpers<SignUpValues>
  ) => {
    try {
      if (!signUpConfig) {
        console.error('No signup config available');
        toast.error("Configuration error. Please try again.");
        return;
      }
  
      // Log form values for debugging
      console.log('Form values:', values);
  
      // Only validate fields that are enabled in config
      const missingFields = [];
      if (signUpConfig.fields.firstName && !values.firstName) missingFields.push('First name');
      if (signUpConfig.fields.lastName && !values.lastName) missingFields.push('Last name');
      if (signUpConfig.fields.email && !values.email) missingFields.push('Email');
      if (signUpConfig.fields.password && !values.password) missingFields.push('Password');
      if (signUpConfig.fields.phoneNumber && !values.phoneNumber) missingFields.push('Phone number');
      if (signUpConfig.fields.ageConfirm && !values.ageConfirm) missingFields.push('Age confirmation');
      if (signUpConfig.fields.terms && !values.terms) missingFields.push('Terms acceptance');
  
      if (missingFields.length > 0) {
        const errorMessage = `Missing required fields: ${missingFields.join(', ')}`;
        console.error(errorMessage);
        actions.setStatus({ error: errorMessage });
        toast.error(errorMessage);
        actions.setSubmitting(false);
        return;
      }
  
      try {
        // Only include fields that are enabled in config
        // Ensure required fields are present and non-undefined
        const payload = {
          ...(signUpConfig.fields.firstName && { firstName: values.firstName }),
          ...(signUpConfig.fields.lastName && { lastName: values.lastName }),
          ...(signUpConfig.fields.email && { email: values.email }),
          password: values.password as string,
          ...(signUpConfig.fields.phoneNumber && { 
            phoneNumber: formatPhoneNumber(values.phoneNumber || '') 
          }),
          isAdult: Boolean(values.ageConfirm),
          hasAcceptedTerms: Boolean(values.terms),
        };

        console.log('Submitting registration payload:', payload);
        
        const response = await register.mutateAsync(payload);
        console.log('Registration response:', response);
        
        if (response?.data) {
          toast.success("Account created successfully! Please login to continue.");
          onOpenChange(false);
          openLoginModal();
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (error: any) {
        console.error('Registration error:', error);
        console.error('Error response:', error.response?.data);
        const errorMessage = error.response?.data?.message || error.message || "Failed to create account";
        actions.setStatus({ error: errorMessage });
        toast.error(errorMessage);
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error.message || "Failed to create account";
      console.error('Outer error:', error);
      actions.setStatus({ error: errorMessage });
      toast.error(errorMessage);
    } finally {
      actions.setSubmitting(false);
    }
  }, [signUpConfig, register, onOpenChange, openLoginModal]);

  // Only show loading when actually loading, not when we have config
  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <CustomDialogContent className="sm:max-w-[425px] dark:bg-[#0F1221]">
          <DialogHeader>
            <DialogTitle>Loading...</DialogTitle>
            <DialogDescription>
              <div className="flex justify-center items-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C026D3]"></div>
              </div>
            </DialogDescription>
          </DialogHeader>
        </CustomDialogContent>
      </Dialog>
    );
  }

  // Check for valid config after loading
  if (!signUpConfig?.fields) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <CustomDialogContent className="sm:max-w-[425px] dark:bg-[#0F1221]">
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
            <DialogDescription>
              <div className="text-center text-red-500">
                Failed to load configuration. Please try again.
              </div>
            </DialogDescription>
          </DialogHeader>
        </CustomDialogContent>
      </Dialog>
    );
  }

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
            Sign Up
          </DialogTitle>
          <DialogDescription className="text-center">
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSignUp}
              validateOnMount={false}
              validateOnChange={false}
              validateOnBlur={false}
            >
              {({ isSubmitting, handleSubmit }) => (
                <Form className="space-y-1" onSubmit={(e) => {
                  console.log('Form submitted');
                  handleSubmit(e);
                }}>
                  {/* Name Fields */}
                  {(signUpConfig.fields.firstName || signUpConfig.fields.lastName) && (
                    <div className="flex space-x-4">
                      {signUpConfig.fields.firstName && (
                        <div className="flex-1 relative">
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
                      {signUpConfig.fields.lastName && (
                        <div className="flex-1 relative">
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
                  {/* Email Field */}
                  {signUpConfig.fields.email && (
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

                  {/* Phone Number Field */}
                  {signUpConfig.fields.phoneNumber && (
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
                              onChange={(value) => {
                                console.log('Phone number value:', value);
                                form.setFieldValue('phoneNumber', value);
                              }}
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
                                backgroundColor: "#fff", 
                                color: "#000" 
                              }}
                              searchStyle={{ 
                                backgroundColor: "#fff", 
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
                  {/* Password Fields */}
                  {signUpConfig.fields.password && (
                    <>
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
                      <div className="relative">
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
                    </>
                  )}
                  {/* Checkboxes */}
                  <div className="my-5 flex flex-col gap-3">
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
                        className="font-boogaloo text-black dark:text-white cursor-pointer"
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
                        className="font-boogaloo text-black dark:text-white cursor-pointer"
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
                    className="w-full bg-[#D946EF] hover:bg-[#C026D3] text-white font-boogaloo"
                  >
                    {isSubmitting ? "Creating Account..." : "Sign Up"}
                  </Button>
                </Form>
              )}
            </Formik>
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-center text-black dark:text-white font-boogaloo">
          Already have an account?{" "}
          <span
            className="underline text-[#C026D3] cursor-pointer"
            onClick={openLoginModal}
          >
            Login
          </span>
        </p>
      </CustomDialogContent>
    </Dialog>
  );
}
