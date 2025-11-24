import { Wallet, ArrowDownLeft, ArrowUpRight, TrendingUp } from 'lucide-react';
import type { TransactionSummary } from '../types/finances';

interface KPICardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  iconBgColor: string;
}

const KPICard = ({ icon: Icon, label, value, iconBgColor }: KPICardProps) => {
  return (
    <div className="bg-background-paper rounded-md p-4 shadow-card flex items-center gap-4 flex-1 min-w-[200px]">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${iconBgColor}1A` }}
      >
        <Icon size={24} style={{ color: iconBgColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-text-secondary font-medium">{label}</div>
        <div className="text-2xl font-bold text-text-primary mt-1">{value}</div>
      </div>
    </div>
  );
};

interface KPICardsProps {
  summary: TransactionSummary | null;
}

const KPICards = ({ summary }: KPICardsProps) => {
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return '$0';
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const totalDeposited = summary?.total_deposited ?? 0;
  const totalWithdrawn = summary?.total_withdrawn ?? 0;
  const netCashflow = summary?.net_deposits ?? 0;
  const currentBalance = totalWithdrawn - totalDeposited;

  const kpis = [
    {
      icon: Wallet,
      label: 'Total Deposited',
      value: formatCurrency(totalDeposited),
      iconBgColor: '#2A4B8D',
    },
    {
      icon: ArrowDownLeft,
      label: 'Total Withdrawn',
      value: formatCurrency(totalWithdrawn),
      iconBgColor: '#F44336',
    },
    {
      icon: ArrowUpRight,
      label: 'Net Cashflow',
      value: formatCurrency(netCashflow),
      iconBgColor: '#4CAF50',
    },
    {
      icon: TrendingUp,
      label: 'Current Balance',
      value: formatCurrency(currentBalance),
      iconBgColor: '#7E57C2',
    },
  ];

  return (
    <div className="flex flex-wrap gap-4">
      {kpis.map((kpi, index) => (
        <KPICard key={index} {...kpi} />
      ))}
    </div>
  );
};

export default KPICards;

