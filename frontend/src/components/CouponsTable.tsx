import { Pencil, CheckCircle, XCircle, Circle } from 'lucide-react';
import { useState, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import api from '../services/api';
import { useDateFormatter } from '../hooks/useDateFormatter';
import type { Coupon } from '../types/coupons';
import { useCurrency } from '../hooks/useCurrency';
import EditCouponModal from './EditCouponModal';

interface CouponsTableProps {
  bulkMode?: boolean;
  selectedIds?: Set<number>;
  onToggleSelect?: (id: number) => void;
  filters?: Record<string, string>;
  hideEdit?: boolean;
  showOnlySettled?: boolean;
}

export interface CouponsTableRef {
  refetch: () => Promise<void>;
}

type StrategyExtended = number | null | string | { id?: number; name?: string };
type CouponWithStrategy = Omit<Coupon, 'strategy'> & { strategy?: StrategyExtended };

// Helpers extracted to avoid duplication
const normalizeStatus = (status?: string) => String(status ?? 'pending').trim().toLowerCase().replace(/[-\s]+/g, '_');

const deriveStatusHelper = (coupon: Coupon): string => {
  const norm = normalizeStatus(coupon.status);
  if (norm.includes('won') || norm === 'win') return 'won';
  if (norm.includes('lost') || norm === 'lose') return 'lost';
  const hasLost = coupon.bets.some(b => normalizeStatus(String(b.result)).includes('lost'));
  if (hasLost) return 'lost';
  const allWon = coupon.bets.length > 0 && coupon.bets.every(b => {
    const r = normalizeStatus(String(b.result));
    return r.includes('win') || r.includes('won');
  });
  if (allWon) return 'won';
  if (norm.includes('cashed')) return 'cashed_out';
  if (norm.includes('progress')) return 'in_progress';
  if (norm.includes('pending')) return 'pending';
  return norm || 'pending';
};

const getStatusColor = (status: string) => {
  const norm = normalizeStatus(status);
  if (norm.includes('won') || norm === 'win') return 'bg-green-100 text-green-800';
  if (norm.includes('lost') || norm === 'lose' || norm === 'lost_final') return 'bg-red-100 text-red-800';
  if (norm.includes('cashed')) return 'bg-blue-100 text-blue-800';
  if (norm.includes('progress') || norm.includes('pending')) return 'bg-yellow-100 text-yellow-800';
  return 'bg-gray-100 text-gray-800';
};

const formatStatusDisplay = (status: string | undefined): string => {
  if (!status) return 'Pending';
  return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
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

const computePayoutOrBalanceLabel = (coupon: Coupon, derived: string, formatCurrencyFn: (n: number) => string): string => {
  const multiplier = Number(calculateMultiplier(coupon.bets.map(b => b.odds)));
  const stake = parseFloat(String(coupon.bet_stake)) || 0;
  const potential = coupon.potential_payout ?? (multiplier * stake);
  if (derived === 'won') return formatCurrencyFn((potential || 0) - stake);
  if (derived === 'lost') return formatCurrencyFn(-stake);
  if (derived === 'cashed_out') return formatCurrencyFn((potential || 0) - stake);
  return formatCurrencyFn(potential || 0); // in_progress / pending
};

const renderBetResultIcons = (coupon: Coupon): ReactNode => (
  <div className="flex items-center gap-1 flex-wrap">
    {coupon.bets.map((b, idx) => {
      const res = normalizeStatus(String(b.result));
      if (res.includes('win')) {
        return <CheckCircle key={b.id ?? idx} size={16} className="text-green-600" aria-label="Won" />;
      } else if (res.includes('lost')) {
        return <XCircle key={b.id ?? idx} size={16} className="text-red-600" aria-label="Lost" />;
      } else {
        return <Circle key={b.id ?? idx} size={14} className="text-gray-400" aria-label="Pending" />;
      }
    })}
  </div>
);

const renderStatusBadge = (derived: string): ReactNode => (
  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium gap-1 ${getStatusColor(derived)}`}>
    {derived === 'won' ? (
      <CheckCircle size={14} aria-label="Won" />
    ) : derived === 'lost' ? (
      <XCircle size={14} aria-label="Lost" />
    ) : (
      <Circle size={12} aria-label="Pending" />
    )}
    <span>{formatStatusDisplay(derived)}</span>
  </span>
);

const CouponsTable = forwardRef<CouponsTableRef, CouponsTableProps>(({ bulkMode = false, selectedIds = new Set(), onToggleSelect, filters, hideEdit = false, showOnlySettled = false }, ref) => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCouponId, setEditingCouponId] = useState<number | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(0);
  const { formatDateWithoutTime } = useDateFormatter();
  const { formatCurrency } = useCurrency();

  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getCoupons(filters);
      let sorted = [...data].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Filter only settled coupons if showOnlySettled is true
      if (showOnlySettled) {
        sorted = sorted.filter(coupon => {
          const status = normalizeStatus(coupon.status);
          return status.includes('won') || status.includes('lost') || status === 'win' || status === 'lose';
        });
      }

      setCoupons(sorted);
      setError(null);
      setPage(0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch coupons';
      setError(errorMessage);
      console.error('Error fetching coupons:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, showOnlySettled]);

  useImperativeHandle(ref, () => ({ refetch: fetchCoupons }));

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  // Pagination derivations
  const total = coupons.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const start = safePage * pageSize;
  const end = Math.min(start + pageSize, total);
  const pageCoupons = coupons.slice(start, end);

  const handleChangePageSize = (value: number) => {
    setPageSize(value);
    setPage(0);
  };

  const handlePrev = () => setPage(p => Math.max(0, p - 1));
  const handleNext = () => setPage(p => Math.min(totalPages - 1, p + 1));

  const toggleSelect = (id: number) => {
    if (onToggleSelect) onToggleSelect(id);
  };

  const strategyLabel = (c: CouponWithStrategy): string => {
    const s = c.strategy;
    if (!s) return 'none';
    if (typeof s === 'string') return s || 'none';
    if (typeof s === 'number') return `#${s}`;
    if (typeof s === 'object') {
      const name = (s as { name?: unknown }).name;
      if (typeof name === 'string' && name.trim()) return name;
    }

    return 'none';
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary">Show last:</span>
            <select
              value={pageSize}
              onChange={(e) => handleChangePageSize(Number(e.target.value))}
              className="px-3 py-1 border border-default rounded-md text-sm"
            >
              {[5, 10, 15, 20].map(sz => (
                <option key={sz} value={sz}>{sz}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={safePage === 0}
              className="px-3 py-1 border border-default rounded-md text-sm disabled:opacity-50 hover:bg-gray-50"
            >
              Prev
            </button>
            <span className="text-sm text-text-secondary">
              Page {safePage + 1} / {totalPages}
            </span>
            <button
              onClick={handleNext}
              disabled={safePage >= totalPages - 1}
              className="px-3 py-1 border border-default rounded-md text-sm disabled:opacity-50 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
      <table className="w-full">
        <thead>
          <tr className="bg-background-table-header">
            {bulkMode && <th className="px-2 py-3"></th>}
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">Coupon Type</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">Bookmaker</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">Strategy</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">Bet Amount</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">Multiplier</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">Bets</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">Payout / Balance</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">Date</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">Status</th>
            {!hideEdit && <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header w-12"></th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-default">
          {pageCoupons.map(coupon => {
            const derived = deriveStatusHelper(coupon);
            const payoutOrBalanceLabel = computePayoutOrBalanceLabel(coupon, derived, formatCurrency);
            const multiplier = calculateMultiplier(coupon.bets.map(b => b.odds));

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
                <td className="px-4 py-4 text-sm text-text-secondary">{coupon.bookmaker ?? '—'}</td>
                <td className="px-4 py-4 text-sm text-text-secondary">{strategyLabel(coupon as CouponWithStrategy)}</td>
                <td className="px-4 py-4 text-sm text-text-primary">{formatCurrency(parseFloat(String(coupon.bet_stake)) || 0)}</td>
                <td className="px-4 py-4 text-sm text-text-primary">{multiplier}</td>
                <td className="px-4 py-4">{renderBetResultIcons(coupon)}</td>
                <td className="px-4 py-4 text-sm">
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(derived)}`}>{payoutOrBalanceLabel}</span>
                </td>
                <td className="px-4 py-4 text-sm text-text-secondary">{formatDateWithoutTime(coupon.created_at)}</td>
                <td className="px-4 py-4 text-sm">{renderStatusBadge(derived)}</td>
                {!hideEdit && (
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
                )}
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
