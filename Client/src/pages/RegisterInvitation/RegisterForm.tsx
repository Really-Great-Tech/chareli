// import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { useRegisterFromInvitation } from '../../backend/teams.service';
import { passwordSchema, confirmPasswordSchema } from '../../validation/password';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import '../../styles/phone-input.css';

interface RegisterFormProps {
  email: string;
  token: string;
  onSuccess: () => void;
}

const validationSchema = Yup.object({
  firstName: Yup.string().trim().required('First name is required'),
  lastName: Yup.string().trim().required('Last name is required'),
  password: passwordSchema,
  confirmPassword: confirmPasswordSchema,
  phoneNumber: Yup.string().required('Phone number is required')
});

interface FormValues {
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
}

export function RegisterForm({ email, token, onSuccess }: RegisterFormProps) {
  const { mutate: register, isPending } = useRegisterFromInvitation();

  const initialValues: FormValues = {
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    phoneNumber: ''
  };

  const handleSubmit = (values: FormValues) => {
    register(
      { 
        token, 
        data: { 
          ...values,
          email
        } 
      },
      {
        onSuccess
      }
    );
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ isSubmitting, setFieldValue, values }) => (
        <Form className="space-y-6">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              disabled
              className="mt-1 w-full bg-gray-100 dark:bg-[#1F2937]"
            />
          </div>

          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Field
              as={Input}
              id="firstName"
              name="firstName"
              type="text"
              className="mt-1 w-full"
            />
            <ErrorMessage
              name="firstName"
              component="div"
              className="text-red-500 text-sm mt-1"
            />
          </div>

          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Field
              as={Input}
              id="lastName"
              name="lastName"
              type="text"
              className="mt-1 w-full"
            />
            <ErrorMessage
              name="lastName"
              component="div"
              className="text-red-500 text-sm mt-1"
            />
          </div>

          <div>
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <PhoneInput
              country={'us'}
              value={values.phoneNumber}
              onChange={(phone) => setFieldValue('phoneNumber', phone)}
              inputClass="!w-full !h-10 !text-base"
              containerClass="!w-full"
            />
            <ErrorMessage
              name="phoneNumber"
              component="div"
              className="text-red-500 text-sm mt-1"
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Field
              as={Input}
              id="password"
              name="password"
              type="password"
              className="mt-1 w-full"
            />
            <ErrorMessage
              name="password"
              component="div"
              className="text-red-500 text-sm mt-1"
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Field
              as={Input}
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              className="mt-1 w-full"
            />
            <ErrorMessage
              name="confirmPassword"
              component="div"
              className="text-red-500 text-sm mt-1"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-[#D946EF] dark:text-white hover:text-[#D946EF] hover:bg-[#F3E8FF]"
            disabled={isSubmitting || isPending}
          >
            {isSubmitting || isPending ? 'Creating Account...' : 'Create Account'}
          </Button>
        </Form>
      )}
    </Formik>
  );
}
