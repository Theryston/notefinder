import prisma from '@/lib/prisma';
import moment from 'moment';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendForgotPasswordCode = async (email: string) => {
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

  const forgotPasswordCode = await prisma.forgotPasswordCode.create({
    data: {
      user: { connect: { email } },
      code,
      expiresAt,
    },
  });

  await resend.emails.send({
    from: 'Notefinder <noreply@notefinder.com.br>',
    to: email,
    subject: 'Reset your password',
    html: `Your password reset code is <b>${code}</b>`,
  });

  await prisma.forgotPasswordCode.updateMany({
    where: { user: { email }, NOT: { id: forgotPasswordCode.id } },
    data: {
      expiresAt: moment().subtract(1, 'minutes').toDate(),
    },
  });

  return forgotPasswordCode;
};
