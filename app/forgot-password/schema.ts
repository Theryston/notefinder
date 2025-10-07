import z from 'zod';
import { passwordSchema } from '../sign-up/schema';

export const forgotPasswordResetSchema = z
  .object({
    email: z.string().email('Email inválido'),
    code: z.string().length(6, 'Código inválido'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  });
