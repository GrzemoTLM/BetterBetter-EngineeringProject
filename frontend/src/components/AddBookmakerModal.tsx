import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import apiService from '../services/api';
import type { AvailableBookmaker } from '../types/finances';

interface AddBookmakerModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const AddBookmakerModal = ({ onClose, onSuccess }: AddBookmakerModalProps) => {
  const [currency, setCurrency] = useState('PLN');
  const [bookmaker, setBookmaker] = useState('');
  const [externalUsername, setExternalUsername] = useState('');
  const [bookmakers, setBookmakers] = useState<AvailableBookmaker[]>([]);
  const [loadingBookmakers, setLoadingBookmakers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currencyOptions = ['USD', 'EUR', 'PLN', 'GBP', 'CAD', 'AUD'];

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const data = await apiService.getAvailableBookmakers();
        if (isMounted) setBookmakers(data);
      } catch {
        if (isMounted) setError('Failed to fetch bookmakers list');
      } finally {
        if (isMounted) setLoadingBookmakers(false);
      }
    };

    load();
    return () => { isMounted = false; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!bookmaker) {
      setError('Please select a bookmaker');
      return;
    }

    if (!externalUsername.trim()) {
      setError('Please enter an account name');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiService.createBookmakerAccount({
        bookmaker,
        external_username: externalUsername.trim(),
        currency,
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create bookmaker account';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background-paper rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-default">
          <h2 className="text-2xl font-bold text-text-primary">
            Add Bookmaker
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-background-table-header rounded-lg transition-colors"
          >
            <X size={24} className="text-text-secondary" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Bookmaker Selection */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Bookmaker
            </label>
            {loadingBookmakers ? (
              <div className="w-full px-4 py-2 border border-default rounded-lg text-sm text-text-secondary">
                Loading bookmakers...
              </div>
            ) : (
              <select
                value={bookmaker}
                onChange={(e) => setBookmaker(e.target.value)}
                className="w-full px-4 py-2 border border-default rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-main focus:border-transparent"
                required
                disabled={isSubmitting}
              >
                <option value="">Select bookmaker</option>
                {bookmakers.map((bm) => (
                  <option key={bm.id} value={bm.name}>
                    {bm.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* External Username (Alias) */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Account Name (Alias)
            </label>
            <input
              type="text"
              value={externalUsername}
              onChange={(e) => setExternalUsername(e.target.value)}
              placeholder="Enter account name"
              className="w-full px-4 py-2 border border-default rounded-lg text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-main focus:border-transparent"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Currency */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-2 border border-default rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-main focus:border-transparent"
              required
            >
              <option value="">Select currency</option>
              {currencyOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>


          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-default text-text-primary rounded-lg px-6 py-3 hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || loadingBookmakers}
              className="flex-1 bg-primary-main text-primary-contrast rounded-lg px-6 py-3 hover:bg-primary-hover transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding...' : 'Add Bookmaker'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBookmakerModal;

