import * as Yup from "yup";

export const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 6,
  MESSAGES: {
    MIN_LENGTH: "Password must be at least 6 characters",
    REQUIRED: "Password is required",
    MATCH: "Passwords must match",
    WEAK: "Password is too weak (consider adding letters and numbers)",
  },
};

export const passwordSchema = Yup.string()
  .min(
    PASSWORD_REQUIREMENTS.MIN_LENGTH,
    PASSWORD_REQUIREMENTS.MESSAGES.MIN_LENGTH
  )
  .matches(/^(?=.*[a-zA-Z])(?=.*\d).+$/, PASSWORD_REQUIREMENTS.MESSAGES.WEAK)
  .required(PASSWORD_REQUIREMENTS.MESSAGES.REQUIRED);

export const confirmPasswordSchema = Yup.string()
  .oneOf([Yup.ref("password")], PASSWORD_REQUIREMENTS.MESSAGES.MATCH)
  .required(PASSWORD_REQUIREMENTS.MESSAGES.REQUIRED);
