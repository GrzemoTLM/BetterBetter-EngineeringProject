import {
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useEffect, useState } from 'react';
import api from '../services/api';
import type { Coupon } from '../types/coupons';
import type { FilterResult } from '../services/api';

interface StatisticsChartsProps {
  customFilterActive?: boolean;
  customFilterResults?: FilterResult | null;
  filteredCoupons?: Coupon[] | null;
}

const StatisticsCharts = ({ customFilterActive = false, customFilterResults, filteredCoupons }: StatisticsChartsProps) => {
  const [profitData, setProfitData] = useState<Array<{ month: string; profit: number }>>([]);
  const [profitLoading, setProfitLoading] = useState(false);
  const [profitError, setProfitError] = useState<string | null>(null);

  const [balanceData, setBalanceData] = useState<Array<{ day: string; balance: number }>>([]);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  const [pieData, setPieData] = useState<Array<{ name: string; value: number; count: number; color: string }>>([
    { name: 'Won', value: 0, count: 0, color: '#10B981' },
    { name: 'Lost', value: 0, count: 0, color: '#EF4444' },
  ]);
  const [pieLoading, setPieLoading] = useState(false);
  const [pieError, setPieError] = useState<string | null>(null);

  useEffect(() => {
    if (customFilterActive && filteredCoupons && filteredCoupons.length > 0) {
      const wonCoupons = filteredCoupons.filter(c => {
        const status = String(c.status || '').toLowerCase();
        return status.includes('won') || status === 'win';
      });
      const lostCoupons = filteredCoupons.filter(c => {
        const status = String(c.status || '').toLowerCase();
        return status.includes('lost') || status === 'lose';
      });

      const wonCount = wonCoupons.length;
      const lostCount = lostCoupons.length;
      const totalFinished = wonCount + lostCount;

      if (totalFinished > 0) {
        const wonPercentage = Math.round((wonCount / totalFinished) * 100);
        const lostPercentage = 100 - wonPercentage;
        setPieData([
          { name: 'Won', value: wonPercentage, count: wonCount, color: '#10B981' },
          { name: 'Lost', value: lostPercentage, count: lostCount, color: '#EF4444' },
        ]);
      }

      const monthlyProfit: Record<string, number> = {};
      filteredCoupons.forEach(coupon => {
        const date = new Date(coupon.created_at);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        const stake = parseFloat(String(coupon.bet_stake)) || 0;
        const status = String(coupon.status || '').toLowerCase();

        if (!monthlyProfit[monthKey]) monthlyProfit[monthKey] = 0;

        if (status.includes('won') || status === 'win') {
          const payout = coupon.potential_payout || stake;
          monthlyProfit[monthKey] += payout - stake;
        } else if (status.includes('lost') || status === 'lose') {
          monthlyProfit[monthKey] -= stake;
        }
      });

      const profitChartData = Object.entries(monthlyProfit)
        .map(([month, profit]) => ({ month, profit: Math.round(profit * 100) / 100 }))
        .sort((a, b) => {
          const [aMonth, aYear] = a.month.split(' ');
          const [bMonth, bYear] = b.month.split(' ');
          const aDate = new Date(`${aMonth} 20${aYear}`);
          const bDate = new Date(`${bMonth} 20${bYear}`);
          return aDate.getTime() - bDate.getTime();
        });

      setProfitData(profitChartData);

      const dailyBalance: Record<string, number> = {};
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dayKey = d.toLocaleDateString('en-US', { weekday: 'short' });
        dailyBalance[dayKey] = 0;
      }

      filteredCoupons.forEach(coupon => {
        const date = new Date(coupon.created_at);
        const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff <= 6) {
          const dayKey = date.toLocaleDateString('en-US', { weekday: 'short' });
          const stake = parseFloat(String(coupon.bet_stake)) || 0;
          const status = String(coupon.status || '').toLowerCase();

          if (dailyBalance[dayKey] !== undefined) {
            if (status.includes('won') || status === 'win') {
              const payout = coupon.potential_payout || stake;
              dailyBalance[dayKey] += payout - stake;
            } else if (status.includes('lost') || status === 'lose') {
              dailyBalance[dayKey] -= stake;
            }
          }
        }
      });

      const balanceChartData = Object.entries(dailyBalance).map(([day, balance]) => ({
        day,
        balance: Math.round(balance * 100) / 100,
      }));

      setBalanceData(balanceChartData);

      return;
    }

    if (customFilterActive && customFilterResults) {
      const wonCount = customFilterResults.won_count || 0;
      const lostCount = customFilterResults.lost_count || 0;
      const totalFinished = wonCount + lostCount;

      if (totalFinished > 0) {
        const wonPercentage = Math.round((wonCount / totalFinished) * 100);
        const lostPercentage = 100 - wonPercentage;
        setPieData([
          { name: 'Won', value: wonPercentage, count: wonCount, color: '#10B981' },
          { name: 'Lost', value: lostPercentage, count: lostCount, color: '#EF4444' },
        ]);
      }
    }
  }, [customFilterActive, customFilterResults, filteredCoupons]);

  useEffect(() => {
    if (customFilterActive) return;

    const fetchProfitTrend = async () => {
      try {
        setProfitLoading(true);
        setProfitError(null);
        const points = await api.getMonthlyBalanceTrend({ months: 12 });

        const formattedData = points.map((point) => {
          const date = new Date(point.date);
          const monthName = date.toLocaleDateString('en-US', { month: 'short' });
          const profit = parseFloat(point.monthly_profit);

          return {
            month: monthName,
            profit: Math.round(profit * 100) / 100,
          };
        });

        setProfitData(formattedData);
      } catch (error) {
        console.error('[StatisticsCharts] Error fetching profit trend:', error);
        setProfitError(error instanceof Error ? error.message : 'Failed to load profit trend');
      } finally {
        setProfitLoading(false);
      }
    };

    const fetchBalanceTrend = async () => {
      try {
        setBalanceLoading(true);
        setBalanceError(null);
        const points = await api.getBalanceTrend({ days: 7 });

        const formattedData = points.map((point) => {
          const date = new Date(point.date);
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
          return {
            day: dayName,
            balance: point.balance,
          };
        });

        setBalanceData(formattedData);
      } catch (error) {
        console.error('[StatisticsCharts] Error fetching balance trend:', error);
        setBalanceError(error instanceof Error ? error.message : 'Failed to load balance trend');
      } finally {
        setBalanceLoading(false);
      }
    };

    const fetchWinLossRatio = async () => {
      try {
        setPieLoading(true);
        setPieError(null);

        const summary = await api.getCouponSummary();

        const wonCount = Number(summary.won_count) || 0;
        const lostCount = Number(summary.lost_count) || 0;
        const totalFinished = wonCount + lostCount;

        if (totalFinished > 0) {
          const wonPercentage = Math.round((wonCount / totalFinished) * 100);
          const lostPercentage = 100 - wonPercentage;

          setPieData([
            { name: 'Won', value: wonPercentage, count: wonCount, color: '#10B981' },
            { name: 'Lost', value: lostPercentage, count: lostCount, color: '#EF4444' },
          ]);
        } else {
          setPieData([
            { name: 'Won', value: 0, count: 0, color: '#10B981' },
            { name: 'Lost', value: 0, count: 0, color: '#EF4444' },
          ]);
        }
      } catch (error) {
        console.error('[StatisticsCharts] Error fetching win/loss ratio:', error);
        setPieError(error instanceof Error ? error.message : 'Failed to load win/loss ratio');
      } finally {
        setPieLoading(false);
      }
    };

    fetchProfitTrend();
    fetchBalanceTrend();
    fetchWinLossRatio();
  }, [customFilterActive]);


  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Main Chart - Profit over time (2/3) */}
      <div className="lg:col-span-8 bg-background-paper rounded-xl shadow-sm p-5">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Profit over time
          {customFilterActive && <span className="text-sm font-normal text-primary-main ml-2">(Filtered)</span>}
        </h3>
        {profitLoading ? (
          <div className="flex items-center justify-center h-[300px]">
            <div className="text-sm text-text-secondary">Loading...</div>
          </div>
        ) : profitError ? (
          <div className="flex items-center justify-center h-[300px]">
            <div className="text-sm text-red-500">{profitError}</div>
          </div>
        ) : profitData.length === 0 ? (
          <div className="flex items-center justify-center h-[300px]">
            <div className="text-sm text-text-secondary">No data available</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={profitData}>
              <defs>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2A4B8D" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#2A4B8D" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" stroke="#64748B" />
              <YAxis stroke="#64748B" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                }}
              />
              <Area
                type="monotone"
                dataKey="profit"
                stroke="#2A4B8D"
                fillOpacity={1}
                fill="url(#colorProfit)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Secondary Charts (1/3) */}
      <div className="lg:col-span-4 flex flex-col gap-5">
        {/* Line Chart - Balance Trend */}
        <div className="bg-background-paper rounded-xl shadow-sm p-5">
          <h3 className="text-base font-semibold text-text-primary mb-4">
            Balance Trend
            {customFilterActive && <span className="text-sm font-normal text-primary-main ml-2">(Filtered)</span>}
          </h3>
          {balanceLoading ? (
            <div className="flex items-center justify-center h-[140px]">
              <div className="text-sm text-text-secondary">Loading...</div>
            </div>
          ) : balanceError ? (
            <div className="flex items-center justify-center h-[140px]">
              <div className="text-sm text-red-500">{balanceError}</div>
            </div>
          ) : balanceData.length === 0 ? (
            <div className="flex items-center justify-center h-[140px]">
              <div className="text-sm text-text-secondary">No data available</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={balanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="day" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke="#7E57C2"
                  strokeWidth={2}
                  dot={{ fill: '#7E57C2', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie Chart - Win/Loss */}
        <div className="bg-background-paper rounded-xl shadow-sm p-5">
          <h3 className="text-base font-semibold text-text-primary mb-4">
            Win/Loss Ratio
            {customFilterActive && <span className="text-sm font-normal text-primary-main ml-2">(Filtered)</span>}
          </h3>
          {pieLoading ? (
            <div className="flex items-center justify-center h-[140px]">
              <div className="text-sm text-text-secondary">Loading...</div>
            </div>
          ) : pieError ? (
            <div className="flex items-center justify-center h-[140px]">
              <div className="text-sm text-red-500">{pieError}</div>
            </div>
          ) : pieData[0].value === 0 && pieData[1].value === 0 ? (
            <div className="flex items-center justify-center h-[140px]">
              <div className="text-sm text-text-secondary">No settled coupons yet</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={50}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string, props) => {
                    const count = (props?.payload as { count?: number })?.count ?? 0;
                    return [`${value}% (${count} coupons)`, name];
                  }}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => `${value}%`}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatisticsCharts;

