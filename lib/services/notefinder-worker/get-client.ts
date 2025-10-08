import axios from 'axios';

const client = axios.create({
  baseURL: process.env.NOTEFINDER_WORKER_API_URL,
});

export const getNotefinderWorkerClient = async () => {
  return client;
};
