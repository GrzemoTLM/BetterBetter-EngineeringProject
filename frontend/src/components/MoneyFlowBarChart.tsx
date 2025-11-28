import { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import type { Transaction } from '../types/finances';
import { useCurrency } from '../hooks/useCurrency';

interface MoneyFlowBarChartProps {
  transactions: Transaction[];
  mode: 'value' | 'count';
}

interface ChartPoint {
  month: string;
  deposit: number;
  withdrawal: number;
  netValue: number;
  color: string;
  totalCount: number;
}

const MoneyFlowBarChart = ({ transactions, mode }: MoneyFlowBarChartProps) => {
  const { formatCurrency } = useCurrency();

  const data: ChartPoint[] = useMemo(() => {
    console.log('[MoneyFlowBarChart] incoming transactions:', transactions);

    if (!transactions || transactions.length === 0) {
      console.log('[MoneyFlowBarChart] no transactions after filters');
      return [];
    }

    const byMonth: Record<string, ChartPoint> = {};

    for (const tx of transactions) {
      const created = tx.created_at ? new Date(tx.created_at) : null;
      if (!created || Number.isNaN(created.getTime())) {
        console.warn('[MoneyFlowBarChart] invalid created_at, skipping tx:', tx);
        continue;
      }

      const monthKey = `${created.getFullYear()}-${String(
        created.getMonth() + 1
      ).padStart(2, '0')}`;

      if (!byMonth[monthKey]) {
        byMonth[monthKey] = {
          month: monthKey,
          deposit: 0,
          withdrawal: 0,
          netValue: 0,
          color: '#10B981',
          totalCount: 0,
        };
      }

      const rawAmount = parseFloat(tx.amount ?? '0');
      const amount = Number.isFinite(rawAmount) && !Number.isNaN(rawAmount) ? Math.abs(rawAmount) : 0;

      if (tx.transaction_type === 'DEPOSIT') {
        byMonth[monthKey].deposit += amount;
      } else if (tx.transaction_type === 'WITHDRAWAL') {
        byMonth[monthKey].withdrawal += amount;
      }

      byMonth[monthKey].totalCount += 1;
    }

    const result = Object.values(byMonth)
      .map(item => {
        const deposit = Number(item.deposit) || 0;
        const withdrawal = Number(item.withdrawal) || 0;
        const netValue = withdrawal - deposit;
        const color = netValue >= 0 ? '#10B981' : '#EF4444';
        return {
          month: item.month,
          deposit,
          withdrawal,
          netValue,
          color,
          totalCount: Number(item.totalCount) || 0,
        };
      })
      .sort((a, b) => a.month.localeCompare(b.month));

    console.log('[MoneyFlowBarChart] aggregated monthly data:', result);
    console.log('[MoneyFlowBarChart] sample values:', result[0] ? {
      month: result[0].month,
      deposit: result[0].deposit,
      withdrawal: result[0].withdrawal,
      totalCount: result[0].totalCount,
      depositType: typeof result[0].deposit,
      withdrawalType: typeof result[0].withdrawal,
    } : 'no data');

    return result;
  }, [transactions]);

  const isCountMode = mode === 'count';

  return (
    <div className="bg-background-paper rounded-md p-6 shadow-card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-medium text-text-primary">
          Money Flow Overview
        </h3>
      </div>
      {data.length === 0 ? (
        <div className="h-[500px] flex items-center justify-center text-text-secondary">
          No transaction data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={500}>
          <BarChart 
            data={data} 
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
            <XAxis dataKey="month" stroke="#666666" />
            <YAxis
              stroke="#666666"
              domain={isCountMode ? [0, 'auto'] : ['auto', 'auto']}
              tickFormatter={(v) => {
                if (isCountMode) {
                  return v.toString();
                }
                return formatCurrency(v);
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E0E0E0',
                borderRadius: '8px',
              }}
              formatter={(value: number, name: string) => {
                if (isCountMode) {
                  const label = name === 'totalCount' ? 'Transactions' : name;
                  return [value, label];
                }

                const label = name === 'netValue' ? 'Balance' : name;
                return [formatCurrency(value), label];
              }}
            />
            <Legend />
            {isCountMode ? (
              <Bar
                dataKey="totalCount"
                name="Transactions"
                fill="#3B82F6"
                isAnimationActive={true}
                animationDuration={800}
                animationBegin={0}
              />
            ) : (
              <Bar
                dataKey="netValue"
                name="Balance"
                fill="#8884d8"
                isAnimationActive={true}
                animationDuration={800}
                animationBegin={0}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            )}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default MoneyFlowBarChart;
