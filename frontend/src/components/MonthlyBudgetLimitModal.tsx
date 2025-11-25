import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface MonthlyBudgetLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLimit: string | number | undefined;
  onSave: (limit: string) => Promise<void>;
}

const MonthlyBudgetLimitModal: React.FC<MonthlyBudgetLimitModalProps> = ({
  isOpen,
  onClose,
  currentLimit,
  onSave,
}) => {
  const [budgetLimit, setBudgetLimit] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && currentLimit) {
      // Remove any currency formatting if present
      const cleanValue = String(currentLimit).replace(/[^\d.]/g, '');
      setBudgetLimit(cleanValue);
    }
  }, [isOpen, currentLimit]);

  const handleSave = async () => {
    if (!budgetLimit || parseFloat(budgetLimit) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSave(budgetLimit);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save budget limit');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSaving) {
      handleSave();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background-paper rounded-xl shadow-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-text-primary">Monthly Budget Limit</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-background-table-header rounded-lg transition-colors"
            disabled={isSaving}
          >
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-text-primary mb-2">
            Enter monthly budget limit (in your preferred currency)
          </label>
          <input
            type="number"
            value={budgetLimit}
            onChange={(e) => setBudgetLimit(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="e.g., 1000.00"
            step="0.01"
            min="0"
            className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:border-primary-main focus:ring-1 focus:ring-primary-main"
            disabled={isSaving}
          />
          <p className="text-xs text-text-secondary mt-2">
            Set a limit to monitor your monthly spending and stay within budget.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 px-4 py-2 border border-border-light rounded-lg hover:bg-background-table-header transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !budgetLimit}
            className="flex-1 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MonthlyBudgetLimitModal;

