import axios, { AxiosError } from 'axios';
import type { AxiosInstance } from 'axios';
import type { LoginRequest, RegisterRequest, AuthResponse, UserProfile, TwoFactorRequest, PasswordResetRequestRequest, PasswordResetConfirmRequest, PasswordResetResponse } from '../types/auth';
import type { UserSettings, UpdateSettingsRequest, TwoFactorStartRequest, TwoFactorStartResponse, TwoFactorVerifyRequest, TelegramAuthResponse, TelegramConnectionStatus } from '../types/settings';
import type { TransactionCreateRequest, TransactionCreateResponse, BookmakerAccountCreateRequest, BookmakerAccountCreateResponse, AvailableBookmaker, Transaction, TransactionSummary } from '../types/finances';
import type { TicketCategory, CreateTicketRequest, Ticket, CreateCommentRequest, TicketComment } from '../types/tickets';
import type { Strategy, CreateStrategyRequest } from '../types/strategies';
import type { Coupon, CreateCouponRequest, BetType } from '../types/coupons';
import type { Bet } from '../types/coupons';
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
      (response) => {
        return response;
      },
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
      if (error.response?.data !== undefined) {
        const raw = error.response.data as unknown;

        console.log('Backend error response:', raw);

        if (typeof raw === 'string' && raw.includes('<title')) {
          const match = raw.match(/<title>([^<]+)<\/title>/i);
          if (match && match[1]) {
            return match[1].trim();
          }

          return 'Server HTML error';
        }

        if (typeof raw === 'string') {
          return raw;
        }

        if (raw && typeof raw === 'object') {
          const data = raw as Record<string, unknown>;

          if (typeof data.message === 'string') {
            return data.message;
          }

          if (typeof data.detail === 'string') {
            return data.detail;
          }

          for (const key of Object.keys(data)) {
            const v = data[key];

            if (Array.isArray(v) && v.length > 0) {
              return String(v[0]);
            }

            if (typeof v === 'string') {
              return v;
            }
          }

          try {
            return JSON.stringify(data);
          } catch {
            // ignore
          }
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
    catch {
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

  async getTelegramConnectionStatus(): Promise<TelegramConnectionStatus | null> {
    try {
      const response = await this.axiosInstance.get<TelegramConnectionStatus>(API_ENDPOINTS.SETTINGS.TELEGRAM_CONNECT);

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 404) {

        return null; // not connected yet
      }

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

  async fetchTransactions(queryParams?: Record<string, unknown>): Promise<Transaction[]> {
    try {
      const response = await this.axiosInstance.get<Transaction[]>(API_ENDPOINTS.FINANCES.TRANSACTIONS_LIST, {
        params: queryParams,
      });
      return response.data;
    } catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async fetchTransactionsSummary(queryParams?: Record<string, unknown>): Promise<TransactionSummary> {
    try {
      const response = await this.axiosInstance.get<TransactionSummary>(API_ENDPOINTS.FINANCES.TRANSACTIONS_SUMMARY, {
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
      const response = await this.axiosInstance.get<BookmakerAccountCreateResponse[]>(API_ENDPOINTS.FINANCES.BOOKMAKER_ACCOUNTS_LIST);
      return response.data;
    } catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async getAvailableBookmakers(): Promise<AvailableBookmaker[]> {
    try {
      const response = await this.axiosInstance.get<AvailableBookmaker[]>(API_ENDPOINTS.FINANCES.BOOKMAKERS_LIST);
      return response.data;
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

  async getTicketCategories(): Promise<TicketCategory[]> {
    try {
      const response = await this.axiosInstance.get<TicketCategory[]>(API_ENDPOINTS.TICKETS.CATEGORIES);
      return response.data;
    } catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async createTicket(data: CreateTicketRequest): Promise<Ticket> {
    try {
      const response = await this.axiosInstance.post<Ticket>(API_ENDPOINTS.TICKETS.CREATE, data);
      return response.data;
    } catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async getTickets(queryParams?: Record<string, unknown>): Promise<Ticket[]> {
    try {
      const response = await this.axiosInstance.get<Ticket[]>(API_ENDPOINTS.TICKETS.LIST, {
        params: queryParams,
      });
      return response.data;
    } catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async getTicketDetail(id: string): Promise<Ticket> {
    try {
      const response = await this.axiosInstance.get<Ticket>(API_ENDPOINTS.TICKETS.DETAIL(id));
      return response.data;
    } catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async addCommentToTicket(ticketId: string | number, data: CreateCommentRequest): Promise<TicketComment> {
    try {
      const url = API_ENDPOINTS.TICKETS.ADD_COMMENT(ticketId.toString());
      const response = await this.axiosInstance.post<TicketComment>(url, data);
      return response.data;
    } catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async getTicketComments(ticketId: string | number): Promise<TicketComment[]> {
    try {
      const response = await this.axiosInstance.get<TicketComment[]>(
        API_ENDPOINTS.TICKETS.COMMENTS,
        {
          params: { ticket_id: ticketId },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async updateTicketStatus(ticketId: string | number, status: string): Promise<Ticket> {
    try {
      const response = await this.axiosInstance.patch<Ticket>(
        API_ENDPOINTS.TICKETS.DETAIL(ticketId.toString()),
        { status }
      );
      return response.data;
    } catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  // Strategies
  async getStrategies(): Promise<Strategy[]> {
    try {
      const response = await this.axiosInstance.get<Strategy[]>(API_ENDPOINTS.STRATEGIES.LIST);
      return response.data;
    } catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async getStrategyDetail(id: number): Promise<Strategy> {
    try {
      const response = await this.axiosInstance.get<Strategy>(API_ENDPOINTS.STRATEGIES.DETAIL(id));
      return response.data;
    } catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async createStrategy(data: CreateStrategyRequest): Promise<Strategy> {
    try {
      const response = await this.axiosInstance.post<Strategy>(API_ENDPOINTS.STRATEGIES.CREATE, data);
      return response.data;
    } catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async updateStrategy(id: number, data: CreateStrategyRequest): Promise<Strategy> {
    try {
      const response = await this.axiosInstance.patch<Strategy>(API_ENDPOINTS.STRATEGIES.UPDATE(id), data);
      return response.data;
    } catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async deleteStrategy(id: number): Promise<void> {
    try {
      await this.axiosInstance.delete(API_ENDPOINTS.STRATEGIES.DELETE(id));
    } catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  // Coupons
  async createCoupon(data: CreateCouponRequest): Promise<Coupon> {
    try {
      const response = await this.axiosInstance.post<Coupon>(API_ENDPOINTS.COUPONS.CREATE, data);
      return response.data;
    } catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async createEmptyCoupon(bookmakerAccountId: number, stake: string): Promise<Coupon> {
    try {
      const data = {
        bookmaker_account: bookmakerAccountId,
        coupon_type: 'SOLO',
        bet_stake: stake,
        placed_at: new Date().toISOString(),
        bets: [],
      };
      const response = await this.axiosInstance.post<Coupon>(API_ENDPOINTS.COUPONS.CREATE, data);
      return response.data;
    } catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async getCoupon(id: number): Promise<Coupon> {
    try {
      const url = `${API_ENDPOINTS.COUPONS.LIST}${id}/`;
      const response = await this.axiosInstance.get<Coupon>(url);
      return response.data;
    } catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async addBetsToCoupon(
    couponId: number,
    bets: Array<{
      event_name: string;
      bet_type: string;
      line: string;
      odds: string;
      start_time: string;
    }>
  ): Promise<Coupon> {
    try {
      const response = await this.axiosInstance.post<Coupon>(
        `${API_ENDPOINTS.COUPONS.LIST}${couponId}/bets/`,
        { bets }
      );
      return response.data;
    } catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async addSingleBetToCoupon(
    couponId: number,
    bet: {
      event_name: string;
      bet_type: string | number;
      line: string | number;
      odds: string | number;
      start_time: string;
    }
  ): Promise<Coupon> {
    try {
      // Normalizacja pól – zamień na number jeśli to string liczb
      const normalizedBet = {
        ...bet,
        line: typeof bet.line === 'string' && bet.line.trim() !== '' ? bet.line.trim() : bet.line,
        odds: typeof bet.odds === 'string' && bet.odds.trim() !== '' ? bet.odds.trim() : bet.odds,
        bet_type: bet.bet_type, // jeśli mamy id będzie number
      };

      const payload = { bets: [normalizedBet] };
      const response = await this.axiosInstance.post<Coupon>(
        `${API_ENDPOINTS.COUPONS.LIST}${couponId}/bets/`,
        payload
      );
      return response.data;
    } catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async updateCouponStake(couponId: number, stake: string): Promise<Coupon> {
    try {
      const response = await this.axiosInstance.patch<Coupon>(
        `${API_ENDPOINTS.COUPONS.LIST}${couponId}/`,
        { bet_stake: stake }
      );
      return response.data;
    } catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async recalculateCoupon(couponId: number): Promise<Coupon> {
    try {
      const response = await this.axiosInstance.post<Coupon>(
        `${API_ENDPOINTS.COUPONS.LIST}${couponId}/recalc/`
      );
      return response.data;
    } catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async deleteCoupon(couponId: number): Promise<void> {
    try {
      await this.axiosInstance.delete(`${API_ENDPOINTS.COUPONS.LIST}${couponId}/`);
    } catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async getCoupons(): Promise<Coupon[]> {
    try {
      const response = await this.axiosInstance.get<Coupon[]>(API_ENDPOINTS.COUPONS.LIST);
      return response.data;
    } catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async getBetTypes(): Promise<BetType[]> {
    try {
      const response = await this.axiosInstance.get<BetType[]>(API_ENDPOINTS.COUPONS.BET_TYPES);
      return response.data;
    } catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async forceWinCoupon(couponId: number): Promise<Coupon> {
    try {
      const url = API_ENDPOINTS.COUPONS.FORCE_WIN(couponId);
      const response = await this.axiosInstance.post<Coupon>(url);
      return response.data;
    } catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async settleBet(couponId: number, betId: number | string, status: 'won' | 'lost'): Promise<Bet> {
    try {
      const url = API_ENDPOINTS.COUPONS.BET_SETTLE(couponId, betId);
      const payload = { result: status, status };
      const response = await this.axiosInstance.patch<Bet>(url, payload);
      return response.data;
    } catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }
}

export default new ApiService();
