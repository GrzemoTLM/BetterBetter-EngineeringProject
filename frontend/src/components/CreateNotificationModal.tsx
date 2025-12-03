import { X, Loader2 } from 'lucide-react';
import { useState } from 'react';
import api, { type AlertRulePayload } from '../services/api';

interface CreateNotificationModalProps {
  onClose: () => void;
}

const CreateNotificationModal = ({ onClose }: CreateNotificationModalProps) => {
  const [metric, setMetric] = useState('roi');
  const [comparator, setComparator] = useState<'lt' | 'lte' | 'gt' | 'gte' | 'eq'>('lt');
  const [thresholdValue, setThresholdValue] = useState('');
  const [windowDays, setWindowDays] = useState('30');
  const [customWindowDays, setCustomWindowDays] = useState('');
  const [message, setMessage] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const metrics = [
    { id: 'roi', label: 'ROI' },
    { id: 'yield', label: 'Yield' },
    { id: 'loss', label: 'Loss amount' },
    { id: 'streak_loss', label: 'Consecutive losses' },
    { id: 'custom', label: 'Custom' },
  ];

  const comparators = [
    { id: 'lt', label: '< (less than)' },
    { id: 'lte', label: '≤ (less or equal)' },
    { id: 'gt', label: '> (greater than)' },
    { id: 'gte', label: '≥ (greater or equal)' },
    { id: 'eq', label: '= (equal)' },
  ];

  const windowPresets = [
    { id: '7', label: 'Last 7 days' },
    { id: '30', label: 'Last 30 days' },
    { id: '365', label: 'Last 365 days' },
    { id: 'custom', label: 'Custom window' },
  ];

  const effectiveWindowDays = windowDays === 'custom' ? customWindowDays : windowDays;
  const isCustomWindowSelected = windowDays === 'custom';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!thresholdValue || !effectiveWindowDays) {
      setSubmitError('Threshold and window are required.');
      return;
    }

    const payload: AlertRulePayload = {
      rule_type: metric,
      metric,
      comparator,
      threshold_value: thresholdValue,
      window_days: Number(effectiveWindowDays),
      ...(message.trim() ? { message: message.trim() } : {}),
    };

    try {
      setSubmitting(true);
      await api.createAlertRule(payload);
      onClose();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create notification';
      setSubmitError(errorMsg);
    } finally {
      setSubmitting(false);
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
          {/* Metric & Comparator */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Metric
              </label>
              <select
                value={metric}
                onChange={(e) => setMetric(e.target.value)}
                className="w-full px-4 py-2 border border-default rounded-lg text-sm"
              >
                {metrics.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Comparator
              </label>
              <select
                value={comparator}
                onChange={(e) => setComparator(e.target.value as typeof comparator)}
                className="w-full px-4 py-2 border border-default rounded-lg text-sm"
              >
                {comparators.map((comp) => (
                  <option key={comp.id} value={comp.id}>
                    {comp.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Threshold */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Threshold Value
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={thresholdValue}
              onChange={(e) => setThresholdValue(e.target.value)}
              className="w-full px-4 py-2 border border-default rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-main focus:border-transparent"
              required
            />
          </div>

          {/* Window */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Window (days)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {windowPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setWindowDays(preset.id)}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    windowDays === preset.id
                      ? 'bg-primary-main text-white border-transparent'
                      : 'border-default text-text-primary hover:bg-gray-50'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            {isCustomWindowSelected && (
              <input
                type="number"
                min="1"
                className="mt-2 w-full px-4 py-2 border border-default rounded-lg text-sm"
                placeholder="Enter custom window in days"
                value={customWindowDays}
                onChange={(e) => setCustomWindowDays(e.target.value)}
                required
              />
            )}
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Custom Message (optional)
            </label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Seria porażek osiągnęła {value} kuponów"
              className="w-full px-4 py-2 border border-default rounded-lg text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-main focus:border-transparent"
            />
          </div>

          {submitError && (
            <div className="text-sm text-status-error bg-red-50 border border-red-200 rounded px-3 py-2">
              {submitError}
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
              disabled={submitting}
              className="flex-1 bg-primary-main text-primary-contrast rounded-lg px-6 py-3 hover:bg-primary-hover transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 size={18} className="animate-spin" />}
              {submitting ? 'Creating...' : 'Create Notification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateNotificationModal;
