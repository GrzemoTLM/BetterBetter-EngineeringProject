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

const toNumber = (v: unknown): number | undefined => {
  if (v == null) return undefined;
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = parseFloat(v);
    return Number.isNaN(n) ? undefined : n;
  }

  return undefined;
};

const StatisticsKPIs = ({ summary }: StatisticsKPIsProps) => {
  const s = (summary as Record<string, unknown>) || {};

  // Totals
  const totalCoupons = toNumber(s.total_coupons) ?? toNumber(s.count) ?? 0;
  const wonCoupons = toNumber(s.won_coupons) ?? toNumber(s.won_count) ?? 0;
  const lostCoupons = toNumber(s.lost_coupons) ?? toNumber(s.lost_count) ?? 0;

  // Win rate calculated only from finished coupons (won + lost), excluding in_progress
  const finishedCoupons = wonCoupons + lostCoupons;
  const winRatePercent = finishedCoupons > 0 ? (wonCoupons / finishedCoupons) * 100 : 0;

  // Money-related values (strings or numbers)
  const totalStake = toNumber(s.total_stake) ?? 0;
  const realizedProfit = toNumber(s.realized_profit) ?? toNumber(s.profit) ?? 0;

  // Yield (prefer explicit yield, then roi, then derive from profit/totalStake)
  const yieldFromSummary = toNumber(s.yield);
  const roiMaybe = toNumber(s.roi);
  const derivedYield = totalStake ? (realizedProfit / totalStake) * 100 : 0;
  const yieldPercent = yieldFromSummary ?? roiMaybe ?? derivedYield;

  // Avg odds / multiplier (check avg_coupon_odds first, then avg_multiplier, then avg_odds)
  const avgMultiplier = toNumber(s.avg_coupon_odds) ?? toNumber(s.avg_multiplier) ?? toNumber(s.avg_odds) ?? 0;

  const formatMoney = (value: number) =>
    value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const formatPercent = (value: number) =>
    value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  const hasSummary = !!summary;

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
              {hasSummary ? `${realizedProfit >= 0 ? '+' : ''}${formatMoney(realizedProfit)}` : '—'}
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
              {hasSummary ? `${formatPercent(yieldPercent)}%` : '—'}
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
            <div className="text-xl font-bold text-text-primary">{hasSummary ? totalCoupons : '—'}</div>
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
              {hasSummary ? `${formatPercent(winRatePercent)}%` : '—'}
            </div>
            <div className="text-xs text-text-secondary mt-1">
              {hasSummary ? `${wonCoupons} won / ${lostCoupons} lost` : '—'}
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
              {hasSummary ? avgMultiplier.toFixed(2) : '—'}
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
              {hasSummary ? formatMoney(totalStake) : '—'}
            </div>
            <div className="text-xs text-text-secondary mt-1">This period</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsKPIs;
