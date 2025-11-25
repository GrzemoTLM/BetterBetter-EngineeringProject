import {
  DollarSign,
  CheckCircle2,
  TrendingUp,
  Target,
  BarChart3,
  Coins,
} from 'lucide-react';

const StatisticsKPIs = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {/* Balance Card */}
      <div className="bg-background-paper rounded-xl shadow-sm p-4 flex items-center justify-between border-l-4 border-primary-main">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-main/10 rounded-full flex items-center justify-center">
            <DollarSign size={20} className="text-primary-main" />
          </div>
          <div>
            <div className="text-sm text-text-secondary">Balance</div>
            <div className="text-xl font-bold text-status-roi-positive">
              +540 USD
            </div>
            <div className="text-xs text-status-roi-positive flex items-center gap-1 mt-1">
              <TrendingUp size={12} />
              +12% vs last month
            </div>
          </div>
        </div>
      </div>

      {/* ROI Hit Card */}
      <div className="bg-background-paper rounded-xl shadow-sm p-4 flex items-center justify-between border-l-4 border-secondary-main">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-secondary-main/10 rounded-full flex items-center justify-center">
            <CheckCircle2 size={20} className="text-secondary-main" />
          </div>
          <div>
            <div className="text-sm text-text-secondary">ROI Hit</div>
            <div className="text-xl font-bold text-text-primary">63%</div>
            <div className="text-xs text-status-roi-positive flex items-center gap-1 mt-1">
              <TrendingUp size={12} />
              +5% vs last month
            </div>
          </div>
        </div>
      </div>

      {/* Total Bets Card */}
      <div className="bg-background-paper rounded-xl shadow-sm p-4 flex items-center justify-between border-l-4 border-chart-series-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-chart-series-3/10 rounded-full flex items-center justify-center">
            <BarChart3 size={20} className="text-chart-series-3" />
          </div>
          <div>
            <div className="text-sm text-text-secondary">Total Bets</div>
            <div className="text-xl font-bold text-text-primary">247</div>
            <div className="text-xs text-text-secondary mt-1">
              This period
            </div>
          </div>
        </div>
      </div>

      {/* Win Rate Card */}
      <div className="bg-background-paper rounded-xl shadow-sm p-4 flex items-center justify-between border-l-4 border-status-roi-positive">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-status-roi-positive/10 rounded-full flex items-center justify-center">
            <Target size={20} className="text-status-roi-positive" />
          </div>
          <div>
            <div className="text-sm text-text-secondary">Win Rate</div>
            <div className="text-xl font-bold text-status-roi-positive">
              63.2%
            </div>
            <div className="text-xs text-text-secondary mt-1">
              156 won / 91 lost
            </div>
          </div>
        </div>
      </div>

      {/* Average Odds Card */}
      <div className="bg-background-paper rounded-xl shadow-sm p-4 flex items-center justify-between border-l-4 border-primary-main">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-main/10 rounded-full flex items-center justify-center">
            <TrendingUp size={20} className="text-primary-main" />
          </div>
          <div>
            <div className="text-sm text-text-secondary">Avg Odds</div>
            <div className="text-xl font-bold text-text-primary">2.45</div>
            <div className="text-xs text-text-secondary mt-1">
              Across all bets
            </div>
          </div>
        </div>
      </div>

      {/* Total Staked Card */}
      <div className="bg-background-paper rounded-xl shadow-sm p-4 flex items-center justify-between border-l-4 border-secondary-main">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-secondary-main/10 rounded-full flex items-center justify-center">
            <Coins size={20} className="text-secondary-main" />
          </div>
          <div>
            <div className="text-sm text-text-secondary">Total Staked</div>
            <div className="text-xl font-bold text-text-primary">$12,350</div>
            <div className="text-xs text-text-secondary mt-1">
              This period
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsKPIs;

