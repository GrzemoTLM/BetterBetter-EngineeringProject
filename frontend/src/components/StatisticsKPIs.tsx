import {
  DollarSign,
  CheckCircle2,
  TrendingUp,
  Target,
  BarChart3,
  Coins,
} from 'lucide-react';
import type { CouponSummary } from '../services/api';

interface StatisticsKPIsProps {
  summary: CouponSummary | null;
}

const StatisticsKPIs = ({ summary }: StatisticsKPIsProps) => {
  const totalCoupons = typeof summary?.total_coupons === 'number' ? summary?.total_coupons : 0;
  const winRateRaw = typeof summary?.win_rate === 'string' ? parseFloat(summary.win_rate) : 0;
  const winRatePercent = (winRateRaw || 0) * 100;
  const wonCoupons = typeof summary?.won_coupons === 'number' ? summary.won_coupons : 0;
  const lostCoupons = typeof summary?.lost_coupons === 'number' ? summary.lost_coupons : 0;
  const avgMultiplier = typeof summary?.avg_multiplier === 'string' ? parseFloat(summary.avg_multiplier) : 0;
  const totalStake = typeof summary?.total_stake === 'string' ? parseFloat(summary.total_stake) : 0;
  const yieldRaw = typeof summary?.yield === 'string' ? parseFloat(summary.yield) : 0; // already percent
  const realizedProfit = typeof summary?.realized_profit === 'string' ? parseFloat(summary.realized_profit) : 0;

  const formatMoney = (value: number) =>
    value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const formatPercent = (value: number) =>
    value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {/* Realized Profit / Balance Card */}
      <div className="bg-background-paper rounded-xl shadow-sm p-4 flex items-center justify-between border-l-4 border-primary-main">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-main/10 rounded-full flex items-center justify-center">
            <DollarSign size={20} className="text-primary-main" />
          </div>
          <div>
            <div className="text-sm text-text-secondary">Realized Profit</div>
            <div className={`text-xl font-bold ${realizedProfit >= 0 ? 'text-status-roi-positive' : 'text-status-error'}`}>
              {realizedProfit >= 0 ? '+' : ''}{formatMoney(realizedProfit)}
            </div>
            <div className="text-xs text-text-secondary mt-1">
              Based on finished coupons
            </div>
          </div>
        </div>
      </div>

      {/* Yield Card (replaces ROI) */}
      <div className="bg-background-paper rounded-xl shadow-sm p-4 flex items-center justify-between border-l-4 border-secondary-main">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-secondary-main/10 rounded-full flex items-center justify-center">
            <CheckCircle2 size={20} className="text-secondary-main" />
          </div>
          <div>
            <div className="text-sm text-text-secondary">Yield</div>
            <div className="text-xl font-bold text-text-primary">
              {summary ? `${formatPercent(yieldRaw)}%` : '—'}
            </div>
            <div className="text-xs text-text-secondary mt-1">
              Profit / Total Stake
            </div>
          </div>
        </div>
      </div>

      {/* Total Coupons Card */}
      <div className="bg-background-paper rounded-xl shadow-sm p-4 flex items-center justify-between border-l-4 border-chart-series-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-chart-series-3/10 rounded-full flex items-center justify-center">
            <BarChart3 size={20} className="text-chart-series-3" />
          </div>
          <div>
            <div className="text-sm text-text-secondary">Total Coupons</div>
            <div className="text-xl font-bold text-text-primary">{summary ? totalCoupons : '—'}</div>
            <div className="text-xs text-text-secondary mt-1">This period</div>
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
              {summary ? `${formatPercent(winRatePercent)}%` : '—'}
            </div>
            <div className="text-xs text-text-secondary mt-1">
              {summary ? `${wonCoupons} won / ${lostCoupons} lost` : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Average Odds Card (Avg Multiplier) */}
      <div className="bg-background-paper rounded-xl shadow-sm p-4 flex items-center justify-between border-l-4 border-primary-main">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-main/10 rounded-full flex items-center justify-center">
            <TrendingUp size={20} className="text-primary-main" />
          </div>
          <div>
            <div className="text-sm text-text-secondary">Avg Odds</div>
            <div className="text-xl font-bold text-text-primary">
              {summary ? avgMultiplier.toFixed(2) : '—'}
            </div>
            <div className="text-xs text-text-secondary mt-1">Across all coupons</div>
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
            <div className="text-xl font-bold text-text-primary">
              {summary ? formatMoney(totalStake) : '—'}
            </div>
            <div className="text-xs text-text-secondary mt-1">This period</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsKPIs;
