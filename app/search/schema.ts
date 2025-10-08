import z from 'zod';

export const searchTrackSchema = z.object({
  track: z
    .string()
    .trim()
    .min(1, 'Digite o nome da música')
    .max(200, 'O nome da música é muito longo'),
});
