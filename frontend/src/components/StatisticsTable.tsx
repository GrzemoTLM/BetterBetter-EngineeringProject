import { FileSpreadsheet, FileText, Download } from 'lucide-react';

interface CouponDetail {
  date: string;
  bookmaker: string;
  stake: string;
  odds: string;
  result: 'Won' | 'Lost';
  profit: string;
}

const StatisticsTable = () => {
  const coupons: CouponDetail[] = [
    {
      date: '2024-01-15',
      bookmaker: 'Bet365',
      stake: '$50',
      odds: '2.15',
      result: 'Won',
      profit: '+$57.50',
    },
    {
      date: '2024-01-18',
      bookmaker: 'William Hill',
      stake: '$100',
      odds: '1.85',
      result: 'Won',
      profit: '+$85.00',
    },
    {
      date: '2024-01-20',
      bookmaker: 'Betfair',
      stake: '$75',
      odds: '3.20',
      result: 'Lost',
      profit: '-$75.00',
    },
    {
      date: '2024-01-22',
      bookmaker: 'Pinnacle',
      stake: '$120',
      odds: '2.50',
      result: 'Won',
      profit: '+$180.00',
    },
    {
      date: '2024-01-25',
      bookmaker: 'Bet365',
      stake: '$90',
      odds: '1.95',
      result: 'Won',
      profit: '+$85.50',
    },
    {
      date: '2024-01-28',
      bookmaker: 'William Hill',
      stake: '$150',
      odds: '2.30',
      result: 'Lost',
      profit: '-$150.00',
    },
    {
      date: '2024-02-01',
      bookmaker: 'Betfair',
      stake: '$80',
      odds: '2.75',
      result: 'Won',
      profit: '+$140.00',
    },
    {
      date: '2024-02-05',
      bookmaker: 'Pinnacle',
      stake: '$200',
      odds: '1.90',
      result: 'Won',
      profit: '+$180.00',
    },
  ];

  const getResultColor = (result: string) => {
    return result === 'Won'
      ? 'text-status-roi-positive'
      : 'text-status-roi-negative';
  };

  const getProfitColor = (profit: string) => {
    return profit.startsWith('+')
      ? 'text-status-roi-positive'
      : 'text-status-roi-negative';
  };

  return (
    <div className="bg-background-paper rounded-xl shadow-sm">
      <div className="p-5 border-b border-default">
        <h3 className="text-lg font-semibold text-text-primary">
          Detailed Coupons Table
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-background-table-header">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">
                Bookmaker
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">
                Stake
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">
                Odds
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">
                Result
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">
                Profit
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-default">
            {coupons.map((coupon, index) => (
              <tr
                key={index}
                className="hover:bg-gray-50 transition-colors bg-background-paper"
              >
                <td className="px-4 py-3 text-sm text-text-secondary">
                  {coupon.date}
                </td>
                <td className="px-4 py-3 text-sm text-text-primary font-medium">
                  {coupon.bookmaker}
                </td>
                <td className="px-4 py-3 text-sm text-text-primary">
                  {coupon.stake}
                </td>
                <td className="px-4 py-3 text-sm text-text-primary">
                  {coupon.odds}
                </td>
                <td
                  className={`px-4 py-3 text-sm font-medium ${getResultColor(
                    coupon.result
                  )}`}
                >
                  {coupon.result}
                </td>
                <td
                  className={`px-4 py-3 text-sm font-medium ${getProfitColor(
                    coupon.profit
                  )}`}
                >
                  {coupon.profit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Export Buttons */}
      <div className="p-5 border-t border-default">
        <div className="flex flex-wrap gap-2">
          <button className="border border-gray-300 text-text-secondary px-3 py-1.5 rounded text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors">
            <FileSpreadsheet size={16} />
            Export CSV
          </button>
          <button className="border border-gray-300 text-text-secondary px-3 py-1.5 rounded text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors">
            <FileSpreadsheet size={16} />
            Export XLSX
          </button>
          <button className="border border-gray-300 text-text-secondary px-3 py-1.5 rounded text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors">
            <FileText size={16} />
            Export PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatisticsTable;

