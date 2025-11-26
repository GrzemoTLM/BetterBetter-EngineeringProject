export interface Bet {
  event_name: string;
  start_time: string;
  bet_type: string;
  line: number | string;
  odds: number | string;
}

export interface BetType {
  code: string;
  description?: string;
}

export interface CreateCouponRequest {
  bookmaker_account: number;
  coupon_type: 'SOLO' | 'AKO' | 'SYSTEM';
  bet_stake: string | number;
  placed_at: string;
  bets: Bet[];
}

export interface Coupon extends CreateCouponRequest {
  id: number;
  created_at: string;
  updated_at: string;
  status: string;
}

