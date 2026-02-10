import { DailyPracticeReminderEmail } from '@/emails/daily-practice-reminder-email';
import prisma from '@/lib/prisma';
import { getDailyPracticeStreakStatus } from '@/lib/services/streak/daily-practice';
import { schedules } from '@trigger.dev/sdk';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function getUtcDayStart(date = new Date()) {
  const dayKey = date.toISOString().slice(0, 10);
  return new Date(`${dayKey}T00:00:00.000Z`);
}

export const sendDailyPracticeRemindersTask = schedules.task({
  id: 'send-daily-practice-reminders-daily',
  cron: '0 22 * * *',
  run: async () => {
    const today = getUtcDayStart();
    const yesterday = new Date(today.getTime() - ONE_DAY_MS);

    const usersToRemind = await prisma.user.findMany({
      where: {
        dailyPracticeStreaks: {
          some: {
            day: yesterday,
            isCompleted: true,
          },
          none: {
            day: today,
            isCompleted: true,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!usersToRemind.length) {
      console.log(
        `No users to remind for ${today.toISOString().slice(0, 10)} (UTC)`,
      );

      return {
        usersMatched: 0,
        emailsSent: 0,
        emailsFailed: 0,
      };
    }

    let emailsSent = 0;
    let emailsFailed = 0;

    for (const user of usersToRemind) {
      console.log(
        `Sending daily practice reminder to ${user.email} (${user.id})`,
      );

      const firstName =
        user.name?.trim().split(/\s+/).filter(Boolean).at(0) ?? 'Cantor(a)';

      const dailyPracticeStreakStatus = await getDailyPracticeStreakStatus(
        user.id,
      );

      if (!dailyPracticeStreakStatus) continue;

      try {
        await resend.emails.send({
          from: 'Notefinder <noreply@notefinder.com.br>',
          to: user.email,
          subject: 'Hora de treinar hoje',
          react: DailyPracticeReminderEmail({
            recipientName: firstName,
            currentStreakDays: dailyPracticeStreakStatus.currentStreakDays,
            minimumPracticeMinutesToday:
              dailyPracticeStreakStatus.targetSeconds / 60,
          }),
        });

        emailsSent += 1;
      } catch (error) {
        emailsFailed += 1;

        console.error('Failed to send daily practice reminder email', {
          userId: user.id,
          email: user.email,
          error,
        });
      }
    }

    console.log(
      `Daily practice reminders done: ${emailsSent} sent, ${emailsFailed} failed, ${usersToRemind.length} matched`,
    );

    return {
      usersMatched: usersToRemind.length,
      emailsSent,
      emailsFailed,
    };
  },
});
