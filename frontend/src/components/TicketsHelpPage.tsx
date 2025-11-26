import { useState, useEffect } from 'react';
import api from '../services/api';
import type { Ticket } from '../types/tickets';
import {
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';

const TicketsHelpPage = () => {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [loadingComment, setLoadingComment] = useState(false);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoadingTickets(true);
        const data = await api.getTickets();
        setTickets(data);
      } catch {

      } finally {
        setLoadingTickets(false);
      }
    };

    fetchTickets();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return AlertCircle;
      case 'in_progress':
        return Clock;
      case 'resolved':
        return CheckCircle2;
      case 'closed':
        return XCircle;
      default:
        return AlertCircle;
    }
  };

  const handleSelectTicket = async (ticket: Ticket) => {
    try {
      setLoadingDetail(true);
      const detailedTicket = await api.getTicketDetail(ticket.id.toString());
      setSelectedTicket(detailedTicket);
      } catch {
        // Silently fail
      } finally {
      setLoadingDetail(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'text-gray-600';
      case 'medium':
        return 'text-yellow-600';
      case 'high':
        return 'text-red-600';
      case 'critical':
        return 'text-red-800';
      default:
        return 'text-gray-600';
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!commentContent.trim() || !selectedTicket) {
      return;
    }

    try {
      setLoadingComment(true);
      const newComment = await api.addCommentToTicket(selectedTicket.id, {
        content: commentContent,
      });

      const existingComments = selectedTicket.comments || [];
      const updatedComments = [...existingComments, newComment];

      const updatedTicket = {
        ...selectedTicket,
        comments: updatedComments,
      };

      setSelectedTicket(updatedTicket);

      setTickets(
        tickets.map((ticket) =>
          ticket.id === selectedTicket.id
            ? updatedTicket
            : ticket
        )
      );

      setCommentContent('');
    } catch {
      // Silently fail
    } finally {
      setLoadingComment(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-background-paper rounded-xl shadow-sm">
      <div className="p-5 border-b border-border-default">
        <div className="flex items-center gap-2">
          <Clock size={20} className="text-primary-main" />
          <h2 className="text-lg font-semibold text-text-primary">My Tickets</h2>
          <span className="text-xs text-text-secondary bg-gray-100 px-2 py-1 rounded">
            {tickets.length} total
          </span>
        </div>
      </div>

      {loadingDetail ? (
        <div className="p-5 text-center text-text-secondary">
          Loading ticket details...
        </div>
      ) : selectedTicket ? (
        /* Ticket Detail View */
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="text-text-secondary hover:text-text-primary transition-colors text-sm font-medium"
                >
                  ← Back to tickets
                </button>
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">
                {selectedTicket.title}
              </h3>
              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                    selectedTicket.status
                  )}`}
                >
                  {selectedTicket.status_display}
                </span>
                <span
                  className={`text-xs font-medium ${getPriorityColor(
                    selectedTicket.priority
                  )}`}
                >
                  Priority: {selectedTicket.priority_display}
                </span>
                <span className="text-xs text-text-secondary">
                  Created: {formatDate(selectedTicket.created_at)}
                </span>
                <span className="text-xs text-text-secondary">
                  Updated: {formatDate(selectedTicket.updated_at)}
                </span>
              </div>
              <p className="text-sm text-text-secondary mt-4 whitespace-pre-wrap">
                {selectedTicket.description}
              </p>
            </div>
          </div>

          {/* Comments */}
          {selectedTicket.comments && selectedTicket.comments.length > 0 && (
            <div className="mt-6 pt-6 border-t border-border-default">
              <h4 className="text-sm font-semibold text-text-primary mb-4">
                Comments ({selectedTicket.comments.length})
              </h4>
              <div className="space-y-4">
                {selectedTicket.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`p-4 rounded-lg ${
                      comment.is_staff_comment
                        ? 'bg-blue-50 border border-blue-200'
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-text-primary">
                          {comment.author.first_name || comment.author.username}
                        </span>
                        {comment.is_staff_comment && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Support Team
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-text-secondary">
                        {formatDate(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reply Section */}
          <div className="mt-6 pt-6 border-t border-border-default">
            <h4 className="text-sm font-medium text-text-primary mb-3">Add Reply</h4>
            <form onSubmit={handleSubmitComment} className="space-y-3">
              <textarea
                placeholder="Type your message..."
                rows={4}
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                className="w-full px-3 py-2 border border-border-default rounded-md text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-main focus:border-transparent resize-none"
              />
              <button
                type="submit"
                disabled={loadingComment || !commentContent.trim()}
                className="px-4 py-2 rounded-md text-sm font-medium bg-primary-main text-primary-contrast hover:bg-primary-main/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={16} />
                {loadingComment ? 'Sending...' : 'Send Reply'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Tickets List View */
        <div className="divide-y divide-border-default">
          {loadingTickets ? (
            <div className="p-8 text-center text-text-secondary">
              <div className="flex justify-center mb-3">
                <div className="animate-spin">
                  <Clock size={32} className="text-primary-main" />
                </div>
              </div>
              <p className="text-sm">Loading tickets...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-8 text-center text-text-secondary">
              <HelpCircle size={48} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">No tickets yet</p>
              <p className="text-xs mt-1">Create your first ticket to get help</p>
            </div>
          ) : (
            tickets.map((ticket) => {
              const StatusIcon = getStatusIcon(ticket.status);
              return (
                <div
                  key={ticket.id}
                  onClick={() => handleSelectTicket(ticket)}
                  className="p-5 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-base font-semibold text-text-primary">
                          {ticket.title}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${getStatusColor(
                            ticket.status
                          )}`}
                        >
                          <StatusIcon size={12} />
                          {ticket.status_display}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary mb-3 line-clamp-2">
                        {ticket.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-text-secondary flex-wrap">
                        <span className="capitalize">{ticket.category_display}</span>
                        <span className={`font-medium ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority_display} Priority
                        </span>
                        <span>Created: {formatDate(ticket.created_at)}</span>
                        {ticket.comments && ticket.comments.length > 0 && (
                          <span className="flex items-center gap-1">
                            <MessageSquare size={12} />
                            {ticket.comments.length} comments
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default TicketsHelpPage;

