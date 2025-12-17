
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access: string;
  refresh?: string;
  challenge_id?: string;
}

export interface TwoFactorRequest {
  challenge_id: string;
  code: string;
}

export interface PasswordResetRequestRequest {
  email: string;
}

export interface PasswordResetConfirmRequest {
  email: string;
  code: string;
  new_password: string;
}

export interface PasswordResetResponse {
  detail: string;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  registered_at: string;
  is_superuser?: boolean;
  is_staff?: boolean;
  last_login?: string | null;
}

export interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  verify2FA: (challengeId: string, code: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
}
