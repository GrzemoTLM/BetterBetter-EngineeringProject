export interface Strategy {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateStrategyRequest {
  name: string;
  description?: string;
}

