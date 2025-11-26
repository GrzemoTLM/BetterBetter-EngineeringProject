import { useState, useEffect } from 'react';
import api from '../services/api';
import { useDateFormatter } from '../hooks/useDateFormatter';
import type { Coupon } from '../types/coupons';

const RecentCouponsTable = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { formatDateWithoutTime } = useDateFormatter();

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        setLoading(true);
        const data = await api.getCoupons();
        // Sort by creation date (newest first) and take last 5
        const recentCoupons = data
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);
        setCoupons(recentCoupons);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch coupons';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchCoupons();
  }, []);

  const getStatusColor = (status: string | undefined) => {
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
        Loading recent coupons...
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
            <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
              Coupon Type
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
              Bet Amount
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-text-secondary">
              Bookmaker
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
          {coupons.map((coupon) => (
            <tr
              key={coupon.id}
              className="border-b border-border-light hover:bg-[#F1F5F9] transition-colors"
            >
              <td className="px-4 py-3 text-sm text-text-primary font-medium">
                {coupon.coupon_type}
              </td>
              <td className="px-4 py-3 text-sm text-text-primary font-medium">
                ${coupon.bet_stake}
              </td>
              <td className="px-4 py-3 text-sm text-text-primary">
                {coupon.bookmaker}
              </td>
              <td className="px-4 py-3 text-sm text-text-secondary">
                {formatDateWithoutTime(coupon.created_at)}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(
                    coupon.status
                  )}`}
                >
                  {formatStatusDisplay(coupon.status)}
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

