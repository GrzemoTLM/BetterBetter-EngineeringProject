import { Bell, X, AlertCircle, TrendingDown, DollarSign, RefreshCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import api, { type AlertRule } from '../services/api';

const ActiveNotifications = () => {
  const [notifications, setNotifications] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const rules = await api.getAlertRules();
      setNotifications(rules ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load alerts';
      setError(message);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const getNotificationIcon = (rule: AlertRule) => {
    const key = rule.rule_type ?? rule.metric;
    switch (key) {
      case 'yield':
      case 'roi':
        return TrendingDown;
      case 'lose_streak':
      case 'streak_loss':
        return AlertCircle;
      case 'balance':
      case 'profit':
        return DollarSign;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (rule: AlertRule) => {
    const key = rule.rule_type ?? rule.metric;
    switch (key) {
      case 'yield':
      case 'roi':
        return 'text-primary-main';
      case 'lose_streak':
      case 'streak_loss':
        return 'text-status-roi-negative';
      case 'balance':
      case 'profit':
        return 'text-chart-series-3';
      default:
        return 'text-text-secondary';
    }
  };

  const getComparatorLabel = (comparator: string): string => {
    const comparatorMap: Record<string, string> = {
      'gt': 'greater than',
      'gte': 'greater than or equal',
      'lt': 'less than',
      'lte': 'less than or equal',
      'eq': 'equal to',
    };
    return comparatorMap[comparator] || comparator;
  };

  const describeRule = (rule: AlertRule) => {
    if (rule.message) return rule.message;
    const metric = (rule.metric ?? 'Metric').replace(/_/g, ' ');
    const comparatorLabel = getComparatorLabel(rule.comparator ?? '');
    return `${metric}: ${comparatorLabel} ${rule.threshold_value}`;
  };

  const getStatus = (rule: AlertRule): 'triggered' | 'active' | 'inactive' => {
    if (!rule.is_active) return 'inactive';
    return rule.last_triggered_at ? 'triggered' : 'active';
  };

  const handleDelete = async (id?: number | string) => {
    if (!id) return;
    try {
      await api.deleteAlertRule(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete alert';
      setError(message);
    }
  };

  return (
    <div className="bg-background-paper rounded-xl shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell size={20} className="text-primary-main" />
          <h3 className="text-lg font-semibold text-text-primary">
            Active Notifications
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary bg-gray-100 px-2 py-1 rounded">
            {loading ? 'Loading…' : `${notifications.length} active`}
          </span>
          <button
            onClick={fetchNotifications}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            disabled={loading}
            title="Refresh alerts"
          >
            <RefreshCcw size={16} className="text-text-secondary" />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-3 text-sm text-status-error bg-red-50 border border-red-200 rounded p-2">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-text-secondary">
          <Bell size={32} className="mx-auto mb-2 animate-pulse" />
          <p className="text-sm">Fetching notification rules…</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-8 text-text-secondary">
          <Bell size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No active notifications</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const status = getStatus(notification);
            const Icon = getNotificationIcon(notification);
            return (
              <div
                key={String(notification.id ?? `${notification.metric}-${notification.threshold_value}`)}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  status === 'triggered'
                    ? 'bg-status-warning-bg border-yellow-300'
                    : status === 'inactive'
                    ? 'bg-gray-100 border-gray-200 opacity-75'
                    : 'bg-gray-50 border-gray-200'
                } hover:bg-gray-100 transition-colors`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      status === 'triggered'
                        ? 'bg-yellow-200'
                        : status === 'inactive'
                        ? 'bg-gray-200'
                        : 'bg-gray-100'
                    }`}
                  >
                    <Icon size={16} className={getNotificationColor(notification)} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-text-primary">
                      {describeRule(notification)}
                    </div>
                    <div className="text-xs text-text-secondary">
                      <span>Metric: <span className="font-semibold">{(notification.metric ?? 'N/A').replace(/_/g, ' ')}</span></span>
                      <span className="ml-3">Comparator: <span className="font-semibold">{getComparatorLabel(notification.comparator ?? '')}</span></span>
                      <span className="ml-3">Threshold: <span className="font-semibold">{notification.threshold_value}</span></span>
                      {notification.window_days ? (
                        <span className="ml-3">Window {notification.window_days}d</span>
                      ) : null}
                      {status === 'triggered' && (
                        <span className="ml-3 text-status-warning-text font-medium">• Triggered</span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(notification.id)}
                  disabled={loading}
                  className="p-1 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
                  title="Dismiss notification"
                >
                  <X size={16} className="text-text-secondary" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActiveNotifications;
