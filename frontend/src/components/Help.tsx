import {
  Plus,
  Send,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../services/api';
import TicketsHelpPage from './TicketsHelpPage';
import type { TicketCategory, CreateTicketRequest } from '../types/tickets';

const Help = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    priority: 'medium',
    description: '',
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const data = await api.getTicketCategories();
        setCategories(data);
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, category: data[0].name }));
        }
      } catch {
        setError('Failed to load categories');
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

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

      await api.createTicket(createData);
      setFormData({
        title: '',
        category: categories.length > 0 ? categories[0].name : '',
        priority: 'medium',
        description: ''
      });
      setShowCreateForm(false);
      setError(null);
    } catch {
      setError('Failed to create ticket. Please try again.');
    }
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
      <TicketsHelpPage />
    </div>
  );
};

export default Help;

