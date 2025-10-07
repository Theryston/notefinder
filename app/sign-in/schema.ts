import z from 'zod';

export const signInSchema = z.object({
  emailOrUsername: z.string(),
  password: z.string(),
});
