export interface Bet {
  id?: number;
  event_name: string;
  start_time: string | null | undefined;
  bet_type: number | string;
  line: number | string;
  odds: number | string;
  discipline?: number | string | null;
  result?: string | null;
}

export interface BetType {
  id?: number;
  code: string;
  description?: string;
}

export interface Discipline {
  id: number;
  code: string;
  name?: string;
}

export interface OcrExtractResponse {
  bookmaker_account: number;
  coupon_type: 'SOLO' | 'AKO' | 'SYSTEM';
  bet_stake: string | number;
  placed_at: string;
  bets: Bet[];
}

export interface CreateCouponRequest {
  bookmaker_account: number;
  coupon_type?: 'SOLO' | 'AKO' | 'SYSTEM';
  bet_stake?: string | number;
  stake?: string | number;
  placed_at?: string;
  strategy?: string;
  strategy_id?: number;
  bets?: Bet[];
}

export interface Coupon extends Omit<CreateCouponRequest, 'strategy_id' | 'strategy'> {
  id: number;
  created_at: string;
  updated_at: string;
  user: number;
  bookmaker: string;
  currency: string;
  strategy: string | null;
  potential_payout: number;
  multiplier?: number;
  status?: string;
}
