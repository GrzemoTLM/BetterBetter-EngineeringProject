export interface Bet {
  event_name: string;
  start_time: string;
  bet_type: number | string;
  line: number | string;
  odds: number | string;
}

export interface BetType {
  id?: number;
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
  user: number;
  bookmaker: string;
  currency: string;
  strategy: number | null;
  potential_payout: number;
  multiplier?: number;
  status?: string;
}
