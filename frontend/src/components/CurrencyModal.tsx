import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Currency } from '../context/CurrencyContext';

interface CurrencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCurrency: Currency | undefined;
  onSave: (currency: Currency) => Promise<void>;
}

const CurrencyModal: React.FC<CurrencyModalProps> = ({
  isOpen,
  onClose,
  currentCurrency,
  onSave,
}) => {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currentCurrency || 'USD');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currencies = [
    { value: 'USD' as Currency, label: 'USD ($)', symbol: '$', example: '$1,234.56' },
    { value: 'EUR' as Currency, label: 'EUR (€)', symbol: '€', example: '1,234.56 €' },
    { value: 'PLN' as Currency, label: 'PLN (zł)', symbol: 'zł', example: '1,234.56 zł' },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      console.log('CurrencyModal: Saving currency', selectedCurrency);
      await onSave(selectedCurrency);
      console.log('CurrencyModal: Save successful');
      onClose();
    } catch (err) {
      console.error('CurrencyModal: Save failed', err);
      setError(err instanceof Error ? err.message : 'Failed to save currency');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background-paper rounded-xl shadow-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-text-primary">Change Currency</h2>
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

        <div className="space-y-3 mb-6">
          {currencies.map((currency) => (
            <label
              key={currency.value}
              className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedCurrency === currency.value
                  ? 'border-primary-main bg-blue-50'
                  : 'border-border-light hover:border-border-medium'
              }`}
            >
              <div className="flex items-center">
                <input
                  type="radio"
                  name="currency"
                  value={currency.value}
                  checked={selectedCurrency === currency.value}
                  onChange={(e) => setSelectedCurrency(e.target.value as Currency)}
                  className="mr-3 w-4 h-4"
                />
                <div>
                  <div className="font-medium text-text-primary">{currency.label}</div>
                  <div className="text-sm text-text-secondary">Example: {currency.example}</div>
                </div>
              </div>
            </label>
          ))}
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
            disabled={isSaving}
            className="flex-1 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CurrencyModal;

