import type { TransactionSummary } from '../types/finances';
import { useCurrency } from '../hooks/useCurrency';

interface SummaryStatsProps {
  summary: TransactionSummary | null;
}

const SummaryStats = ({ summary }: SummaryStatsProps) => {
  const { formatCurrency } = useCurrency();

  const totalDeposited = summary?.total_deposited ?? 0;
  const totalWithdrawn = summary?.total_withdrawn ?? 0;
  const balance = (summary?.total_withdrawn ?? 0) - (summary?.total_deposited ?? 0);
  const transactionCount = summary?.total_transactions ?? 0;

  const stats = [
    { label: 'Deposited', value: formatCurrency(totalDeposited), color: 'text-status-success' },
    { label: 'Withdrawn', value: formatCurrency(totalWithdrawn), color: 'text-status-error' },
    { label: 'Balance', value: formatCurrency(balance), color: 'text-primary-main' },
    { label: 'Transactions', value: transactionCount.toLocaleString(), color: 'text-secondary-main' },
  ];

  return (
    <div className="bg-background-paper rounded-xl p-8 shadow-sm">
      <h3 className="text-2xl font-bold text-text-primary mb-6">Summary</h3>
      <div className="grid grid-cols-2 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="flex flex-col">
            <span className="text-base font-medium text-text-secondary mb-2">
              {stat.label}
            </span>
            <span className={`text-3xl font-bold ${stat.color}`}>
              {stat.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SummaryStats;

