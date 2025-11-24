import { Pencil } from 'lucide-react';

interface Coupon {
  strategy: string;
  betAmount: string;
  multiplier: string;
  date: string;
  status: 'in progress' | 'won' | 'lost' | 'cashed out';
  balance: string;
}

const CouponsTable = () => {
  const coupons: Coupon[] = [
    {
      strategy: 'Progression',
      betAmount: '50$',
      multiplier: '4.46',
      date: '9/11/2022',
      status: 'in progress',
      balance: '+0$',
    },
    {
      strategy: 'Martingale',
      betAmount: '100$',
      multiplier: '2.15',
      date: '9/10/2022',
      status: 'won',
      balance: '+115$',
    },
    {
      strategy: 'Fibonacci',
      betAmount: '75$',
      multiplier: '3.20',
      date: '9/9/2022',
      status: 'cashed out',
      balance: '+165$',
    },
    {
      strategy: "D'Alembert",
      betAmount: '120$',
      multiplier: '1.85',
      date: '9/8/2022',
      status: 'lost',
      balance: '-120$',
    },
    {
      strategy: 'Progression',
      betAmount: '90$',
      multiplier: '5.10',
      date: '9/7/2022',
      status: 'won',
      balance: '+369$',
    },
    {
      strategy: 'Martingale',
      betAmount: '200$',
      multiplier: '2.50',
      date: '9/6/2022',
      status: 'in progress',
      balance: '+0$',
    },
    {
      strategy: 'Fibonacci',
      betAmount: '150$',
      multiplier: '3.75',
      date: '9/5/2022',
      status: 'won',
      balance: '+412$',
    },
    {
      strategy: 'Progression',
      betAmount: '80$',
      multiplier: '4.20',
      date: '9/4/2022',
      status: 'cashed out',
      balance: '+256$',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'won':
        return 'bg-green-100 text-green-800';
      case 'lost':
        return 'bg-red-100 text-red-800';
      case 'in progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'cashed out':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getBalanceColor = (balance: string) => {
    if (balance.startsWith('+')) {
      return 'text-status-success';
    } else if (balance.startsWith('-')) {
      return 'text-status-error';
    }
    return 'text-text-secondary';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-background-table-header">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">
              Strategy
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">
              Bet amount
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">
              Multiplier
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">
              Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">
              Balance
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header w-12">
              {/* Actions column */}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-default">
          {coupons.map((coupon, index) => (
            <tr
              key={index}
              className="hover:bg-gray-50 transition-colors bg-background-paper group"
            >
              <td className="px-4 py-4 text-sm text-text-primary font-medium">
                {coupon.strategy}
              </td>
              <td className="px-4 py-4 text-sm text-text-primary">
                {coupon.betAmount}
              </td>
              <td className="px-4 py-4 text-sm text-text-primary">
                {coupon.multiplier}
              </td>
              <td className="px-4 py-4 text-sm text-text-secondary">
                {coupon.date}
              </td>
              <td className="px-4 py-4 text-sm">
                <span
                  className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(
                    coupon.status
                  )}`}
                >
                  {coupon.status}
                </span>
              </td>
              <td
                className={`px-4 py-4 text-sm font-medium ${getBalanceColor(
                  coupon.balance
                )}`}
              >
                {coupon.balance}
              </td>
              <td className="px-4 py-4">
                <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-blue-50 rounded">
                  <Pencil size={16} className="text-primary-main" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CouponsTable;

