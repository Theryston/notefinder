import { Queue } from 'bullmq';

export const addNotesQueue = new Queue('add-notes', {
  connection: {
    url: process.env.NOTEFINDER_WORKER_REDIS_URL,
  },
});
