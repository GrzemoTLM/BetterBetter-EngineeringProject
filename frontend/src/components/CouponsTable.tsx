import { Pencil } from 'lucide-react';
import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import api from '../services/api';
import { useDateFormatter } from '../hooks/useDateFormatter';
import type { Coupon } from '../types/coupons';

export interface CouponsTableRef {
  refetch: () => Promise<void>;
}

const CouponsTable = forwardRef<CouponsTableRef>((_, ref) => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { formatDateWithoutTime } = useDateFormatter();

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const data = await api.getCoupons();
      const sorted = [...data].sort((a, b) => {
        const aTime = new Date(a.created_at).getTime();
        const bTime = new Date(b.created_at).getTime();
        return bTime - aTime;
      });
      setCoupons(sorted);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch coupons';
      setError(errorMessage);
      console.error('Error fetching coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    refetch: fetchCoupons,
  }));

  useEffect(() => {
    fetchCoupons();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'won':
        return 'bg-green-100 text-green-800';
      case 'lost':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'in progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'cashed out':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateMultiplier = (odds: Array<string | number>): string => {
    if (!odds || odds.length === 0) return '1.00';
    let result = 1;
    for (const odd of odds) {
      const oddNum = parseFloat(String(odd));
      if (!isNaN(oddNum)) {
        result *= oddNum;
      }
    }

    return result.toFixed(2);
  };


  const formatStatusDisplay = (status: string | undefined): string => {
    if (!status) return 'Pending';
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-text-secondary">
        Loading coupons...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-status-error">
        Error: {error}
      </div>
    );
  }

  if (coupons.length === 0) {
    return (
      <div className="p-8 text-center text-text-secondary">
        No coupons found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-background-table-header">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">
              Coupon Type
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">
              Bet Amount
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
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header w-12">
              {/* Actions column */}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-default">
          {coupons.map((coupon) => {
            const multiplier = calculateMultiplier(
              coupon.bets.map((b) => b.odds)
            );

            return (
              <tr
                key={coupon.id}
                className="hover:bg-gray-50 transition-colors bg-background-paper group"
              >
                <td className="px-4 py-4 text-sm text-text-primary font-medium">
                  {coupon.coupon_type}
                </td>
                <td className="px-4 py-4 text-sm text-text-primary">
                  ${coupon.bet_stake}
                </td>
                <td className="px-4 py-4 text-sm text-text-primary">
                  {multiplier}
                </td>
              <td className="px-4 py-4 text-sm text-text-secondary">
                {formatDateWithoutTime(coupon.created_at)}
              </td>
                <td className="px-4 py-4 text-sm">
                  <span
                    className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(
                      coupon.status || 'pending'
                    )}`}
                  >
                    {formatStatusDisplay(coupon.status)}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-blue-50 rounded">
                    <Pencil size={16} className="text-primary-main" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});

CouponsTable.displayName = 'CouponsTable';

export default CouponsTable;
