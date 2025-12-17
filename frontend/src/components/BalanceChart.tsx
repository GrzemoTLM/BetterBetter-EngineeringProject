import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { TransactionSummary } from '../types/finances';
import { useDateFormatter } from '../hooks/useDateFormatter';

interface BalanceChartProps {
  summary: TransactionSummary | null;
}

const BalanceChart = ({ summary }: BalanceChartProps) => {
  const [isStacked, setIsStacked] = useState(false);
  const { formatDateWithoutTime } = useDateFormatter();

  const data = useMemo(() => {
    if (!summary?.by_date || summary.by_date.length === 0) {
      return [];
    }

    return summary.by_date.map((item) => {
      const amount = Number(item.amount);
      const deposit = amount > 0 ? amount : 0;
      const withdrawal = amount < 0 ? Math.abs(amount) : 0;

      return {
        date: formatDateWithoutTime(item.date),
        deposit,
        withdrawal,
      };
    });
  }, [summary, formatDateWithoutTime]);

  return (
    <div className="bg-background-paper rounded-md p-6 shadow-card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-medium text-text-primary">
          Balance over time
        </h3>
        <div className="flex items-center gap-4 text-sm text-text-secondary">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isStacked}
              onChange={(e) => setIsStacked(e.target.checked)}
              className="cursor-pointer"
            />
            <span>Stacked</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!isStacked}
              onChange={(e) => setIsStacked(!e.target.checked)}
              className="cursor-pointer"
            />
            <span>Separated</span>
          </label>
        </div>
      </div>
      {data.length === 0 ? (
        <div className="h-[300px] flex items-center justify-center text-text-secondary">
          No data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
            <XAxis dataKey="date" stroke="#666666" />
            <YAxis stroke="#666666" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E0E0E0',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar
              dataKey="deposit"
              fill="#2A4B8D"
              name="Deposit"
              stackId={isStacked ? 'a' : undefined}
            />
            <Bar
              dataKey="withdrawal"
              fill="#7E57C2"
              name="Withdrawal"
              stackId={isStacked ? 'a' : undefined}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default BalanceChart;

