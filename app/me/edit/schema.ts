import z from 'zod';

export const DAILY_PRACTICE_TARGET_OPTIONS = [
  60 * 5,
  60 * 15,
  60 * 30,
] as const;

export const updateNameSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  dailyPracticeTargetSeconds: z.coerce
    .number()
    .int()
    .refine(
      (value) =>
        DAILY_PRACTICE_TARGET_OPTIONS.includes(
          value as (typeof DAILY_PRACTICE_TARGET_OPTIONS)[number],
        ),
      'Escolha uma meta de 5, 15 ou 30 minutos',
    ),
});
