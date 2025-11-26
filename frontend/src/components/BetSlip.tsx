import { Plus, Trash2, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import SummaryBox from './SummaryBox';
import api from '../services/api';
import type { Strategy } from '../types/strategies';
import type { Bet as BetData, CreateCouponRequest, BetType as BetTypeOption } from '../types/coupons';
import type { BookmakerAccountCreateResponse } from '../types/finances';

interface Bet extends BetData {
  id: string;
}

interface BetSlipProps {
  strategies?: Strategy[];
  selectedStrategy?: string;
  onStrategyChange?: (strategy: string) => void;
  onClose?: () => void;
}

const BetSlip = ({
  strategies = [],
  selectedStrategy = '',
  onStrategyChange,
  onClose,
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

  // Fetch bookmaker accounts and bet types on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const accounts = await api.getBookmakerAccounts();
        setBookmakerAccounts(accounts);
        if (accounts.length > 0) {
          setSelectedBookmaker(accounts[0].id.toString());
        }

        const types = await api.getBetTypes();
        setBetTypes(types);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleStrategyChange = (value: string) => {
    setStrategy(value);
    if (onStrategyChange) {
      onStrategyChange(value);
    }
  };

  const handleRemoveBet = (id: string) => {
    setBets(bets.filter((bet) => bet.id !== id));
  };

  const handleAddBet = () => {
    const newBet: Bet = {
      id: Date.now().toString(),
      event_name: '',
      bet_type: '',
      line: '',
      odds: '',
      start_time: new Date().toISOString(),
    };
    setBets([...bets, newBet]);
  };

  const handleBetChange = (id: string, field: keyof Bet, value: string) => {
    setBets(bets.map((bet) => (bet.id === id ? { ...bet, [field]: value } : bet)));
  };

  const handleSaveAndExit = async () => {
    if (bets.length === 0) {
      alert('Please add at least one bet');
      return;
    }

    // Validate all bets have required fields
    for (const bet of bets) {
      if (!bet.event_name || !bet.bet_type || !bet.line || !bet.odds) {
        alert('Please fill in all bet fields (Event, Type, Line, Odds)');
        return;
      }
    }

    if (!selectedBookmaker) {
      alert('Please select a bookmaker account');
      return;
    }

    try {
      setLoading(true);
      const stake = activeStake === 'Custom' ? customStake : activeStake;

      if (!stake) {
        alert('Please select or enter a stake amount');
        return;
      }

      const couponData: CreateCouponRequest = {
        bookmaker_account: parseInt(selectedBookmaker, 10),
        coupon_type: 'SOLO',
        bet_stake: stake,
        placed_at: new Date().toISOString(),
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        bets: bets.map(({ id, ...bet }) => ({
          event_name: bet.event_name,
          bet_type: bet.bet_type,
          line: bet.line,
          odds: bet.odds,
          start_time: bet.start_time || new Date().toISOString(),
        })),
      };
      await api.createCoupon(couponData);
      alert('Coupon saved successfully!');
      if (onClose) {
        onClose();
      }
    } catch (error) {
      let errorMessage = 'Error saving coupon';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscard = () => {
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
                      className="w-full px-2 py-1 border border-default rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-main"
                      placeholder="Event name"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <select
                      value={bet.bet_type}
                      onChange={(e) => handleBetChange(bet.id, 'bet_type', e.target.value)}
                      className="w-full px-2 py-1 border border-default rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-main"
                    >
                      <option value="">Select bet type</option>
                      {betTypes && betTypes.length > 0 ? (
                        betTypes.map((type) => (
                          type && type.code ? (
                            <option key={type.code} value={type.code}>
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
                      className="w-full px-2 py-1 border border-default rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-main"
                      placeholder="Line"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <input
                      type="text"
                      value={bet.odds}
                      onChange={(e) => handleBetChange(bet.id, 'odds', e.target.value)}
                      className="w-full px-2 py-1 border border-default rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-main"
                      placeholder="Odds"
                    />
                  </td>
                  <td className="px-4 py-3">
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
      <div className="mb-6">
        <SummaryBox />
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
              onClick={() => setActiveStake(stake)}
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
          <div className="mt-3">
            <input
              type="number"
              value={customStake}
              onChange={(e) => setCustomStake(e.target.value)}
              placeholder="Enter custom stake amount"
              min="0"
              step="0.01"
              className="w-full px-4 py-2 border border-default rounded-lg text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-main focus:border-transparent"
            />
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

