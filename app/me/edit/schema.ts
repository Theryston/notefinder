import z from 'zod';

export const updateNameSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
});
