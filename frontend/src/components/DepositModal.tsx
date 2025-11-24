import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import type { BookmakerUserAccount } from '../types/finances';

interface DepositModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

const DepositModal = ({ onClose, onSuccess }: DepositModalProps) => {
  const [accountId, setAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [accounts, setAccounts] = useState<BookmakerUserAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await apiService.fetchBookmakerAccounts();
        if (mounted) setAccounts(data);
      } catch {
        if (mounted) setError('Failed to fetch bookmaker accounts');
      } finally {
        if (mounted) setLoadingAccounts(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!accountId) {
      setError('Please select a bookmaker account');
      return;
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiService.createTransaction({
        transaction_type: 'DEPOSIT',
        amount: Number(amount),
        bookmaker_account: Number(accountId),
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create deposit';
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
          <h2 className="text-2xl font-bold text-text-primary">Deposit</h2>
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

          {/* Bookmaker Account */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Bookmaker Account
            </label>
            {loadingAccounts ? (
              <div className="w-full px-4 py-2 border border-default rounded-lg text-sm text-text-secondary">
                Loading accounts...
              </div>
            ) : (
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-4 py-2 border border-default rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-main focus:border-transparent"
                required
                disabled={isSubmitting}
              >
                <option value="">Select bookmaker account</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={String(acc.id)}>
                    {acc.bookmaker} / {acc.external_username}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full px-4 py-2 border border-default rounded-lg text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-main focus:border-transparent"
              required
              min="0"
              step="0.01"
            />
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
              disabled={isSubmitting}
              className="flex-1 bg-primary-main text-primary-contrast rounded-lg px-6 py-3 hover:bg-primary-hover transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Processing...' : 'Deposit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DepositModal;

