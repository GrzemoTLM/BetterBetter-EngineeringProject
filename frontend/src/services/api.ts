
import axios, { AxiosError } from 'axios';
import type { AxiosInstance } from 'axios';
import type { LoginRequest, RegisterRequest, AuthResponse, UserProfile, TwoFactorRequest } from '../types/auth';
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

        if (typeof data === 'object') {
          const firstKey = Object.keys(data)[0];

          if (firstKey && Array.isArray(data[firstKey])) {
            return data[firstKey][0];
          }

          if (firstKey && typeof data[firstKey] === 'string') {
            return data[firstKey];
          }
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
    const response = await this.axiosInstance.get<UserProfile>(API_ENDPOINTS.AUTH.ME);
    return response.data;
  }
}

export const apiService = new ApiService();
