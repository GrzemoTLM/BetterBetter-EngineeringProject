import { Bell, Plus, Trash2, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../services/api';
import type { UserSettings } from '../types/settings';

interface Report {
  id: number;
  query?: Record<string, unknown> | null;
  query_name?: string | null;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  is_active: boolean;
  delivery_method: string;
  delivery_methods: string[];
  schedule_payload?: Record<string, unknown> | null;
  next_run?: string | null;
  created_at: string;
  updated_at: string;
}

interface PeriodicReportsProps {
  userSettings: UserSettings | null;
}

const PeriodicReports = ({ userSettings }: PeriodicReportsProps) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [frequency, setFrequency] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'>('DAILY');
  const [creatingReport, setCreatingReport] = useState(false);

  const telegramConnected = userSettings?.telegram_connected === true;

  useEffect(() => {
    console.log('[PeriodicReports] userSettings:', userSettings);
    console.log('[PeriodicReports] telegram_connected:', userSettings?.telegram_connected);
    console.log('[PeriodicReports] telegramConnected state:', telegramConnected);
  }, [userSettings, telegramConnected]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getReports();
      setReports(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load reports';
      setError(message);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleCreateReport = async () => {
    if (!telegramConnected) {
      alert('Please connect Telegram in Settings first');
      return;
    }

    try {
      setCreatingReport(true);
      const payload = {
        query: null,
        frequency,
        delivery_method: 'telegram',
        delivery_methods: ['telegram'],
        is_active: true,
      };
      const newReport = await api.createReport(payload);
      setReports([...reports, newReport]);
      setShowCreateModal(false);
      setFrequency('DAILY');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create report';
      setError(message);
    } finally {
      setCreatingReport(false);
    }
  };

  const handleToggleReport = async (id: number) => {
    try {
      const report = reports.find(r => r.id === id);
      if (!report) return;

      const updated = await api.updateReport(id, {
        is_active: !report.is_active,
      });
      setReports(reports.map(r => r.id === id ? updated : r));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to toggle report';
      setError(message);
    }
  };

  const handleDeleteReport = async (id: number) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      await api.deleteReport(id);
      setReports(reports.filter(r => r.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete report';
      setError(message);
    }
  };

  const frequencyLabel = (freq: string) => {
    switch (freq) {
      case 'DAILY':
        return 'Daily';
      case 'WEEKLY':
        return 'Weekly';
      case 'MONTHLY':
        return 'Monthly';
      case 'YEARLY':
        return 'Yearly';
      default:
        return freq;
    }
  };

  const frequencyDescription = (freq: string) => {
    switch (freq) {
      case 'DAILY':
        return 'Report codziennie (z danych z wczoraj)';
      case 'WEEKLY':
        return 'Raport co tydzień (ostatnie 7 dni)';
      case 'MONTHLY':
        return 'Raport co miesiąc (ostatnie 30 dni)';
      case 'YEARLY':
        return 'Raport co rok (ostatnie 365 dni)';
      default:
        return freq;
    }
  };

  return (
    <div className="bg-background-paper rounded-xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell size={20} className="text-primary-main" />
          <h3 className="text-lg font-semibold text-text-primary">
            Periodic Reports
          </h3>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={!telegramConnected || creatingReport}
          className="bg-primary-main text-primary-contrast rounded-lg px-3 py-2 text-sm hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          title={telegramConnected ? 'Create new report' : 'Connect Telegram first'}
        >
          <Plus size={16} />
          Add Report
        </button>
      </div>

      {!telegramConnected && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
          <AlertCircle size={18} className="text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800">Telegram not connected</p>
            <p className="text-xs text-yellow-700">Connect Telegram in Settings to enable periodic reports</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-3 text-sm text-status-error bg-red-50 border border-red-200 rounded p-2">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-text-secondary">
          <Bell size={32} className="mx-auto mb-2 animate-pulse" />
          <p className="text-sm">Loading reports…</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-8 text-text-secondary">
          <Bell size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No periodic reports configured</p>
        </div>
      ) : (
        <div className="space-y-2">
          {reports.map((report) => (
            <div
              key={report.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                report.is_active
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-gray-50 border-gray-200 opacity-70'
              } hover:bg-opacity-75 transition-colors`}
            >
              <div className="flex items-center gap-3 flex-1">
                <input
                  type="checkbox"
                  checked={report.is_active}
                  onChange={() => handleToggleReport(report.id)}
                  className="w-4 h-4 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-text-primary">
                    {frequencyLabel(report.frequency)} Report
                  </div>
                  <div className="text-xs text-text-secondary">
                    <span>Channels: {report.delivery_methods.join(', ')}</span>
                    {report.next_run && (
                      <span className="ml-2">• Next: {new Date(report.next_run).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDeleteReport(report.id)}
                className="p-1 hover:bg-red-100 rounded transition-colors"
                title="Delete report"
              >
                <Trash2 size={16} className="text-status-error" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && telegramConnected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background-paper rounded-xl shadow-lg p-6 max-w-sm w-full">
            <h2 className="text-xl font-bold text-text-primary mb-4">Create Periodic Report</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Frequency
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY')}
                className="w-full px-4 py-2 border border-default rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-main focus:border-transparent"
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-blue-800">
                {frequencyDescription(frequency)}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-default rounded-lg text-sm font-medium text-text-primary hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateReport}
                disabled={creatingReport}
                className="flex-1 px-4 py-2 bg-primary-main text-primary-contrast rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                {creatingReport ? 'Creating…' : 'Create Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PeriodicReports;

