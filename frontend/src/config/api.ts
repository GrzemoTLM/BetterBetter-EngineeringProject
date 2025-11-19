
export const API_BASE_URL = '';
export const API_VERSION = 'v1';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/users/login/',
    REGISTER: '/api/users/register/',
    LOGOUT: '/api/users/logout/',
    ME: '/api/users/me/',
    VERIFY_2FA: '/api/users/auth/login/verify-2fa/',
  },
  SETTINGS: {
    GET: '/api/users/settings/',
    UPDATE: '/api/users/settings/',
    TWO_FACTOR_START: '/api/users/two-factor/start/',
    TWO_FACTOR_VERIFY: '/api/users/two-factor/verify/',
    TELEGRAM_AUTH_CODE: '/api/users/telegram/auth-code/generate/',
    TELEGRAM_CONNECT: '/api/users/telegram/connect/',
  },
};

