import {
  HelpCircle,
  Plus,
  FileText,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  MessageSquare,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../services/api';
import type { TicketCategory, Ticket, CreateTicketRequest } from '../types/tickets';

const Help = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentContent, setCommentContent] = useState('');
  const [loadingComment, setLoadingComment] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    priority: 'medium',
    description: '',
  });

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const data = await api.getTicketCategories();
        setCategories(data);
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, category: data[0].name }));
        }
      } catch (error) {
        console.error('Failed to fetch ticket categories:', error);
        setError('Failed to load categories');
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Fetch tickets on component mount
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoadingTickets(true);
        const data = await api.getTickets();
        setTickets(data);
      } catch (error) {
        console.error('Failed to fetch tickets:', error);
        setError('Failed to load tickets');
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

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Title and description are required');
      return;
    }

    try {
      const createData: CreateTicketRequest = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority as 'low' | 'medium' | 'high' | 'critical',
      };

      const newTicket = await api.createTicket(createData);
      setTickets([newTicket, ...tickets]);
      setFormData({
        title: '',
        category: categories.length > 0 ? categories[0].name : '',
        priority: 'medium',
        description: ''
      });
      setShowCreateForm(false);
      setError(null);
    } catch (error) {
      console.error('Failed to create ticket:', error);
      setError('Failed to create ticket. Please try again.');
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

      // Update the selected ticket with the new comment
      setSelectedTicket({
        ...selectedTicket,
        comments: [...existingComments, newComment],
      });

      // Update the ticket in the list
      setTickets(
        tickets.map((ticket) =>
          ticket.id === selectedTicket.id
            ? { ...ticket, comments: [...(ticket.comments || []), newComment] }
            : ticket
        )
      );

      setCommentContent('');
      setError(null);
    } catch (error) {
      console.error('Failed to add comment:', error);
      setError('Failed to add comment. Please try again.');
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
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-text-primary">Help & Support</h1>
        <button
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            setError(null);
          }}
          className="bg-primary-main text-primary-contrast rounded-lg px-4 py-2 hover:bg-primary-main/90 transition-colors flex items-center gap-2 font-medium text-sm"
        >
          <Plus size={18} />
          Create Ticket
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Create Ticket Form */}
      {showCreateForm && (
        <div className="bg-background-paper rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            Create New Ticket
          </h2>
          <form onSubmit={handleSubmitTicket} className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-text-secondary mb-1"
              >
                Title
              </label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Brief description of your issue"
                className="w-full px-3 py-2 border border-border-default rounded-md text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-main focus:border-transparent"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-text-secondary mb-1"
                >
                  Category
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-border-default rounded-md text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-main focus:border-transparent"
                  required
                  disabled={loadingCategories}
                >
                  {loadingCategories ? (
                    <option value="">Loading categories...</option>
                  ) : categories.length === 0 ? (
                    <option value="">No categories available</option>
                  ) : (
                    categories.map((cat) => (
                      <option key={cat.name} value={cat.name}>
                        {cat.description}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label
                  htmlFor="priority"
                  className="block text-sm font-medium text-text-secondary mb-1"
                >
                  Priority
                </label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border-default rounded-md text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-main focus:border-transparent"
                  required
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-text-secondary mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Please provide detailed information about your issue..."
                rows={6}
                className="w-full px-3 py-2 border border-border-default rounded-md text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-main focus:border-transparent resize-none"
                required
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setFormData({
                    title: '',
                    category: categories.length > 0 ? categories[0].name : '',
                    priority: 'medium',
                    description: '',
                  });
                  setError(null);
                }}
                className="px-4 py-2 rounded-md text-sm font-medium text-text-secondary hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-md text-sm font-medium bg-primary-main text-primary-contrast hover:bg-primary-main/90 transition-colors flex items-center gap-2"
              >
                <Send size={16} />
                Submit Ticket
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tickets List */}
      <div className="bg-background-paper rounded-xl shadow-sm">
        <div className="p-5 border-b border-border-default">
          <div className="flex items-center gap-2">
            <FileText size={20} className="text-primary-main" />
            <h2 className="text-lg font-semibold text-text-primary">My Tickets</h2>
            <span className="text-xs text-text-secondary bg-gray-100 px-2 py-1 rounded">
              {tickets.length} total
            </span>
          </div>
        </div>

        {selectedTicket ? (
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
                    onClick={() => setSelectedTicket(ticket)}
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
    </div>
  );
};

export default Help;

