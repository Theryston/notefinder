import axios from 'axios';

const client = axios.create({
  baseURL: process.env.NOTEFINDER_YTMUSIC_API_URL,
});

export const getNotefinderYtMusicClient = async () => {
  return client;
};
