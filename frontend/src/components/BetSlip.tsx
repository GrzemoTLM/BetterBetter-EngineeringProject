import { Plus, Trash2, Search, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../services/api';
import type { Strategy } from '../types/strategies';
import type { Bet as BetData, BetType as BetTypeOption } from '../types/coupons';
import type { BookmakerAccountCreateResponse } from '../types/finances';

interface Bet extends BetData {
  id: number; // lokalne tymczasowe ID jako number dla zgodności z BetData
  confirmed?: boolean;
}

interface BetSlipProps {
  strategies?: Strategy[];
  selectedStrategy?: string;
  onStrategyChange?: (strategy: string) => void;
  onClose?: () => void;
  onCouponCreated?: () => void;
}

const BetSlip = ({
  strategies = [],
  selectedStrategy = '',
  onStrategyChange,
  onClose,
  onCouponCreated,
}: BetSlipProps) => {
  const [bookmakerAccounts, setBookmakerAccounts] = useState<BookmakerAccountCreateResponse[]>([]);
  const [betTypes, setBetTypes] = useState<BetTypeOption[]>([]);
  const [selectedBookmaker, setSelectedBookmaker] = useState<string>('');
  const [strategy, setStrategy] = useState(selectedStrategy || (strategies[0]?.name ?? ''));
  const [bets, setBets] = useState<Bet[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStake, setActiveStake] = useState('50');
  const [customStake, setCustomStake] = useState('');
  const [loading, setLoading] = useState(false);
  const [couponId, setCouponId] = useState<number | null>(null);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [potentialPayout, setPotentialPayout] = useState<number>(0);

  // Fetch bookmaker accounts and bet types on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const accounts = await api.getBookmakerAccounts();
        setBookmakerAccounts(accounts);
        if (accounts.length > 0) {
          setSelectedBookmaker(accounts[0].id.toString());

          // Create empty coupon with first bookmaker and default stake
          const newCoupon = await api.createEmptyCoupon(accounts[0].id, activeStake);
          setCouponId(newCoupon.id);
          applyCouponMetrics(newCoupon);
        }

        const types = await api.getBetTypes();
        setBetTypes(types);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyCouponMetrics = (coupon: { potential_payout?: number; multiplier?: number; bet_stake?: number | string }) => {
    const stakeNumber = coupon.bet_stake !== undefined ? Number(coupon.bet_stake) : Number(activeStake);
    const backendMultiplier = coupon.multiplier;
    const backendPayout = coupon.potential_payout;

    if (backendMultiplier !== undefined && backendMultiplier !== null) {
      setMultiplier(backendMultiplier);
    } else if (backendPayout !== undefined && stakeNumber > 0) {
      setMultiplier(Number((backendPayout / stakeNumber).toFixed(2)));
    } else {
      setMultiplier(1);
    }

    if (backendPayout !== undefined && backendPayout !== null) {
      setPotentialPayout(backendPayout);
    }
  };

  const handleStrategyChange = (value: string) => {
    setStrategy(value);
    if (onStrategyChange) {
      onStrategyChange(value);
    }
  };

  const handleStakeChange = async (stake: string) => {
    setActiveStake(stake);
    let finalStake = stake;

    if (stake === 'Custom') {
      return;
    }

    if (!couponId) {
      return;
    }

    if (stake === 'Custom' && customStake) {
      finalStake = customStake;
    }

    try {
      setLoading(true);
      // Update stake in database
      await api.updateCouponStake(couponId, finalStake);
      // Recalculate
      const updatedCoupon = await api.recalculateCoupon(couponId);
      applyCouponMetrics(updatedCoupon);
    } catch (error) {
      console.error('Error recalculating coupon:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBet = async (id: number) => {
    const betToRemove = bets.find(bet => bet.id === id);

    // Jeśli bet jest confirmed, trzeba go usunąć z serwera
    if (betToRemove?.confirmed && couponId) {
      try {
        setLoading(true);
        // TODO: Backend powinien obsługiwać DELETE /api/coupons/coupons/{id}/bets/{bet_id}/
        // Na razie tylko usuwamy lokalnie i recalc
        setBets(bets.filter((bet) => bet.id !== id));

        // Recalculate
        const updatedCoupon = await api.recalculateCoupon(couponId);
        applyCouponMetrics(updatedCoupon);
      } catch (error) {
        console.error('Error removing bet:', error);
      } finally {
        setLoading(false);
      }
    } else {
      // Jeśli niezatwierdzony, tylko usuń lokalnie
      setBets(bets.filter((bet) => bet.id !== id));
    }
  };

  const handleConfirmBet = async (id: number) => {
    if (!couponId) {
      alert('Coupon not created');
      return;
    }

    const betToConfirm = bets.find(bet => bet.id === id);
    if (!betToConfirm) return;

    // Validate bet fields
    if (!betToConfirm.event_name || !betToConfirm.bet_type || !betToConfirm.line || !betToConfirm.odds) {
      alert('Please fill in all bet fields (Event, Type, Line, Odds)');
      return;
    }

    try {
      setLoading(true);

      // Add single bet to API
      const betData = {
        event_name: betToConfirm.event_name,
        bet_type: betToConfirm.bet_type,
        line: betToConfirm.line,
        odds: betToConfirm.odds,
        start_time: betToConfirm.start_time || new Date().toISOString(),
      };

      await api.addSingleBetToCoupon(couponId, betData);

      // Recalculate coupon
      const updatedCoupon = await api.recalculateCoupon(couponId);
      applyCouponMetrics(updatedCoupon);

      // Mark bet as confirmed locally
      setBets(bets.map((bet) => (bet.id === id ? { ...bet, confirmed: true } : bet)));
    } catch (error) {
      console.error('Error confirming bet:', error);
      alert('Error confirming bet');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBet = () => {
    const newBet: Bet = {
      id: Date.now(),
      event_name: '',
      bet_type: '',
      line: '',
      odds: '',
      start_time: new Date().toISOString(),
    };
    setBets([...bets, newBet]);
  };

  const handleBetChange = (id: number, field: keyof Bet, value: string) => {
    setBets(bets.map((bet) => (bet.id === id ? { ...bet, [field]: value } : bet)));
  };

  const handleSaveAndExit = async () => {
    if (!couponId) {
      alert('Coupon not created');
      return;
    }

    if (bets.length === 0) {
      alert('Please add at least one bet');
      return;
    }

    // Validate all bets are confirmed
    const unconfirmedBets = bets.filter(bet => !bet.confirmed);
    if (unconfirmedBets.length > 0) {
      alert('Please confirm all bets before saving');
      return;
    }

    try {
      setLoading(true);

      // Verify coupon exists in database
      const verifiedCoupon = await api.getCoupon(couponId);
      if (!verifiedCoupon) {
        alert('Coupon not found in database');
        return;
      }

      alert('Coupon saved successfully!');
      if (onCouponCreated) {
        onCouponCreated();
      }

      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error saving coupon:', error);
      alert('Error verifying coupon');
    } finally {
      setLoading(false);
    }
  };

  const handleDiscard = async () => {
    if (couponId) {
      try {
        await api.deleteCoupon(couponId);
      } catch (error) {
        console.error('Error deleting coupon:', error);
      }
    }

    setBets([]);
    setActiveStake('50');
    setCustomStake('');

    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="bg-background-paper rounded-xl shadow-sm p-6 flex flex-col">
      {/* Top Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Bookmaker
          </label>
          <select
            value={selectedBookmaker}
            onChange={(e) => setSelectedBookmaker(e.target.value)}
            className="w-full px-4 py-2 border border-default rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-main focus:border-transparent"
          >
            {bookmakerAccounts.length > 0 ? (
              bookmakerAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.bookmaker} - {account.external_username}
                </option>
              ))
            ) : (
              <option value="">No bookmaker accounts</option>
            )}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Strategy
          </label>
          <select
            value={strategy}
            onChange={(e) => handleStrategyChange(e.target.value)}
            className="w-full px-4 py-2 border border-default rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-main focus:border-transparent"
          >
            {strategies.length > 0 ? (
              strategies.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))
            ) : (
              <option value="">No strategies available</option>
            )}
          </select>
        </div>
      </div>
      <div className="mb-6 flex justify-end">
        <button
          onClick={handleAddBet}
          className="border border-primary-main text-primary-main rounded-lg px-4 py-2 text-sm hover:bg-blue-50 transition-colors flex items-center gap-2">
          <Plus size={16} />
          Add new bet
        </button>
      </div>

      {/* Betting Table */}
      <div className="flex flex-col mb-6">
        <h4 className="text-sm font-semibold text-text-primary mb-3">
          Betting Table
        </h4>
        <div className="max-h-64 overflow-y-auto border border-default rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="bg-background-table-header border-b border-default">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">
                  Event
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">
                  Bet Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">
                  Line
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">
                  Odds
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header w-12">
                  {/* Actions column */}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {bets.map((bet) => (
                <tr
                  key={bet.id}
                  className="hover:bg-gray-50 transition-colors group"
                >
                  <td className="px-4 py-3 text-sm">
                    <input
                      type="text"
                      value={bet.event_name}
                      onChange={(e) => handleBetChange(bet.id, 'event_name', e.target.value)}
                      disabled={bet.confirmed}
                      className={`w-full px-2 py-1 border border-default rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-main ${
                        bet.confirmed ? 'bg-gray-50 cursor-not-allowed opacity-75' : ''
                      }`}
                      placeholder="Event name"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <select
                      value={bet.bet_type}
                      onChange={(e) => handleBetChange(bet.id, 'bet_type', e.target.value)}
                      disabled={bet.confirmed}
                      className={`w-full px-2 py-1 border border-default rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-main ${
                        bet.confirmed ? 'bg-gray-50 cursor-not-allowed opacity-75' : ''
                      }`}
                    >
                      <option value="">Select bet type</option>
                      {betTypes && betTypes.length > 0 ? (
                        betTypes.map((type) => (
                          type && type.code ? (
                            <option key={type.code} value={type.id ?? type.code}>
                              {type.code}
                            </option>
                          ) : null
                        ))
                      ) : (
                        <option disabled>Loading bet types...</option>
                      )}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <input
                      type="text"
                      value={bet.line}
                      onChange={(e) => handleBetChange(bet.id, 'line', e.target.value)}
                      disabled={bet.confirmed}
                      className={`w-full px-2 py-1 border border-default rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-main ${
                        bet.confirmed ? 'bg-gray-50 cursor-not-allowed opacity-75' : ''
                      }`}
                      placeholder="Line"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <input
                      type="text"
                      value={bet.odds}
                      onChange={(e) => handleBetChange(bet.id, 'odds', e.target.value)}
                      disabled={bet.confirmed}
                      className={`w-full px-2 py-1 border border-default rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-main ${
                        bet.confirmed ? 'bg-gray-50 cursor-not-allowed opacity-75' : ''
                      }`}
                      placeholder="Odds"
                    />
                  </td>
                  <td className="px-4 py-3 flex gap-1 items-center">
                    {!bet.confirmed ? (
                      <button
                        onClick={() => handleConfirmBet(bet.id)}
                        className="p-1 hover:bg-green-50 rounded transition-colors"
                        title="Confirm bet"
                      >
                        <Check size={16} className="text-green-600" />
                      </button>
                    ) : (
                      <div className="p-1">
                        <Check size={16} className="text-green-600" />
                      </div>
                    )}
                    <button
                      onClick={() => handleRemoveBet(bet.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={16} className="text-status-error" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Quick Add Search */}
        <div className="mt-4 relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Quick add events"
            className="w-full pl-10 pr-4 py-2 border border-default rounded-lg text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-main focus:border-transparent"
          />
        </div>
      </div>

      {/* Summary Box */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1 bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="text-xs font-medium text-text-secondary mb-1">Total Multiplier</div>
          <div className="text-2xl font-bold text-text-primary">{multiplier.toFixed(2)}</div>
        </div>
        <div className="flex-1 bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="text-xs font-medium text-text-secondary mb-1">Potential Payout</div>
          <div className="text-2xl font-bold text-text-primary">${potentialPayout.toFixed(2)}</div>
        </div>
      </div>

      {/* Stake Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Stake
        </label>
        <div className="flex gap-2">
          {['50', '100', '500', 'Custom'].map((stake) => (
            <button
              key={stake}
              onClick={() => handleStakeChange(stake)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeStake === stake
                  ? 'bg-primary-main text-primary-contrast'
                  : 'bg-white border border-default text-text-primary hover:bg-gray-50'
              }`}
            >
              {stake === 'Custom' ? 'Custom' : `${stake}$`}
            </button>
          ))}
        </div>
        {activeStake === 'Custom' && (
          <div className="mt-3 flex gap-2">
            <input
              type="number"
              value={customStake}
              onChange={(e) => setCustomStake(e.target.value)}
              placeholder="Enter custom stake amount"
              min="0"
              step="0.01"
              className="flex-1 px-4 py-2 border border-default rounded-lg text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-main focus:border-transparent"
            />
            <button
              onClick={() => {
                if (customStake) {
                  handleStakeChange('Custom');
                }
              }}
              className="px-4 py-2 bg-primary-main text-primary-contrast rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
            >
              Set
            </button>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleDiscard}
          className="flex-1 bg-red-500 text-white rounded-lg px-6 py-3 hover:bg-red-600 transition-colors font-medium disabled:opacity-50"
          disabled={loading}
        >
          Discard
        </button>
        <button
          onClick={handleSaveAndExit}
          className="flex-1 bg-emerald-500 text-white rounded-lg px-6 py-3 hover:bg-emerald-600 transition-colors font-medium disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save and exit'}
        </button>
      </div>
    </div>
  );
};

export default BetSlip;

