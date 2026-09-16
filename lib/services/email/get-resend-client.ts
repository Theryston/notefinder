import { Resend } from 'resend';

export function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    throw new Error(
      'RESEND_API_KEY is not configured. Set it in the runtime environment.',
    );
  }

  return new Resend(apiKey);
}

export function getOptionalResendClient() {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  return apiKey ? new Resend(apiKey) : null;
}
