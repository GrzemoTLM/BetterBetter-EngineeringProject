import axios, { AxiosError } from 'axios';
import type { AxiosInstance } from 'axios';
import type { LoginRequest, RegisterRequest, AuthResponse, UserProfile, TwoFactorRequest, PasswordResetRequestRequest, PasswordResetConfirmRequest, PasswordResetResponse } from '../types/auth';
import type { UserSettings, UpdateSettingsRequest, TwoFactorStartRequest, TwoFactorStartResponse, TwoFactorVerifyRequest, TelegramAuthResponse, TelegramConnectionStatus } from '../types/settings';
import type { TransactionCreateRequest, TransactionCreateResponse, BookmakerAccountCreateRequest, BookmakerAccountCreateResponse, Transaction, TransactionSummary } from '../types/finances';
import type { TicketCategory, CreateTicketRequest, Ticket, CreateCommentRequest, TicketComment } from '../types/tickets';
import type { Strategy, CreateStrategyRequest } from '../types/strategies';
import type { Coupon, CreateCouponRequest, BetType, OcrExtractResponse } from '../types/coupons';
import type { Bet } from '../types/coupons';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';

export interface SystemMetrics {
  cpu_usage: number;
  memory: {
    total: number;
    used: number;
    percent: number;
  };
  disk: {
    total: number;
    used: number;
    percent: number;
  };
  db_latency_ms: number;
  error_rate: number;
  queue_length: number;
}

export interface LoggedInUser {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
  is_superuser: boolean;
  status: string;
  last_login: string | null;
  session_key: string;
  session_expire_date: string;
}

export interface CouponSummary {
  // shape will be clarified from backend response; keep it generic for now
  [key: string]: unknown;
}

export interface BalanceTrendPoint {
  date: string;
  balance: number;
}

export interface BalanceTrendResponse {
  points: BalanceTrendPoint[];
}

export interface MonthlyBalanceTrendPoint {
  date: string;
  balance: string;
  monthly_profit: string;
  coupon_count: number;
}

export interface MonthlyBalanceTrendResponse {
  points: MonthlyBalanceTrendPoint[];
}

// New: summary per bookmaker accounts
export type BookmakerAccountsSummaryItem = {
  account_id: number;
  bookmaker: string;
  external_username: string;
  balance?: string | number;
  deposited_total?: string | number;
  withdrawn_total?: string | number;
  net_cashflow?: string | number;
  currency?: string;
};

export type BookmakerAccountsSummary = BookmakerAccountsSummaryItem[];

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

  async getSystemMetrics(): Promise<SystemMetrics> {
    try {
      const response = await this.axiosInstance.get<SystemMetrics>(API_ENDPOINTS.MONITORING.SYSTEM_METRICS);
      console.log('[API] getSystemMetrics - status:', response.status);
      console.log('[API] getSystemMetrics - data:', response.data);
      return response.data;
    } catch (error) {
      console.error('[API] getSystemMetrics - error raw:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  async getLoggedInUsers(): Promise<LoggedInUser[]> {
    try {
      const response = await this.axiosInstance.get<LoggedInUser[]>(API_ENDPOINTS.MONITORING.LOGGED_IN_USERS);
      console.log('[API] getLoggedInUsers - status:', response.status);
      console.log('[API] getLoggedInUsers - data:', response.data);
      return response.data;
    } catch (error) {
      console.error('[API] getLoggedInUsers - error raw:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  async getAllUsers(): Promise<UserProfile[]> {
    try {
      const response = await this.axiosInstance.get<UserProfile[] | { results: UserProfile[] }>('/api/users/users/');
      console.log('[API] getAllUsers - status:', response.status);
      console.log('[API] getAllUsers - data:', response.data);
      
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && typeof response.data === 'object' && 'results' in response.data) {
        return (response.data as { results: UserProfile[] }).results;
      } else {
        throw new Error('Unexpected users data format');
      }
    } catch (error) {
      console.error('[API] getAllUsers - error raw:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  async toggleUserStatus(userId: number, isActive: boolean): Promise<void> {
    try {
      const response = await this.axiosInstance.patch(`/api/users/users/${userId}/`, {
        is_active: isActive,
      });
      console.log('[API] toggleUserStatus - status:', response.status);
      return response.data;
    } catch (error) {
      console.error('[API] toggleUserStatus - error:', error);
      throw new Error(this.getErrorMessage(error));
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
      console.log('[API] getSettings - calling', API_ENDPOINTS.SETTINGS.GET);
      const response = await this.axiosInstance.get<UserSettings>(API_ENDPOINTS.SETTINGS.GET);
      console.log('[API] getSettings - status:', response.status);
      console.log('[API] getSettings - data:', response.data);
      return response.data;
    }
    catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async updateSettings(data: UpdateSettingsRequest): Promise<UserSettings> {
    try {
      console.log('[API] updateSettings - URL:', API_ENDPOINTS.SETTINGS.UPDATE);
      console.log('[API] updateSettings - payload:', JSON.parse(JSON.stringify(data)));
      const response = await this.axiosInstance.patch<UserSettings>(API_ENDPOINTS.SETTINGS.UPDATE, data);
      console.log('[API] updateSettings - status:', response.status);
      console.log('[API] updateSettings - response data:', response.data);
      return response.data;
    }
    catch (error) {
      console.error('[API] updateSettings - error raw:', error);
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

  // New: fetch bookmaker accounts summary
  async getBookmakerAccountsSummary(params?: Record<string, string>): Promise<BookmakerAccountsSummary> {
    try {
      const response = await this.axiosInstance.get<BookmakerAccountsSummary>(API_ENDPOINTS.FINANCES.BOOKMAKER_ACCOUNTS_SUMMARY, {
        params,
      });
      console.log('[API] getBookmakerAccountsSummary - status:', response.status);
      console.log('[API] getBookmakerAccountsSummary - params:', params);
      console.log('[API] getBookmakerAccountsSummary - data sample:', Array.isArray(response.data) ? response.data.slice(0, 3) : response.data);
      return response.data;
    } catch (error) {
      console.error('[API] getBookmakerAccountsSummary - error raw:', error);
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
      console.log('[API] createCoupon - URL:', API_ENDPOINTS.COUPONS.CREATE);
      console.log('[API] createCoupon - Payload:', JSON.parse(JSON.stringify(data)));
      const response = await this.axiosInstance.post<Coupon>(API_ENDPOINTS.COUPONS.CREATE, data);
      console.log('[API] createCoupon - Status:', response.status);
      console.log('[API] createCoupon - Data:', response.data);
      return response.data;
    } catch (error) {
      console.error('[API] createCoupon - Error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  async createEmptyCoupon(bookmakerAccountId: number, stake: string, opts?: { strategy?: string; strategy_id?: number; coupon_type?: 'SOLO' | 'AKO' | 'SYSTEM' }): Promise<Coupon> {
    try {
      const data: CreateCouponRequest = {
        bookmaker_account: bookmakerAccountId,
        coupon_type: opts?.coupon_type ?? 'SOLO',
        bet_stake: stake,
        placed_at: new Date().toISOString(),
        ...(opts?.strategy_id ? { strategy_id: opts.strategy_id } : {}),
        ...(opts?.strategy && !opts?.strategy_id ? { strategy: opts.strategy } : {}),
        bets: [],
      };
      console.log('[API] createEmptyCoupon - URL:', API_ENDPOINTS.COUPONS.CREATE);
      console.log('[API] createEmptyCoupon - Payload:', JSON.parse(JSON.stringify(data)));
      const response = await this.axiosInstance.post<Coupon>(API_ENDPOINTS.COUPONS.CREATE, data);
      console.log('[API] createEmptyCoupon - Status:', response.status);
      console.log('[API] createEmptyCoupon - Data:', response.data);
      return response.data;
    } catch (error) {
      console.error('[API] createEmptyCoupon - Error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  async getCoupon(id: number): Promise<Coupon> {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

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
      discipline?: string | number | null;
    }
  ): Promise<Coupon> {
    try {
      const normalizedBet = {
        ...bet,
        line: typeof bet.line === 'string' && bet.line.trim() !== '' ? bet.line.trim() : bet.line,
        odds: typeof bet.odds === 'string' && bet.odds.trim() !== '' ? bet.odds.trim() : bet.odds,
        bet_type: bet.bet_type,
        discipline: bet.discipline ?? null,
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
      const token = this.getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

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

  async fetchBetTypesByDiscipline(disciplineId: number): Promise<BetType[]> {
    try {
      const response = await this.axiosInstance.get<BetType[]>(API_ENDPOINTS.COUPONS.BET_TYPES, {
        params: { discipline: disciplineId }
      });
      return response.data;
    } catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async getDisciplines(): Promise<Array<{ id: number; code: string; name?: string }>> {
    try {
      const response = await this.axiosInstance.get<Array<{ id: number; code: string; name?: string }>>(API_ENDPOINTS.COUPONS.DISCIPLINES);
      return response.data;
    } catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async getDisciplineDetail(id: number | string): Promise<{ id: number; code: string; name?: string }> {
    try {
      const response = await this.axiosInstance.get<{ id: number; code: string; name?: string }>(API_ENDPOINTS.COUPONS.DISCIPLINE_DETAIL(id));
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

  async updateCoupon(id: number, data: Partial<CreateCouponRequest> & { [key: string]: unknown }): Promise<Coupon> {
    try {
      const url = `${API_ENDPOINTS.COUPONS.LIST}${id}/`;
      console.log('[API] updateCoupon - URL:', url);
      console.log('[API] updateCoupon - Payload:', JSON.parse(JSON.stringify(data)));
      const response = await this.axiosInstance.patch<Coupon>(url, data);
      console.log('[API] updateCoupon - Status:', response.status);
      console.log('[API] updateCoupon - Data:', response.data);
      return response.data;
    } catch (error) {
      console.error('[API] updateCoupon - Error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  // OCR: upload image and parse coupon data
  async extractCouponViaOCR(file: File): Promise<OcrExtractResponse> {
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('image_name', file.name);
      const url = `${API_BASE_URL}/api/coupons/coupons/ocr/parse/`;
      console.log('[API] OCR parse - URL:', url);
      console.log('[API] OCR parse - File name:', file.name, 'size:', file.size);
      const response = await this.axiosInstance.post<OcrExtractResponse>(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log('[API] OCR parse - Status:', response.status);
      console.log('[API] OCR parse - Data:', response.data);
      return response.data;
    } catch (error) {
      console.error('[API] OCR parse - Error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  async getCouponSummary(params?: Record<string, string>): Promise<CouponSummary> {
    try {
      const response = await this.axiosInstance.get<CouponSummary>(API_ENDPOINTS.COUPONS.SUMMARY, {
        params,
      });
      console.log('[API] getCouponSummary - status:', response.status);
      console.log('[API] getCouponSummary - params:', params);
      console.log('[API] getCouponSummary - data:', response.data);
      return response.data;
    } catch (error) {
      console.error('[API] getCouponSummary - error raw:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  async getBalanceTrend(params?: { days?: number }): Promise<BalanceTrendPoint[]> {
    try {
      const response = await this.axiosInstance.get<BalanceTrendResponse>(
        API_ENDPOINTS.COUPONS.BALANCE_TREND,
        { params }
      );
      console.log('[API] getBalanceTrend - status:', response.status);
      console.log('[API] getBalanceTrend - params:', params);
      console.log('[API] getBalanceTrend - data:', response.data);
      return response.data.points || [];
    } catch (error) {
      console.error('[API] getBalanceTrend - error raw:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  async getMonthlyBalanceTrend(params?: { months?: number }): Promise<MonthlyBalanceTrendPoint[]> {
    try {
      const response = await this.axiosInstance.get<MonthlyBalanceTrendResponse>(
        API_ENDPOINTS.COUPONS.MONTHLY_BALANCE_TREND,
        { params }
      );
      console.log('[API] getMonthlyBalanceTrend - status:', response.status);
      console.log('[API] getMonthlyBalanceTrend - params:', params);
      console.log('[API] getMonthlyBalanceTrend - data:', response.data);
      return response.data.points || [];
    } catch (error) {
      console.error('[API] getMonthlyBalanceTrend - error raw:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }
}

export default new ApiService();
