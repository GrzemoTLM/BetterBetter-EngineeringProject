import { useState } from 'react';
import api from '../services/api';
import type { Ticket } from '../types/tickets';
import {
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  ArrowLeft,
} from 'lucide-react';

const Tickets = () => {
  const [showTickets, setShowTickets] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentContent, setCommentContent] = useState('');
  const [loadingComment, setLoadingComment] = useState(false);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await api.getTickets();
      setTickets(data);
      setError(null);
    } catch {
      setError('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleShowTickets = () => {
    setShowTickets(true);
    fetchTickets();
  };

  const handleSelectTicket = async (ticket: Ticket) => {
    try {
      setLoadingDetail(true);
      const detailedTicket = await api.getTicketDetail(ticket.id.toString());
      setSelectedTicket(detailedTicket);
    } catch {
      setError('Failed to load ticket details');
    } finally {
      setLoadingDetail(false);
    }
  };

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

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedTicket || newStatus === selectedTicket.status) return;

    try {
      await api.updateTicketStatus(selectedTicket.id, newStatus);
      const updatedTicket = await api.getTicketDetail(selectedTicket.id.toString());
      setSelectedTicket(updatedTicket);
      setTickets(
        tickets.map((ticket) =>
          ticket.id === selectedTicket.id ? updatedTicket : ticket
        )
      );
    } catch {
      setError('Failed to update ticket status');
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
      setError(null);
    } catch {
      setError('Failed to add comment');
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

  if (!showTickets) {
    return (
      <div className="bg-background-paper rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-text-primary mb-3">
          Support Tickets
        </h3>
        <button
          onClick={handleShowTickets}
          className="w-full bg-primary-main text-primary-contrast rounded-lg px-4 py-2 text-sm hover:bg-primary-main/90 transition-colors font-medium"
        >
          Show Tickets
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={() => {
          setShowTickets(false);
          setSelectedTicket(null);
        }}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-background-paper rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-4">
            {selectedTicket ? (
              <button
                onClick={() => setSelectedTicket(null)}
                className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors text-sm font-medium"
              >
                <ArrowLeft size={16} />
                Back
              </button>
            ) : (
              <h3 className="text-lg font-semibold text-text-primary">Support Tickets</h3>
            )}
            <button
              onClick={() => {
                setShowTickets(false);
                setSelectedTicket(null);
              }}
              className="text-text-secondary hover:text-text-primary transition-colors text-xl"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {loadingDetail ? (
              <div className="text-center py-8 text-text-secondary">
                Loading ticket details...
              </div>
            ) : selectedTicket ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-text-primary mb-3">
                    {selectedTicket.title}
                  </h3>

                  <div className="flex flex-wrap gap-3 mb-4 items-center">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-text-secondary">Status</span>
                      <select
                        value={selectedTicket.status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        className={`px-3 py-1 rounded text-xs font-medium border-none cursor-pointer ${getStatusColor(
                          selectedTicket.status
                        )}`}
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                    <span className={`text-xs font-medium ${getPriorityColor(selectedTicket.priority)}`}>
                      Priority: {selectedTicket.priority_display}
                    </span>
                    <span className="text-xs text-text-secondary">
                      {formatDate(selectedTicket.created_at)}
                    </span>
                  </div>

                  <div className="bg-gray-50 rounded p-3 text-sm text-text-secondary max-h-40 overflow-y-auto">
                    <p className="whitespace-pre-wrap">{selectedTicket.description}</p>
                  </div>
                </div>

                {selectedTicket.comments && selectedTicket.comments.length > 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-sm font-semibold text-text-primary mb-3">
                      Comments ({selectedTicket.comments.length})
                    </p>
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {selectedTicket.comments.map((comment) => (
                        <div key={comment.id} className="bg-gray-50 p-3 rounded">
                          <div className="font-medium text-text-primary text-sm mb-1">
                            {comment.author.first_name || comment.author.username}
                            {comment.is_staff_comment && (
                              <span className="ml-2 text-blue-600 text-xs">(Staff)</span>
                            )}
                          </div>
                          <p className="text-text-secondary text-sm whitespace-pre-wrap">
                            {comment.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-4">
                  <form onSubmit={handleSubmitComment} className="space-y-2">
                    <textarea
                      placeholder="Add comment..."
                      rows={3}
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                      className="w-full px-3 py-2 border border-border-default rounded text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-main focus:border-transparent resize-none"
                    />
                    <button
                      type="submit"
                      disabled={loadingComment || !commentContent.trim()}
                      className="w-full px-4 py-2 rounded text-sm font-medium bg-primary-main text-primary-contrast hover:bg-primary-main/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Send size={16} />
                      Send Comment
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div>
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700 mb-4">
                    {error}
                  </div>
                )}

                {loading ? (
                  <div className="text-center py-8 text-text-secondary">
                    Loading tickets...
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="text-center py-8 text-text-secondary">
                    No tickets yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tickets
                      .sort((a, b) => {
                        if (a.status === 'resolved' && b.status !== 'resolved') return 1;
                        if (a.status !== 'resolved' && b.status === 'resolved') return -1;
                        if (a.status === 'closed' && b.status !== 'closed') return 1;
                        if (a.status !== 'closed' && b.status === 'closed') return -1;
                        return 0;
                      })
                      .map((ticket) => {
                        const StatusIcon = getStatusIcon(ticket.status);
                        return (
                          <div
                            key={ticket.id}
                            onClick={() => handleSelectTicket(ticket)}
                            className="p-3 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="text-sm font-semibold text-text-primary truncate">
                                    {ticket.title}
                                  </p>
                                  <span
                                    className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${getStatusColor(
                                      ticket.status
                                    )}`}
                                  >
                                    {ticket.status_display}
                                  </span>
                                </div>
                                <p className="text-sm text-text-secondary line-clamp-2">
                                  {ticket.description}
                                </p>
                              </div>
                              <StatusIcon size={16} className="text-gray-400 flex-shrink-0 mt-1" />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Tickets;

