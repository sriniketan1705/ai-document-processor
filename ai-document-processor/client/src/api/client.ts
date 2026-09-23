import axios from 'axios';

export const TOKEN_KEY = 'idp_token';

const api = axios.create({ baseURL: '/api' });

// attach the JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// if the token expired, clear it and send the user to the login page
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const isAuthCall = error.config?.url?.startsWith('/auth/login') || error.config?.url?.startsWith('/auth/register');
    if (error.response?.status === 401 && !isAuthCall) {
      localStorage.removeItem(TOKEN_KEY);
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || (error.request ? 'Cannot reach the server. Is the backend running?' : error.message);
  }
  return error instanceof Error ? error.message : 'Something went wrong';
}

export default api;
