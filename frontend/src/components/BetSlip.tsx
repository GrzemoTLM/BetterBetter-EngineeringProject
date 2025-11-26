import { Plus, Trash2, Search } from 'lucide-react';
import { useState } from 'react';
import SummaryBox from './SummaryBox';
import type { Strategy } from '../types/strategies';

interface Bet {
  id: string;
  name: string;
  bet: string;
  multiplier: string;
}

interface BetSlipProps {
  strategies?: Strategy[];
  selectedStrategy?: string;
  onStrategyChange?: (strategy: string) => void;
}

const BetSlip = ({
  strategies = [],
  selectedStrategy = '',
  onStrategyChange,
}: BetSlipProps) => {
  const [bookmaker, setBookmaker] = useState('STS');
  const [strategy, setStrategy] = useState(selectedStrategy || (strategies[0]?.name ?? ''));
  const [bets, setBets] = useState<Bet[]>([
    { id: '1', name: 'Barcelona goals', bet: 'over 2.5', multiplier: '2.11' },
    { id: '2', name: 'Real Madrid win', bet: '1X2', multiplier: '1.85' },
    { id: '3', name: 'Total corners', bet: 'over 9.5', multiplier: '1.95' },
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStake, setActiveStake] = useState('50');
  const [customStake, setCustomStake] = useState('');

  const handleStrategyChange = (value: string) => {
    setStrategy(value);
    if (onStrategyChange) {
      onStrategyChange(value);
    }
  };

  const handleRemoveBet = (id: string) => {
    setBets(bets.filter((bet) => bet.id !== id));
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
            value={bookmaker}
            onChange={(e) => setBookmaker(e.target.value)}
            className="w-full px-4 py-2 border border-default rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-main focus:border-transparent"
          >
            <option>STS</option>
            <option>Fortuna</option>
            <option>Bet365</option>
            <option>William Hill</option>
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
        <button className="border border-primary-main text-primary-main rounded-lg px-4 py-2 text-sm hover:bg-blue-50 transition-colors flex items-center gap-2">
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
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">
                  Bet
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">
                  Multiplier
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
                  <td className="px-4 py-3 text-sm text-text-primary">
                    {bet.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-text-primary">
                    {bet.bet}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-text-primary">
                    {bet.multiplier}
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
        <button className="flex-1 bg-red-500 text-white rounded-lg px-6 py-3 hover:bg-red-600 transition-colors font-medium">
          Discard
        </button>
        <button className="flex-1 bg-emerald-500 text-white rounded-lg px-6 py-3 hover:bg-emerald-600 transition-colors font-medium">
          Save and exit
        </button>
      </div>
    </div>
  );
};

export default BetSlip;

