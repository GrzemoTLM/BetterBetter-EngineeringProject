import { Bell, X, AlertCircle, TrendingDown, DollarSign } from 'lucide-react';
import { useState } from 'react';

interface Notification {
  id: string;
  type: 'yield' | 'lose_streak' | 'roi' | 'balance';
  condition: string;
  value: string;
  status: 'active' | 'triggered';
}

const ActiveNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'yield',
      condition: 'Yield exceeding',
      value: '15%',
      status: 'active',
    },
    {
      id: '2',
      type: 'lose_streak',
      condition: 'Lose streak exceeding',
      value: '5',
      status: 'active',
    },
    {
      id: '3',
      type: 'roi',
      condition: 'ROI Threshold',
      value: '-10%',
      status: 'triggered',
    },
    {
      id: '4',
      type: 'balance',
      condition: 'Balance Threshold',
      value: '$1000',
      status: 'active',
    },
  ]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'yield':
      case 'roi':
        return TrendingDown;
      case 'lose_streak':
        return AlertCircle;
      case 'balance':
        return DollarSign;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'yield':
      case 'roi':
        return 'text-primary-main';
      case 'lose_streak':
        return 'text-status-roi-negative';
      case 'balance':
        return 'text-chart-series-3';
      default:
        return 'text-text-secondary';
    }
  };

  const handleDelete = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id));
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
        <span className="text-xs text-text-secondary bg-gray-100 px-2 py-1 rounded">
          {notifications.length} active
        </span>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-8 text-text-secondary">
          <Bell size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No active notifications</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const Icon = getNotificationIcon(notification.type);
            return (
              <div
                key={notification.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  notification.status === 'triggered'
                    ? 'bg-status-warning-bg border-yellow-300'
                    : 'bg-gray-50 border-gray-200'
                } hover:bg-gray-100 transition-colors`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      notification.status === 'triggered'
                        ? 'bg-yellow-200'
                        : 'bg-gray-200'
                    }`}
                  >
                    <Icon
                      size={16}
                      className={getNotificationColor(notification.type)}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-text-primary">
                      {notification.condition}
                    </div>
                    <div className="text-xs text-text-secondary">
                      Value: <span className="font-semibold">{notification.value}</span>
                      {notification.status === 'triggered' && (
                        <span className="ml-2 text-status-warning-text font-medium">
                          • Triggered
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(notification.id)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title="Delete notification"
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

