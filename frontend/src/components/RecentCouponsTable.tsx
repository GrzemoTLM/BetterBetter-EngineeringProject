interface Coupon {
  strategy: string;
  betAmount: string;
  date: string;
  status: 'won' | 'lost' | 'in progress' | 'cashed out';
}

const RecentCouponsTable = () => {
  const coupons: Coupon[] = [
    {
      strategy: 'Progression',
      betAmount: '$50',
      date: '9/11/2022',
      status: 'in progress',
    },
    {
      strategy: 'Martingale',
      betAmount: '$100',
      date: '9/10/2022',
      status: 'won',
    },
    {
      strategy: 'Fibonacci',
      betAmount: '$75',
      date: '9/9/2022',
      status: 'cashed out',
    },
    {
      strategy: 'D\'Alembert',
      betAmount: '$120',
      date: '9/8/2022',
      status: 'lost',
    },
    {
      strategy: 'Progression',
      betAmount: '$90',
      date: '9/7/2022',
      status: 'won',
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

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-background-table-header">
            <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
              Strategy
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
              Bet amount
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
              Date
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {coupons.map((coupon, index) => (
            <tr
              key={index}
              className="border-b border-border-light hover:bg-[#F1F5F9] transition-colors"
            >
              <td className="px-4 py-3 text-sm text-text-primary">
                {coupon.strategy}
              </td>
              <td className="px-4 py-3 text-sm text-text-primary font-medium">
                {coupon.betAmount}
              </td>
              <td className="px-4 py-3 text-sm text-text-secondary">
                {coupon.date}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(
                    coupon.status
                  )}`}
                >
                  {coupon.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RecentCouponsTable;

