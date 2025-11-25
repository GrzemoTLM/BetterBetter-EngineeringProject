import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

interface PredefinedBetValuesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentValues: number[] | null | undefined;
  onSave: (values: number[]) => Promise<void>;
}

const PredefinedBetValuesModal: React.FC<PredefinedBetValuesModalProps> = ({
  isOpen,
  onClose,
  currentValues,
  onSave,
}) => {
  const [values, setValues] = useState<number[]>(currentValues || []);
  const [inputValue, setInputValue] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setValues(currentValues || []);
      setInputValue('');
      setError(null);
    }
  }, [isOpen, currentValues]);

  const handleAddValue = () => {
    const num = parseFloat(inputValue);

    if (!inputValue.trim()) {
      setError('Please enter a value');
      return;
    }

    if (isNaN(num) || num <= 0) {
      setError('Value must be a positive number');
      return;
    }

    if (values.includes(num)) {
      setError('This value already exists');
      return;
    }

    setValues([...values, num].sort((a, b) => a - b));
    setInputValue('');
    setError(null);
  };

  const handleRemoveValue = (value: number) => {
    setValues(values.filter((v) => v !== value));
  };

  const handleSave = async () => {
    if (values.length === 0) {
      setError('Please add at least one value');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSave(values);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save values');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddValue();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background-paper rounded-xl shadow-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-text-primary">Predefined Bet Values</h2>
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

        <div className="space-y-4 mb-6">
          {/* Input Section */}
          <div className="flex gap-2">
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter bet value (e.g., 10)"
              className="flex-1 px-4 py-2 border border-border-light rounded-lg text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-main focus:border-transparent"
              disabled={isSaving}
              step="0.01"
              min="0"
            />
            <button
              onClick={handleAddValue}
              disabled={isSaving}
              className="px-3 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              <Plus size={16} />
              Add
            </button>
          </div>

          {/* Values List */}
          {values.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-text-secondary">Current values:</p>
              <div className="flex flex-wrap gap-2">
                {values.map((value) => (
                  <div
                    key={value}
                    className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full"
                  >
                    <span className="text-sm font-medium text-text-primary">{value}</span>
                    <button
                      onClick={() => handleRemoveValue(value)}
                      disabled={isSaving}
                      className="p-0.5 hover:bg-blue-100 rounded transition-colors"
                    >
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
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
            disabled={isSaving || values.length === 0}
            className="flex-1 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PredefinedBetValuesModal;

