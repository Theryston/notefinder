import z from 'zod';
import { usernameSchema } from '../sign-up/schema';

export const setupUsernameSchema = z.object({
  username: usernameSchema,
});
