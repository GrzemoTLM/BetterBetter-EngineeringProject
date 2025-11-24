import { X } from 'lucide-react';
import { useState } from 'react';

interface CreateNotificationModalProps {
  onClose: () => void;
}

const CreateNotificationModal = ({ onClose }: CreateNotificationModalProps) => {
  const [notificationType, setNotificationType] = useState<string>('');
  const [value, setValue] = useState('');

  const notificationTypes = [
    { id: 'yield', label: 'Przekroczenie Yield', placeholder: 'Enter yield threshold (%)' },
    { id: 'lose_streak', label: 'Lose Streak', placeholder: 'Enter number of losses' },
    { id: 'roi', label: 'ROI Threshold', placeholder: 'Enter ROI threshold (%)' },
    { id: 'balance', label: 'Balance Threshold', placeholder: 'Enter balance amount' },
  ];

  const selectedType = notificationTypes.find((type) => type.id === notificationType);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (notificationType && value) {
      // Handle notification creation logic here
      console.log('Create notification:', { notificationType, value });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background-paper rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-default">
          <h2 className="text-2xl font-bold text-text-primary">
            Create Custom Notification
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
          {/* Notification Type */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Notification Type
            </label>
            <select
              value={notificationType}
              onChange={(e) => {
                setNotificationType(e.target.value);
                setValue(''); // Reset value when type changes
              }}
              className="w-full px-4 py-2 border border-default rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-main focus:border-transparent"
              required
            >
              <option value="">Select notification type</option>
              {notificationTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Value Input */}
          {selectedType && (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Value
              </label>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={selectedType.placeholder}
                className="w-full px-4 py-2 border border-default rounded-lg text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-main focus:border-transparent"
                required
                step={notificationType === 'lose_streak' ? '1' : '0.01'}
                min="0"
              />
            </div>
          )}

          {/* Preview */}
          {notificationType && value && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Notification:</span> Alert when{' '}
                <span className="font-semibold">{selectedType?.label}</span> reaches{' '}
                <span className="font-semibold">{value}</span>
                {notificationType === 'yield' || notificationType === 'roi'
                  ? '%'
                  : notificationType === 'balance'
                  ? '$'
                  : ''}
              </p>
            </div>
          )}

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
              disabled={!notificationType || !value}
              className="flex-1 bg-primary-main text-primary-contrast rounded-lg px-6 py-3 hover:bg-primary-hover transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Notification
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateNotificationModal;

