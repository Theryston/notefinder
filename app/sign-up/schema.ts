import z from 'zod';

export const passwordSchema = z
  .string()
  .min(6, 'Senha deve ter ao menos 6 caracteres');

export const usernameSchema = z
  .string()
  .min(3, 'Username deve ter ao menos 3 caracteres')
  .max(50, 'Username deve ter no máximo 50 caracteres')
  .regex(/^[a-z0-9_]+$/, 'Username deve conter apenas letras, números e _');

export const signUpSchema = z
  .object({
    name: z.string().min(1, 'Nome é obrigatório'),
    username: usernameSchema,
    email: z.string().email('Email inválido'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  });
