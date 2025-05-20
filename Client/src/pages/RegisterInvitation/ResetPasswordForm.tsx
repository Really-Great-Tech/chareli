import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { useResetPasswordFromInvitation } from '../../backend/teams.service';
import { passwordSchema, confirmPasswordSchema } from '../../validation/password';
import { toast } from 'sonner';

interface ResetPasswordFormProps {
  email: string;
  token: string;
  onSuccess: () => void;
}

const validationSchema = Yup.object({
  password: passwordSchema,
  confirmPassword: confirmPasswordSchema
});

interface FormValues {
  password: string;
  confirmPassword: string;
}

export function ResetPasswordForm({ email, token, onSuccess }: ResetPasswordFormProps) {
  const { mutate: resetPassword, isPending, error } = useResetPasswordFromInvitation();

  React.useEffect(() => {
    if (error) {
      toast.error((error as any)?.message || 'Failed to reset password');
    }
  }, [error]);

  const initialValues: FormValues = {
    password: '',
    confirmPassword: ''
  };

  const handleSubmit = (values: FormValues) => {
    resetPassword(
      { 
        token, 
        data: values
      },
      {
        onSuccess,
        onError: (error) => {
          toast.error((error as any)?.message || 'Failed to reset password');
        }
      }
    );
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {({ isSubmitting }) => (
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
            <Label htmlFor="password">New Password</Label>
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
            {isSubmitting || isPending ? 'Resetting Password...' : 'Reset Password'}
          </Button>
        </Form>
      )}
    </Formik>
  );
}
