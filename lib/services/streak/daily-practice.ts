import {
  DAILY_STREAK_MAX_HEARTBEAT_SECONDS,
  DAILY_STREAK_SERVER_TIME_TOLERANCE_SECONDS,
  DAILY_STREAK_TARGET_SECONDS,
  type DailyPracticeStreakStatus,
} from '@/lib/constants';
import prisma from '@/lib/prisma';
import { Prisma } from '@/lib/generated/prisma/client';
import { revalidateTag } from 'next/cache';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

type TodayRow = {
  day: Date;
  listenedSeconds: number;
  isCompleted: boolean;
};

export type DailyPracticeHeartbeatResult = {
  status: DailyPracticeStreakStatus;
  justCompleted: boolean;
  creditedSeconds: number;
};

function getUtcDayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function getDateFromUtcDayKey(dayKey: string) {
  return new Date(`${dayKey}T00:00:00.000Z`);
}

function getDayKeyFromDate(day: Date) {
  return day.toISOString().slice(0, 10);
}

function normalizeElapsedSeconds(elapsedSeconds: number) {
  if (!Number.isFinite(elapsedSeconds)) return 0;
  return Math.max(0, Math.floor(elapsedSeconds));
}

function resolveDailyPracticeTargetSeconds(
  targetSeconds: number | null | undefined,
) {
  if (
    typeof targetSeconds !== 'number' ||
    !Number.isFinite(targetSeconds) ||
    targetSeconds <= 0
  ) {
    return DAILY_STREAK_TARGET_SECONDS;
  }

  return Math.floor(targetSeconds);
}

async function getUserDailyPracticeTargetSeconds(
  userId: string,
  tx?: Prisma.TransactionClient,
) {
  const user = await (tx ?? prisma).user.findUnique({
    where: {
      id: userId,
    },
    select: {
      dailyPracticeTargetSeconds: true,
    },
  });

  return resolveDailyPracticeTargetSeconds(user?.dailyPracticeTargetSeconds);
}

function calculateCurrentStreakDays(achievedDayKeys: Set<string>, now: Date) {
  const todayKey = getUtcDayKey(now);
  const yesterdayKey = getUtcDayKey(new Date(now.getTime() - ONE_DAY_MS));

  const anchorKey = achievedDayKeys.has(todayKey)
    ? todayKey
    : achievedDayKeys.has(yesterdayKey)
      ? yesterdayKey
      : null;

  if (!anchorKey) return 0;

  let streak = 0;
  let cursor = getDateFromUtcDayKey(anchorKey);

  while (achievedDayKeys.has(getDayKeyFromDate(cursor))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - ONE_DAY_MS);
  }

  return streak;
}

async function getOrDefaultTodayRow(
  userId: string,
  now: Date,
): Promise<TodayRow> {
  const day = getDateFromUtcDayKey(getUtcDayKey(now));

  const todayRow = await prisma.dailyPracticeStreak.findFirst({
    where: {
      userId,
      day,
    },
  });

  if (todayRow) return todayRow;

  return {
    day,
    listenedSeconds: 0,
    isCompleted: false,
  };
}

async function buildDailyPracticeStreakStatus(
  userId: string,
  todayRow: TodayRow,
  now: Date,
  targetSeconds?: number,
): Promise<DailyPracticeStreakStatus> {
  const resolvedTargetSeconds =
    targetSeconds ?? (await getUserDailyPracticeTargetSeconds(userId));

  const achievedRows = await prisma.dailyPracticeStreak.findMany({
    where: {
      userId,
      isCompleted: true,
    },
    select: {
      day: true,
    },
  });

  const achievedDayKeys = new Set(
    achievedRows.map((streak) => getDayKeyFromDate(streak.day)),
  );

  const listenedSeconds = todayRow.isCompleted
    ? resolvedTargetSeconds
    : Math.min(todayRow.listenedSeconds, resolvedTargetSeconds);

  return {
    day: getDayKeyFromDate(todayRow.day),
    listenedSeconds,
    targetSeconds: resolvedTargetSeconds,
    completedToday: todayRow.isCompleted,
    currentStreakDays: calculateCurrentStreakDays(achievedDayKeys, now),
    remainingSeconds: Math.max(0, resolvedTargetSeconds - listenedSeconds),
  };
}

export function getDefaultDailyPracticeStreakStatus(
  now = new Date(),
): DailyPracticeStreakStatus {
  return {
    day: getUtcDayKey(now),
    listenedSeconds: 0,
    targetSeconds: DAILY_STREAK_TARGET_SECONDS,
    completedToday: false,
    currentStreakDays: 0,
    remainingSeconds: DAILY_STREAK_TARGET_SECONDS,
  };
}

export async function getDailyPracticeStreakStatus(userId: string) {
  const now = new Date();
  const todayRow = await getOrDefaultTodayRow(userId, now);

  return buildDailyPracticeStreakStatus(userId, todayRow, now);
}

export async function recordDailyPracticeHeartbeat(
  userId: string,
  elapsedSecondsInput: number,
): Promise<DailyPracticeHeartbeatResult> {
  const now = new Date();
  const normalizedElapsed = normalizeElapsedSeconds(elapsedSecondsInput);

  if (normalizedElapsed <= 0) {
    const status = await getDailyPracticeStreakStatus(userId);

    return {
      status,
      justCompleted: false,
      creditedSeconds: 0,
    };
  }

  const requestedSeconds = Math.min(
    normalizedElapsed,
    DAILY_STREAK_MAX_HEARTBEAT_SECONDS,
  );

  const { todayRow, justCompleted, creditedSeconds, targetSeconds } =
    await prisma.$transaction(async (tx) => {
      const targetSeconds = await getUserDailyPracticeTargetSeconds(userId, tx);
      const day = getDateFromUtcDayKey(getUtcDayKey(now));
      const row = await tx.dailyPracticeStreak.upsert({
        where: {
          userId_day: {
            userId,
            day,
          },
        },
        update: {},
        create: {
          userId,
          day,
        },
        select: {
          id: true,
          day: true,
          listenedSeconds: true,
          isCompleted: true,
          completedAt: true,
          lastHeartbeatAt: true,
        },
      });

      const secondsSinceLastHeartbeat = row.lastHeartbeatAt
        ? (now.getTime() - row.lastHeartbeatAt.getTime()) / 1000
        : requestedSeconds;

      const allowedByServerClock = row.lastHeartbeatAt
        ? Math.min(
            DAILY_STREAK_MAX_HEARTBEAT_SECONDS,
            Math.max(
              0,
              Math.floor(
                secondsSinceLastHeartbeat +
                  DAILY_STREAK_SERVER_TIME_TOLERANCE_SECONDS,
              ),
            ),
          )
        : requestedSeconds;

      const creditedSeconds = Math.min(requestedSeconds, allowedByServerClock);

      const updateData: Prisma.DailyPracticeStreakUpdateInput = {
        lastHeartbeatAt: now,
      };

      if (creditedSeconds > 0) {
        updateData.listenedSeconds = {
          increment: creditedSeconds,
        };
      }

      let persisted: TodayRow & { user?: { username: string | null } } =
        await tx.dailyPracticeStreak.update({
          where: {
            id: row.id,
          },
          data: updateData,
          select: {
            id: true,
            day: true,
            listenedSeconds: true,
            isCompleted: true,
            completedAt: true,
            lastHeartbeatAt: true,
            user: {
              select: {
                username: true,
              },
            },
          },
        });

      revalidateTag(`user_${persisted.user?.username}`, 'max');

      delete persisted.user;

      let justCompleted = false;

      if (
        !persisted.isCompleted &&
        persisted.listenedSeconds >= targetSeconds
      ) {
        const completion = await tx.dailyPracticeStreak.updateMany({
          where: {
            id: row.id,
            isCompleted: false,
          },
          data: {
            isCompleted: true,
            completedAt: now,
          },
        });

        justCompleted = completion.count > 0;
        persisted = await tx.dailyPracticeStreak.findUniqueOrThrow({
          where: {
            id: row.id,
          },
          select: {
            id: true,
            day: true,
            listenedSeconds: true,
            isCompleted: true,
            completedAt: true,
            lastHeartbeatAt: true,
          },
        });
      }

      return {
        todayRow: persisted,
        justCompleted,
        creditedSeconds,
        targetSeconds,
      };
    });

  const status = await buildDailyPracticeStreakStatus(
    userId,
    todayRow,
    now,
    targetSeconds,
  );

  return {
    status,
    justCompleted,
    creditedSeconds,
  };
}
