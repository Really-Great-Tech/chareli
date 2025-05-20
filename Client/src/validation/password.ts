import * as Yup from 'yup';

export const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 8,
  MESSAGES: {
    MIN_LENGTH: 'Password must be at least 8 characters',
    UPPERCASE: 'Password must contain at least one uppercase letter',
    LOWERCASE: 'Password must contain at least one lowercase letter',
    NUMBER: 'Password must contain at least one number',
    SPECIAL: 'Password must contain at least one special character',
    REQUIRED: 'Password is required',
    MATCH: 'Passwords must match'
  }
};

export const passwordSchema = Yup.string()
  .min(PASSWORD_REQUIREMENTS.MIN_LENGTH, PASSWORD_REQUIREMENTS.MESSAGES.MIN_LENGTH)
  .matches(/[A-Z]/, PASSWORD_REQUIREMENTS.MESSAGES.UPPERCASE)
  .matches(/[a-z]/, PASSWORD_REQUIREMENTS.MESSAGES.LOWERCASE)
  .matches(/[0-9]/, PASSWORD_REQUIREMENTS.MESSAGES.NUMBER)
  .matches(/[^A-Za-z0-9]/, PASSWORD_REQUIREMENTS.MESSAGES.SPECIAL)
  .required(PASSWORD_REQUIREMENTS.MESSAGES.REQUIRED);

export const confirmPasswordSchema = Yup.string()
  .oneOf([Yup.ref('password')], PASSWORD_REQUIREMENTS.MESSAGES.MATCH)
  .required(PASSWORD_REQUIREMENTS.MESSAGES.REQUIRED);
