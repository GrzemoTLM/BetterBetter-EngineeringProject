import { AlertTriangle, TrendingDown } from 'lucide-react';

const StatisticsReports = () => {
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
    <div className="relative">
      {/* Content */}
      <div className="flex flex-col gap-5 opacity-40 pointer-events-none select-none">
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

      {/* Overlay */}
      <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] rounded-xl flex items-center justify-center">
        <div className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg">
          🚧 In Development
        </div>
      </div>
    </div>
  );
};

export default StatisticsReports;

