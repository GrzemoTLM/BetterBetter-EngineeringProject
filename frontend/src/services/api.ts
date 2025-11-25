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
      // Silently handle logout errors
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

  async getTransaction(transactionId: string): Promise<Transaction> {
    try {
      const response = await this.axiosInstance.get<Transaction>(`${API_ENDPOINTS.FINANCES.TRANSACTION_DETAIL}/${transactionId}`);
      return response.data;
    } catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async getTransactions(queryParams?: Record<string, unknown>): Promise<TransactionSummary> {
    try {
      const response = await this.axiosInstance.get<TransactionSummary>(API_ENDPOINTS.FINANCES.TRANSACTION_LIST, {
        params: queryParams,
      });
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

  async getBookmakerAccounts(): Promise<BookmakerAccountCreateResponse[]> {
    try {
      const response = await this.axiosInstance.get<BookmakerAccountCreateResponse[]>(API_ENDPOINTS.FINANCES.BOOKMAKER_ACCOUNT_LIST);
      return response.data;
    } catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async getAvailableBookmakers(): Promise<AvailableBookmaker[]> {
    try {
      const response = await this.axiosInstance.get<AvailableBookmaker[]>(API_ENDPOINTS.FINANCES.AVAILABLE_BOOKMAKERS);
      return response.data;
    } catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async linkBookmakerAccount(data: { bookmaker_id: string, username: string, password: string }): Promise<void> {
    try {
      await this.axiosInstance.post(API_ENDPOINTS.FINANCES.LINK_BOOKMAKER_ACCOUNT, data);
    } catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async unlinkBookmakerAccount(accountId: string): Promise<void> {
    try {
      await this.axiosInstance.delete(`${API_ENDPOINTS.FINANCES.UNLINK_BOOKMAKER_ACCOUNT}/${accountId}`);
    } catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async resetPasswordRequest(data: PasswordResetRequestRequest): Promise<PasswordResetResponse> {
    try {
      const response = await this.axiosInstance.post<PasswordResetResponse>(API_ENDPOINTS.AUTH.PASSWORD_RESET_REQUEST, data);
      return response.data;
    } catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async resetPasswordConfirm(data: PasswordResetConfirmRequest): Promise<AuthResponse> {
    try {
      const response = await this.axiosInstance.post<AuthResponse>(API_ENDPOINTS.AUTH.PASSWORD_RESET_CONFIRM, data);
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
}

export default new ApiService();
