import {
  HelpCircle,
  Plus,
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  FileText,
} from 'lucide-react';
import { useState } from 'react';

interface Ticket {
  id: string;
  title: string;
  category: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
  description: string;
  messages?: TicketMessage[];
}

interface TicketMessage {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  isAdmin: boolean;
}

const Help = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'technical',
    priority: 'medium',
    description: '',
  });

  // Dummy tickets data
  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: '1',
      title: 'Cannot add new bookmaker',
      category: 'technical',
      status: 'in-progress',
      priority: 'high',
      createdAt: '2024-01-15',
      updatedAt: '2024-01-16',
      description:
        'I am unable to add a new bookmaker to my account. The form keeps showing an error.',
      messages: [
        {
          id: '1',
          author: 'You',
          content:
            'I am unable to add a new bookmaker to my account. The form keeps showing an error.',
          timestamp: '2024-01-15 10:30',
          isAdmin: false,
        },
        {
          id: '2',
          author: 'Support Team',
          content:
            'Thank you for reporting this issue. We are investigating the problem and will get back to you shortly.',
          timestamp: '2024-01-15 14:20',
          isAdmin: true,
        },
        {
          id: '3',
          author: 'Support Team',
          content:
            'We have identified the issue. Please try clearing your browser cache and try again. If the problem persists, please let us know.',
          timestamp: '2024-01-16 09:15',
          isAdmin: true,
        },
      ],
    },
    {
      id: '2',
      title: 'Question about statistics calculation',
      category: 'question',
      status: 'resolved',
      priority: 'medium',
      createdAt: '2024-01-10',
      updatedAt: '2024-01-12',
      description:
        'How is the ROI calculated in the Statistics view? I see different values than expected.',
      messages: [
        {
          id: '1',
          author: 'You',
          content:
            'How is the ROI calculated in the Statistics view? I see different values than expected.',
          timestamp: '2024-01-10 11:00',
          isAdmin: false,
        },
        {
          id: '2',
          author: 'Support Team',
          content:
            'ROI is calculated as (Total Profit / Total Staked) * 100. The calculation includes all bets within the selected date range. If you need more details, please check our documentation.',
          timestamp: '2024-01-11 15:30',
          isAdmin: true,
        },
      ],
    },
    {
      id: '3',
      title: 'Feature request: Export to Excel',
      category: 'feature',
      status: 'open',
      priority: 'low',
      createdAt: '2024-01-20',
      updatedAt: '2024-01-20',
      description:
        'It would be great to have an option to export statistics data directly to Excel format.',
    },
    {
      id: '4',
      title: 'Account settings not saving',
      category: 'bug',
      status: 'closed',
      priority: 'high',
      createdAt: '2024-01-05',
      updatedAt: '2024-01-08',
      description:
        'Changes made in Settings are not being saved. I have tried multiple times.',
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
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
      case 'in-progress':
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
      default:
        return 'text-gray-600';
    }
  };

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const newTicket: Ticket = {
      id: String(tickets.length + 1),
      title: formData.title,
      category: formData.category,
      status: 'open',
      priority: formData.priority as 'low' | 'medium' | 'high',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      description: formData.description,
      messages: [
        {
          id: '1',
          author: 'You',
          content: formData.description,
          timestamp: new Date().toLocaleString(),
          isAdmin: false,
        },
      ],
    };
    setTickets([newTicket, ...tickets]);
    setFormData({ title: '', category: 'technical', priority: 'medium', description: '' });
    setShowCreateForm(false);
  };

  const categories = [
    { value: 'technical', label: 'Technical Issue' },
    { value: 'question', label: 'Question' },
    { value: 'feature', label: 'Feature Request' },
    { value: 'bug', label: 'Bug Report' },
    { value: 'account', label: 'Account Issue' },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-text-primary">Help & Support</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-primary-main text-primary-contrast rounded-lg px-4 py-2 hover:bg-primary-hover transition-colors flex items-center gap-2 font-medium text-sm"
        >
          <Plus size={18} />
          Create Ticket
        </button>
      </div>

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
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
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
                    category: 'technical',
                    priority: 'medium',
                    description: '',
                  });
                }}
                className="px-4 py-2 rounded-md text-sm font-medium text-text-secondary hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-md text-sm font-medium bg-primary-main text-primary-contrast hover:bg-primary-hover transition-colors flex items-center gap-2"
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
                    className="text-text-secondary hover:text-text-primary transition-colors"
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
                    {selectedTicket.status.replace('-', ' ').toUpperCase()}
                  </span>
                  <span
                    className={`text-xs font-medium ${getPriorityColor(
                      selectedTicket.priority
                    )}`}
                  >
                    Priority: {selectedTicket.priority.toUpperCase()}
                  </span>
                  <span className="text-xs text-text-secondary">
                    Created: {selectedTicket.createdAt}
                  </span>
                  <span className="text-xs text-text-secondary">
                    Updated: {selectedTicket.updatedAt}
                  </span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="space-y-4 mt-6">
              {selectedTicket.messages?.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 rounded-lg ${
                    message.isAdmin
                      ? 'bg-blue-50 border border-blue-200'
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm text-text-primary">
                      {message.isAdmin ? '👤 Support Team' : '👤 You'}
                    </span>
                    <span className="text-xs text-text-secondary">
                      {message.timestamp}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
              ))}
            </div>

            {/* Reply Section */}
            <div className="mt-6 pt-6 border-t border-border-default">
              <h4 className="text-sm font-medium text-text-primary mb-3">Add Reply</h4>
              <textarea
                placeholder="Type your message..."
                rows={4}
                className="w-full px-3 py-2 border border-border-default rounded-md text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-main focus:border-transparent resize-none mb-3"
              />
              <button className="px-4 py-2 rounded-md text-sm font-medium bg-primary-main text-primary-contrast hover:bg-primary-hover transition-colors flex items-center gap-2">
                <Send size={16} />
                Send Reply
              </button>
            </div>
          </div>
        ) : (
          /* Tickets List View */
          <div className="divide-y divide-border-default">
            {tickets.length === 0 ? (
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
                            {ticket.status.replace('-', ' ').toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-text-secondary mb-3 line-clamp-2">
                          {ticket.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-text-secondary">
                          <span className="capitalize">{ticket.category}</span>
                          <span className={`font-medium ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority.toUpperCase()} Priority
                          </span>
                          <span>Created: {ticket.createdAt}</span>
                          {ticket.messages && ticket.messages.length > 1 && (
                            <span className="flex items-center gap-1">
                              <MessageSquare size={12} />
                              {ticket.messages.length} messages
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

