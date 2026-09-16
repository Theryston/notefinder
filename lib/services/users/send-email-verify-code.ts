import prisma from '@/lib/prisma';
import { getResendClient } from '@/lib/services/email/get-resend-client';
import moment from 'moment';

export const sendEmailVerifyCode = async (email: string) => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = moment().add(10, 'minutes').toDate();

  const user = await prisma.user.findFirst({
    where: { email },
  });

  if (!user) {
    const timeToWait = Math.floor(Math.random() * 801) + 200;
    await new Promise((resolve) => setTimeout(resolve, timeToWait));
    return;
  }

  const emailVerificationCode = await prisma.emailVerificationCode.create({
    data: {
      user: { connect: { email } },
      code,
      expiresAt,
    },
  });

  const resend = getResendClient();

  await resend.emails.send({
    from: 'Notefinder <noreply@notefinder.com.br>',
    to: email,
    subject: 'Verifique seu email',
    html: `Seu código de verificação é <b>${code}</b>`,
  });

  // Expire old code
  await prisma.emailVerificationCode.updateMany({
    where: { user: { email }, NOT: { id: emailVerificationCode.id } },
    data: {
      expiresAt: moment().subtract(1, 'minutes').toDate(),
    },
  });

  return emailVerificationCode;
};
