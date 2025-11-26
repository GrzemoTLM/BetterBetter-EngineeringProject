import { X, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../services/api';
import type { Coupon } from '../types/coupons';
import { useCurrency } from '../hooks/useCurrency';

interface EditCouponModalProps {
  couponId: number;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: (updated: Coupon) => void;
}

const EditCouponModal = ({ couponId, isOpen, onClose, onUpdated }: EditCouponModalProps) => {
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    const loadCoupon = async () => {
      if (!isOpen) return;
      try {
        setLoading(true);
        const data = await api.getCoupon(couponId);
        setCoupon(data);
        setError(null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load coupon';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    loadCoupon();
  }, [couponId, isOpen]);

  const handleForceWin = async () => {
    try {
      setLoading(true);
      const updated = await api.forceWinCoupon(couponId);
      setCoupon(updated);
      if (onUpdated) onUpdated(updated);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to mark coupon as won';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const computeMultiplier = (c: Coupon) => c.bets.reduce((acc, b) => {
    const o = parseFloat(String(b.odds));
    return isNaN(o) ? acc : acc * o;
  }, 1);

  const computeBalance = (c: Coupon) => {
    const stake = Number(c.bet_stake) || 0;
    const payout = Number(c.potential_payout) || computeMultiplier(c) * stake;
    const statusNorm = (c.status || '').toLowerCase();
    if (statusNorm === 'won') return payout - stake;
    if (statusNorm === 'lost') return -stake;
    if (statusNorm === 'cashed out') return payout - stake;
    return 0;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-md w-full max-w-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-default">
          <h3 className="text-base font-semibold text-text-primary">Edit Coupon</h3>
          <button
            className="p-2 rounded hover:bg-gray-100"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4">
          {loading && (
            <div className="text-sm text-text-secondary">Loading...</div>
          )}
          {error && (
            <div className="text-sm text-status-error mb-3">{error}</div>
          )}

          {coupon && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <div className="text-xs text-text-secondary">Total Multiplier</div>
                  <div className="text-xl font-bold text-text-primary">
                    {computeMultiplier(coupon).toFixed(2)}
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <div className="text-xs text-text-secondary">Potential Payout</div>
                  <div className="text-xl font-bold text-text-primary">
                    {formatCurrency(Number(coupon.potential_payout) || 0)}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-default">
                  <div className="text-xs text-text-secondary">Stake</div>
                  <div className="text-xl font-bold text-text-primary">
                    {formatCurrency(Number(coupon.bet_stake) || 0)}
                  </div>
                </div>
              </div>

              {/* Balance box visible when coupon is settled */}
              {['won','lost','cashed out'].includes((coupon.status || '').toLowerCase()) && (
                <div className="bg-white rounded-lg p-3 border border-default">
                  <div className="text-xs text-text-secondary">Balance</div>
                  <div className={`text-xl font-bold ${computeBalance(coupon) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {formatCurrency(computeBalance(coupon))}
                  </div>
                </div>
              )}

              <div>
                <div className="text-sm font-semibold text-text-primary mb-2">Bets</div>
                <div className="border border-default rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-background-table_header border-b border-default">
                        <th className="px-4 py-2 text-left text-xs uppercase tracking-wider text-text-secondary">Event</th>
                        <th className="px-4 py-2 text-left text-xs uppercase tracking-wider text-text-secondary">Type</th>
                        <th className="px-4 py-2 text-left text-xs uppercase tracking-wider text-text-secondary">Line</th>
                        <th className="px-4 py-2 text-left text-xs uppercase tracking-wider text-text-secondary">Odds</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-default">
                      {coupon.bets.map((b) => (
                        <tr key={`${b.event_name}-${b.line}-${b.odds}`} className="bg-white">
                          <td className="px-4 py-2 text-sm text-text-primary">{b.event_name}</td>
                          <td className="px-4 py-2 text-sm text-text-secondary">{String(b.bet_type)}</td>
                          <td className="px-4 py-2 text-sm text-text-primary">{String(b.line)}</td>
                          <td className="px-4 py-2 text-sm text-text-primary">{String(b.odds)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                {/* Hide force win if coupon is already settled */}
                {!['won','lost'].includes((coupon.status || '').toLowerCase()) && (
                  <button
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={handleForceWin}
                    disabled={loading}
                  >
                    <CheckCircle size={18} />
                    Mark as Won
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditCouponModal;

