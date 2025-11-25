export interface UserSettings {
  nickname: string | null;
  email?: string | null;
  auto_coupon_payoff: boolean;
  automatic_payoff?: boolean;
  predefined_bet_values?: string | null;
  monthly_budget_limit: string | null;
  locale: string;
  language?: string;
  date_format: string;
  basic_currency?: string;
  notification_gate: 'email' | 'telegram' | 'none';
  notification_gate_ref: string | null;
  telegram_chat_id?: string | null;
  two_factor_enabled: boolean;
  two_factor_method: 'sms' | 'email' | 'mobile_app' | 'totp' | 'none';
  telegram_auth_code: string | null;
}

export interface UpdateSettingsRequest {
  nickname?: string | null;
  auto_coupon_payoff?: boolean;
  automatic_payoff?: boolean;
  monthly_budget_limit?: string | null;
  locale?: string;
  language?: string;
  date_format?: string;
  basic_currency?: string;
  notification_gate?: 'email' | 'telegram' | 'none';
  notification_gate_ref?: string | null;
  two_factor_enabled?: boolean;
  two_factor_method?: 'sms' | 'email' | 'mobile_app' | 'totp' | 'none';
}

export interface TwoFactorStartRequest {
  method: 'totp' | 'email';
}

export interface TwoFactorStartResponse {
  otp_uri?: string;
  secret?: string;
  message?: string;
}

export interface TwoFactorVerifyRequest {
  code: string;
}

export interface TelegramAuthResponse {
  message: string;
  data: {
    code: string;
    created_at: string;
    expires_at: string;
  };
}
