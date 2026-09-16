import axios from 'axios';

function getApiUrl() {
  const configuredUrl = process.env.NOTEFINDER_YTMUSIC_API_URL?.trim();

  if (!configuredUrl) {
    throw new Error(
      'NOTEFINDER_YTMUSIC_API_URL is not configured. Set it in the app runtime environment.',
    );
  }

  let apiUrl: URL;

  try {
    apiUrl = new URL(configuredUrl);
  } catch {
    throw new Error(
      'NOTEFINDER_YTMUSIC_API_URL must be a valid absolute URL, such as https://example.com/.',
    );
  }

  if (apiUrl.protocol !== 'http:' && apiUrl.protocol !== 'https:') {
    throw new Error(
      'NOTEFINDER_YTMUSIC_API_URL must use the http:// or https:// protocol.',
    );
  }

  return apiUrl.toString();
}

export const getNotefinderYtMusicClient = async () => {
  return axios.create({
    baseURL: getApiUrl(),
  });
};
