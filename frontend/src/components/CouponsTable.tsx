import { Pencil } from 'lucide-react';
import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import api from '../services/api';
import { useDateFormatter } from '../hooks/useDateFormatter';
import type { Coupon } from '../types/coupons';
import { useCurrency } from '../hooks/useCurrency';
import EditCouponModal from './EditCouponModal';

interface CouponsTableProps {
  bulkMode?: boolean;
  selectedIds?: Set<number>;
  onToggleSelect?: (id: number) => void;
}

export interface CouponsTableRef {
  refetch: () => Promise<void>;
}

const CouponsTable = forwardRef<CouponsTableRef, CouponsTableProps>(({ bulkMode = false, selectedIds = new Set(), onToggleSelect }, ref) => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCouponId, setEditingCouponId] = useState<number | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { formatDateWithoutTime } = useDateFormatter();
  const { formatCurrency } = useCurrency();

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const data = await api.getCoupons();
      const sorted = [...data].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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

  useImperativeHandle(ref, () => ({ refetch: fetchCoupons }));

  useEffect(() => { fetchCoupons(); }, []);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'won': return 'bg-green-100 text-green-800';
      case 'lost': return 'bg-red-100 text-red-800';
      case 'in_progress':
      case 'in progress': return 'bg-yellow-100 text-yellow-800';
      case 'cashed out': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateMultiplier = (odds: Array<string | number>): string => {
    if (!odds || odds.length === 0) return '1.00';

    let result = 1;
    for (const odd of odds) {
      const oddNum = parseFloat(String(odd));
      if (!isNaN(oddNum)) result *= oddNum;
    }

    return result.toFixed(2);
  };

  const formatStatusDisplay = (status: string | undefined): string => {
    if (!status) return 'Pending';
    return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const toggleSelect = (id: number) => {
    if (onToggleSelect) onToggleSelect(id);
  };

  if (loading) return <div className="p-8 text-center text-text-secondary">Loading coupons...</div>;
  if (error) return <div className="p-8 text-center text-status-error">Error: {error}</div>;
  if (coupons.length === 0) return <div className="p-8 text-center text-text-secondary">No coupons found</div>;

  return (
    <div className="overflow-x-auto">
      <EditCouponModal
        couponId={editingCouponId ?? 0}
        isOpen={isEditOpen && editingCouponId !== null}
        onClose={() => setIsEditOpen(false)}
        onUpdated={async () => { await fetchCoupons(); }}
      />
      <div className="p-4">
        {/* Bulk controls removed */}
      </div>
      <table className="w-full">
        <thead>
          <tr className="bg-background-table-header">
            {bulkMode && <th className="px-2 py-3"></th>}
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">Coupon Type</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">Bet Amount</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">Multiplier</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">Payout / Balance</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">Date</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">Status</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header w-12"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-default">
          {coupons.map(coupon => {
            const multiplier = calculateMultiplier(coupon.bets.map(b => b.odds));
            const stake = parseFloat(String(coupon.bet_stake)) || 0;
            const potential = coupon.potential_payout ?? (parseFloat(multiplier) * stake);
            const statusNorm = (coupon.status || 'pending').toLowerCase();

            let payoutOrBalanceLabel = formatCurrency(potential || 0);
            let payoutOrBalanceClass = 'text-text-primary';
            if (statusNorm === 'won') {
              const net = (potential || 0) - stake; payoutOrBalanceLabel = formatCurrency(net); payoutOrBalanceClass = 'text-green-700';
            } else if (statusNorm === 'lost') {
              const net = -stake; payoutOrBalanceLabel = formatCurrency(net); payoutOrBalanceClass = 'text-red-700';
            } else if (statusNorm === 'cashed out') {
              const net = (potential || 0) - stake; payoutOrBalanceLabel = formatCurrency(net); payoutOrBalanceClass = net >= 0 ? 'text-green-700' : 'text-red-700';
            } else if (statusNorm === 'in_progress' || statusNorm === 'in progress' || statusNorm === 'pending') {
              payoutOrBalanceClass = 'text-blue-700';
            }

            return (
              <tr
                key={coupon.id}
                className="hover:bg-gray-50 transition-colors bg-background-paper group cursor-pointer"
                onClick={() => {
                  if (bulkMode) {
                    toggleSelect(coupon.id);
                  } else {
                    setEditingCouponId(coupon.id); setIsEditOpen(true);
                  }
                }}
              >
                {bulkMode && (
                  <td className="px-2 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(coupon.id)}
                      onClick={(e) => { e.stopPropagation(); }}
                      onChange={() => toggleSelect(coupon.id)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </td>
                )}
                <td className="px-4 py-4 text-sm text-text-primary font-medium">{coupon.coupon_type}</td>
                <td className="px-4 py-4 text-sm text-text-primary">{formatCurrency(stake)}</td>
                <td className="px-4 py-4 text-sm text-text-primary">{multiplier}</td>
                <td className={`px-4 py-4 text-sm font-medium ${payoutOrBalanceClass}`}>{payoutOrBalanceLabel}</td>
                <td className="px-4 py-4 text-sm text-text-secondary">{formatDateWithoutTime(coupon.created_at)}</td>
                <td className="px-4 py-4 text-sm">
                  <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(coupon.status || 'pending')}`}>{formatStatusDisplay(coupon.status)}</span>
                </td>
                <td className="px-4 py-4">
                  {!bulkMode && (
                    <button
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-blue-50 rounded"
                      onClick={(e) => { e.stopPropagation(); setEditingCouponId(coupon.id); setIsEditOpen(true); }}
                    >
                      <Pencil size={16} className="text-primary-main" />
                    </button>
                  )}
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
