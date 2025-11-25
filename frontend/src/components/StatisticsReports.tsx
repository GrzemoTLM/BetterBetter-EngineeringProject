import { AlertTriangle, TrendingDown } from 'lucide-react';
import { useState } from 'react';

const StatisticsReports = () => {
  const [selectedReport, setSelectedReport] = useState('Daily');

  const reportTypes = ['Daily', 'Weekly', 'Monthly', 'Customer'];

  const alerts = [
    {
      type: 'warning',
      message: 'ROI fell below -10% in the last week',
      icon: TrendingDown,
    },
    {
      type: 'info',
      message: 'Consider diversifying your betting strategies',
      icon: AlertTriangle,
    },
    {
      type: 'warning',
      message: 'High loss streak detected in recent bets',
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Periodic Reports */}
      <div className="bg-background-paper rounded-xl shadow-sm p-5">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Periodic Reports
        </h3>
        <div className="flex flex-col gap-2">
          {reportTypes.map((type) => (
            <label
              key={type}
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
            >
              <input
                type="radio"
                name="reportType"
                value={type}
                checked={selectedReport === type}
                onChange={(e) => setSelectedReport(e.target.value)}
                className="text-primary-main focus:ring-primary-main"
              />
              <span className="text-sm text-text-primary">{type}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Alerts & Recommendations */}
      <div className="bg-background-paper rounded-xl shadow-sm p-5">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Alerts & Recommendations
        </h3>
        <div className="space-y-3">
          {alerts.map((alert, index) => {
            const Icon = alert.icon;
            return (
              <div
                key={index}
                className={`p-3 rounded-lg flex items-start gap-3 ${
                  alert.type === 'warning'
                    ? 'bg-status-warning-bg border border-yellow-200 text-status-warning-text'
                    : 'bg-blue-50 border border-blue-200 text-blue-800'
                }`}
              >
                <Icon size={18} className="mt-0.5 flex-shrink-0" />
                <span className="text-sm">{alert.message}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StatisticsReports;

