import axios, { AxiosError } from 'axios';
import type { AxiosInstance } from 'axios';
import type { LoginRequest, RegisterRequest, AuthResponse, UserProfile, TwoFactorRequest, PasswordResetRequestRequest, PasswordResetConfirmRequest, PasswordResetResponse } from '../types/auth';
import type { UserSettings, UpdateSettingsRequest, TwoFactorStartRequest, TwoFactorStartResponse, TwoFactorVerifyRequest, TelegramAuthResponse } from '../types/settings';
import type { TransactionCreateRequest, TransactionCreateResponse, BookmakerAccountCreateRequest, BookmakerAccountCreateResponse, AvailableBookmaker, BookmakerUserAccount, Transaction, TransactionSummary } from '../types/finances';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';

class ApiService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    this.axiosInstance.interceptors.request.use((config) => {
      const token = this.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    });

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.removeToken();
          window.location.href = '/login';
        }

        return Promise.reject(error);
      }
    );
  }

  setToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  setRefreshToken(token: string): void {
    localStorage.setItem('refresh_token', token);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  removeToken(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof AxiosError) {
      if (error.response?.data) {
        const data = error.response.data as Record<string, unknown>;

        if (typeof data === 'object' && data !== null) {
          const firstKey = Object.keys(data)[0];

          if (firstKey && Array.isArray(data[firstKey])) {
            return String(data[firstKey][0]);
          }

          if (firstKey && typeof data[firstKey] === 'string') {
            return data[firstKey];
          }

          if (data.message && typeof data.message === 'string') {
            return data.message;
          }

          if (data.detail && typeof data.detail === 'string') {
            return data.detail;
          }

          return JSON.stringify(data);
        }

        if (typeof data === 'string') {
          return data;
        }
      }

      if (error.message) {
        return error.message;
      }
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'An error occurred';
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await this.axiosInstance.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, data);

      if (response.data.access && !response.data.challenge_id) {
        this.setToken(response.data.access);

        if (response.data.refresh) {
          this.setRefreshToken(response.data.refresh);
        }
      }

      return response.data;
    }
    catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }


  async verify2FA(data: TwoFactorRequest): Promise<AuthResponse> {
    try {
      const response = await this.axiosInstance.post<AuthResponse>(API_ENDPOINTS.AUTH.VERIFY_2FA, data);

      if (response.data.access) {
        this.setToken(response.data.access);

        if (response.data.refresh) {
          this.setRefreshToken(response.data.refresh);
        }
      }

      return response.data;
    }
    catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }


  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await this.axiosInstance.post<AuthResponse>(API_ENDPOINTS.AUTH.REGISTER, data);
      if (response.data.access) {
        this.setToken(response.data.access);
        if (response.data.refresh) {
          this.setRefreshToken(response.data.refresh);
        }
      }

      return response.data;
    } catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = this.getRefreshToken();

      if (refreshToken) {
        await this.axiosInstance.post(API_ENDPOINTS.AUTH.LOGOUT, {
          refresh: refreshToken,
        });
      }
    }
    catch (error) {
      console.error('Logout error:', error);
    }
    finally {
      this.removeToken();
    }
  }


  async getCurrentUser(): Promise<UserProfile> {
    try {
      const response = await this.axiosInstance.get<UserProfile>(API_ENDPOINTS.AUTH.ME);
      return response.data;
    }
    catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async getSettings(): Promise<UserSettings> {
    try {
      const response = await this.axiosInstance.get<UserSettings>(API_ENDPOINTS.SETTINGS.GET);
      return response.data;
    }
    catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async updateSettings(data: UpdateSettingsRequest): Promise<UserSettings> {
    try {
      const response = await this.axiosInstance.patch<UserSettings>(API_ENDPOINTS.SETTINGS.UPDATE, data);
      return response.data;
    }
    catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async startTwoFactor(data: TwoFactorStartRequest): Promise<TwoFactorStartResponse> {
    try {
      const response = await this.axiosInstance.post<TwoFactorStartResponse>(API_ENDPOINTS.SETTINGS.TWO_FACTOR_START, data);
      return response.data;
    }
    catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async verifyTwoFactor(data: TwoFactorVerifyRequest): Promise<void> {
    try {
      await this.axiosInstance.post(API_ENDPOINTS.SETTINGS.TWO_FACTOR_VERIFY, data);
    }
    catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async generateTelegramAuthCode(): Promise<TelegramAuthResponse> {
    try {
      const response = await this.axiosInstance.post<TelegramAuthResponse>(API_ENDPOINTS.SETTINGS.TELEGRAM_AUTH_CODE);
      return response.data;
    }
    catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async createTransaction(data: TransactionCreateRequest): Promise<TransactionCreateResponse> {
    try {
      const response = await this.axiosInstance.post<TransactionCreateResponse>(API_ENDPOINTS.FINANCES.TRANSACTION_CREATE, data);
      return response.data;
    } catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async createBookmakerAccount(data: BookmakerAccountCreateRequest): Promise<BookmakerAccountCreateResponse> {
    try {
      const response = await this.axiosInstance.post<BookmakerAccountCreateResponse>(API_ENDPOINTS.FINANCES.BOOKMAKER_ACCOUNT_CREATE, data);
      return response.data;
    } catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async fetchBookmakers(): Promise<AvailableBookmaker[]> {
    try {
      const response = await this.axiosInstance.get<AvailableBookmaker[]>(API_ENDPOINTS.FINANCES.BOOKMAKERS_LIST, {
        headers: { Accept: 'application/json' },
      });
      return response.data;
    } catch (error) {
      try {
        const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.FINANCES.BOOKMAKERS_LIST}`, {
          method: 'GET',
          credentials: 'include',
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) throw new Error('Error: ' + res.status);
        return await res.json() as AvailableBookmaker[];
      } catch {
        throw new Error(this.getErrorMessage(error));
      }
    }
  }

  async fetchBookmakerAccounts(): Promise<BookmakerUserAccount[]> {
    try {
      const response = await this.axiosInstance.get<BookmakerUserAccount[]>(API_ENDPOINTS.FINANCES.BOOKMAKER_ACCOUNTS_LIST, {
        headers: { Accept: 'application/json' },
      });
      return response.data;
    } catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async fetchTransactions(filters?: {
    date_from?: string;
    date_to?: string;
    bookmaker?: string;
    transaction_type?: string;
  }): Promise<Transaction[]> {
    try {
      console.log('fetchTransactions called with filters:', filters);

      // Send filters in the format backend expects (YYYY-MM-DD)
      const params: Record<string, string> = {};
      if (filters?.date_from) {
        // Extract just the date part if it has time
        params['date_from'] = filters.date_from.split('T')[0];
      }

      if (filters?.date_to) {
        // Extract just the date part if it has time
        params['date_to'] = filters.date_to.split('T')[0];
      }

      if (filters?.bookmaker) {
        params['bookmaker'] = filters.bookmaker;
      }

      if (filters?.transaction_type) {
        params['transaction_type'] = filters.transaction_type;
      }

      const response = await this.axiosInstance.get<Transaction[]>(API_ENDPOINTS.FINANCES.TRANSACTIONS_LIST, {
        headers: { Accept: 'application/json' },
        params: Object.keys(params).length > 0 ? params : undefined,
      });
      console.log('fetchTransactions response:', response.data);
      return response.data;
    } catch (error) {
      console.error('fetchTransactions error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  async fetchTransactionsSummary(filters?: {
    date_from?: string;
    date_to?: string;
    bookmaker?: string;
    transaction_type?: string;
  }): Promise<TransactionSummary> {
    try {
      console.log('fetchTransactionsSummary called with filters:', filters);

      const params: Record<string, string> = {};
      if (filters?.date_from) {
        params['date_from'] = filters.date_from.split('T')[0];
      }

      if (filters?.date_to) {
        params['date_to'] = filters.date_to.split('T')[0];
      }

      if (filters?.bookmaker) {
        params['bookmaker'] = filters.bookmaker;
      }

      if (filters?.transaction_type) {
        params['transaction_type'] = filters.transaction_type;
      }

      const response = await this.axiosInstance.get<TransactionSummary>(API_ENDPOINTS.FINANCES.TRANSACTIONS_SUMMARY, {
        headers: { Accept: 'application/json' },
        params: Object.keys(params).length > 0 ? params : undefined,
      });
      console.log('fetchTransactionsSummary response:', response.data);
      return response.data;
    } catch (error) {
      console.error('fetchTransactionsSummary error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  async requestPasswordReset(data: PasswordResetRequestRequest): Promise<PasswordResetResponse> {
    try {
      console.log('Sending password reset request to:', API_ENDPOINTS.AUTH.PASSWORD_RESET_REQUEST);
      console.log('Request data:', data);
      const response = await this.axiosInstance.post<PasswordResetResponse>(
        API_ENDPOINTS.AUTH.PASSWORD_RESET_REQUEST,
        data
      );
      console.log('Password reset response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Password reset request failed:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  async confirmPasswordReset(data: PasswordResetConfirmRequest): Promise<PasswordResetResponse> {
    try {
      console.log('Sending password reset confirmation to:', API_ENDPOINTS.AUTH.PASSWORD_RESET_CONFIRM);
      console.log('Request data:', { ...data, new_password: '***' }); // hide password in logs
      const response = await this.axiosInstance.post<PasswordResetResponse>(
        API_ENDPOINTS.AUTH.PASSWORD_RESET_CONFIRM,
        data
      );
      console.log('Password reset confirmation response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Password reset confirmation failed:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  async resendPasswordReset(data: PasswordResetRequestRequest): Promise<PasswordResetResponse> {
    try {
      console.log('Resending password reset code to:', API_ENDPOINTS.AUTH.PASSWORD_RESET_RESEND);
      console.log('Request data:', data);
      const response = await this.axiosInstance.post<PasswordResetResponse>(
        API_ENDPOINTS.AUTH.PASSWORD_RESET_RESEND,
        data
      );
      console.log('Resend response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Resend password reset failed:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }
}

export const apiService = new ApiService();
