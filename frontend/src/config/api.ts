export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8000';

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
  FINANCES: {
    TRANSACTION_CREATE: '/api/finances/transactions/create/',
    BOOKMAKERS_LIST: '/api/finances/bookmakers/',
    BOOKMAKER_ACCOUNT_CREATE: '/api/finances/bookmakers/accounts/create/',
    BOOKMAKER_ACCOUNTS_LIST: '/api/finances/bookmakers/accounts/',
  },
  COUPONS: {
    BOOKMAKER_ACCOUNT_CREATE_OLD: '/api/coupons/bookmaker-accounts/', // pozostawione tymczasowo jeśli gdzieś użyte (do usunięcia po weryfikacji)
  },
};
