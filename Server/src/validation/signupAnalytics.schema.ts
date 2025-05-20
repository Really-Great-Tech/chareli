import * as yup from 'yup';

export const analyticsSchema = yup.object({
  sessionId: yup.string().nullable(),
  type: yup.string().required('Signup form type is required')
});
