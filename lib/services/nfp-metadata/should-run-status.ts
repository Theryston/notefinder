import { TrackStatus } from '@/lib/generated/prisma/client';

export const STATUS_IN_ORDER: TrackStatus[] = [
  TrackStatus.QUEUED,
  TrackStatus.DOWNLOADING_THUMBNAILS,
  TrackStatus.DOWNLOADING_VIDEO,
  TrackStatus.EXTRACTING_VOCALS,
  TrackStatus.DETECTING_VOCALS_NOTES,
  TrackStatus.EXTRACTING_LYRICS,
  TrackStatus.ERROR,
  TrackStatus.COMPLETED,
];

export function shouldRunStatus(
  currentStatus: TrackStatus,
  newStatus: TrackStatus,
) {
  const currentStatusIndex = STATUS_IN_ORDER.indexOf(currentStatus);
  const newStatusIndex = STATUS_IN_ORDER.indexOf(newStatus);

  if (currentStatusIndex === -1 || newStatusIndex === -1) {
    return false;
  }

  return currentStatusIndex <= newStatusIndex;
}
