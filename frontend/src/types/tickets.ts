export interface TicketCategory {
  name: string;
  description: string;
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  category: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface CreateCommentRequest {
  content: string;
}

export interface TicketComment {
  id: number;
  author: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  content: string;
  created_at: string;
  updated_at: string;
  is_staff_comment: boolean;
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  category: string;
  category_display: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  status_display: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  priority_display: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
  assigned_to?: number | null;
  comments: TicketComment[];
}

