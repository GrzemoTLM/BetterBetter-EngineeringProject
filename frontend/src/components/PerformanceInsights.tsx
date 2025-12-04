import { Lightbulb, TrendingUp, AlertTriangle, Target } from 'lucide-react';

interface Insight {
  type: 'success' | 'warning' | 'info';
  title: string;
  description: string;
  icon: typeof Lightbulb;
}

const PerformanceInsights = () => {
  const insights: Insight[] = [
    {
      type: 'success',
      title: 'Strong Performance',
      description:
        'Your win rate has improved by 8% compared to last month. Keep up the good work!',
      icon: TrendingUp,
    },
    {
      type: 'info',
      title: 'Optimization Opportunity',
      description:
        'Bet365 shows the highest ROI (68%). Consider increasing stake allocation here.',
      icon: Target,
    },
    {
      type: 'warning',
      title: 'Risk Alert',
      description:
        'Your average stake has increased by 25%. Monitor your bankroll management.',
      icon: AlertTriangle,
    },
    {
      type: 'info',
      title: 'Strategy Insight',
      description:
        'Progression strategy performs best during weekends. Consider timing adjustments.',
      icon: Lightbulb,
    },
  ];

  const getInsightStyles = (type: string) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          titleColor: 'text-green-800',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          titleColor: 'text-yellow-800',
        };
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          titleColor: 'text-blue-800',
        };
    }
  };

  return (
    <div className="relative">
      {/* Content */}
      <div className="bg-background-paper rounded-xl shadow-sm p-5 opacity-40 pointer-events-none select-none">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb size={20} className="text-primary-main" />
          <h3 className="text-lg font-semibold text-text-primary">
            Performance Insights
          </h3>
        </div>

        <div className="space-y-3">
          {insights.map((insight, index) => {
            const styles = getInsightStyles(insight.type);
            const Icon = insight.icon;
            return (
              <div
                key={index}
                className={`${styles.bg} ${styles.border} border rounded-lg p-3 flex items-start gap-3`}
              >
                <div
                  className={`${styles.iconBg} ${styles.iconColor} w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0`}
                >
                  <Icon size={16} />
                </div>
                <div className="flex-1">
                  <div
                    className={`${styles.titleColor} font-semibold text-sm mb-1`}
                  >
                    {insight.title}
                  </div>
                  <div className="text-xs text-text-secondary">
                    {insight.description}
                  </div>
                </div>
              </div>
            );
          })}
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

export default PerformanceInsights;

