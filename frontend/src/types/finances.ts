// Typy finansowe
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
