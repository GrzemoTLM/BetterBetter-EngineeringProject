export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL';

export interface BookmakerAccount {
  id: string;
  name: string;
}

export interface TransactionCreateRequest {
  transaction_type: TransactionType;
  amount: number;
  bookmaker_account: number;
}

export interface TransactionCreateResponse {
  id: string;
  transaction_type: TransactionType;
  amount: number;
  bookmaker_account: number;
  status?: string;
}

export interface AvailableBookmaker {
  id: number;
  name: string;
}

export interface BookmakerAccountCreateRequest {
  bookmaker: string;
  external_username: string;
  currency: string;
}

export interface BookmakerAccountCreateResponse {
  id: number;
  bookmaker: string;
  external_username: string;
  currency: string;
  created_at?: string;
}

export interface BookmakerUserAccount {
  id: number;
  bookmaker: string;
  external_username: string;
  currency: string;
}

export type Transaction = {
  id: number;
  user: number;
  transaction_type: TransactionType;
  amount: string;
  created_at: string;
  updated_at: string;
  bookmaker_account: number;
  bookmaker: string;
  currency: string | null;
  display_name?: string;
};

export interface TransactionSummaryByBookmaker {
  bookmaker_id: number;
  bookmaker: string;
  count: number;
  amount: string;
}

export interface TransactionSummaryByDate {
  date: string;
  count: number;
  amount: string;
}

export interface TransactionSummary {
  total_deposited: number;
  total_withdrawn: number;
  net_deposits: number;
  total_transactions?: number;
  by_bookmaker?: TransactionSummaryByBookmaker[];
  by_date?: TransactionSummaryByDate[];
}

