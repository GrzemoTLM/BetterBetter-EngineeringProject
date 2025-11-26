export interface Bet {
  id?: number; // backend bet id if available
  event_name: string;
  start_time: string | null | undefined;
  bet_type: number | string;
  line: number | string;
  odds: number | string;
  result?: string | null; // outcome returned by backend (won/lost/null)
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
