import React, { useState } from 'react';
import { X } from 'lucide-react';

interface DateFormatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFormat: string;
  onSave: (format: string) => Promise<void>;
}

const DateFormatModal: React.FC<DateFormatModalProps> = ({
  isOpen,
  onClose,
  currentFormat,
  onSave,
}) => {
  const [selectedFormat, setSelectedFormat] = useState(currentFormat);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateFormats = [
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY', example: '25/11/2025' },
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY', example: '11/25/2025' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD', example: '2025-11-25' },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await onSave(selectedFormat);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save date format');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background-paper rounded-xl shadow-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-text-primary">Change Date Format</h2>
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
          {dateFormats.map((format) => (
            <label
              key={format.value}
              className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedFormat === format.value
                  ? 'border-primary-main bg-blue-50'
                  : 'border-border-divider hover:border-border-hover'
              }`}
            >
              <div className="flex items-center">
                <input
                  type="radio"
                  name="dateFormat"
                  value={format.value}
                  checked={selectedFormat === format.value}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="mr-3 w-4 h-4"
                />
                <div>
                  <div className="font-medium text-text-primary">{format.label}</div>
                  <div className="text-sm text-text-secondary">Example: {format.example}</div>
                </div>
              </div>
            </label>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 px-4 py-2 border border-border-divider rounded-lg hover:bg-background-table-header transition-colors disabled:opacity-50"
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

export default DateFormatModal;

