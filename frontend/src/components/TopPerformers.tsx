import { Trophy, TrendingUp, Award } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import api, { type StrategySummaryItem } from '../services/api';

interface TopPerformersProps {
  filters?: Record<string, string>;
}

type BookmakerPerformance = {
  id?: number;
  bookmaker?: string | null;
  alias?: string | null;
  currency?: string | null;
  coupon_balance?: number | string | null;
  coupon_count?: number | string | null;
  won_profit?: number | string | null;
  won_count?: number | string | null;
  lost_profit?: number | string | null;
  lost_count?: number | string | null;
};

const parseNumber = (value: number | string | null | undefined): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
};

const TopPerformers = ({ filters }: TopPerformersProps) => {
  const [bookmakerSummary, setBookmakerSummary] = useState<BookmakerPerformance[]>([]);
  const [strategySummary, setStrategySummary] = useState<StrategySummaryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [strategyLoading, setStrategyLoading] = useState(false);
  const [strategyError, setStrategyError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      console.log('[TOP PERFORMERS FETCH] start', filters);
      try {
        setLoading(true);
        setError(null);
        const summary = await api.getBookmakerAccountsSummary(filters);
        console.log('[TOP PERFORMERS FETCH] success', Array.isArray(summary) ? summary.slice(0, 3) : summary);
        setBookmakerSummary(summary || []);
      } catch (err) {
        console.error('[TOP PERFORMERS FETCH] error', err);
        const message = err instanceof Error ? err.message : 'Failed to load summaries';
        setError(message);
        setBookmakerSummary([]);
      } finally {
        console.log('[TOP PERFORMERS FETCH] finished');
        setLoading(false);
      }
    };

    fetchSummary();
  }, [filters]);

  useEffect(() => {
    const fetchStrategySummary = async () => {
      console.log('[TOP STRATEGIES FETCH] start');
      try {
        setStrategyLoading(true);
        setStrategyError(null);
        const summary = await api.getStrategiesSummary(filters);
        console.log('[TOP STRATEGIES FETCH] success', Array.isArray(summary) ? summary.slice(0, 3) : summary);
        setStrategySummary(summary || []);
      } catch (err) {
        console.error('[TOP STRATEGIES FETCH] error', err);
        const message = err instanceof Error ? err.message : 'Failed to load strategies summary';
        setStrategyError(message);
        setStrategySummary([]);
      } finally {
        console.log('[TOP STRATEGIES FETCH] finished');
        setStrategyLoading(false);
      }
    };

    fetchStrategySummary();
  }, [filters]);

  const topBookmakers = useMemo(() => {
    if (!bookmakerSummary?.length) return [];

    return [...bookmakerSummary]
      .map((item) => ({
        id: item.id ?? item.bookmaker ?? item.alias ?? Math.random(),
        name: item.alias?.trim() || item.bookmaker || 'Unknown',
        balance: parseNumber(item.coupon_balance),
        currency: item.currency ?? '',
      }))
      .sort((a, b) => (b.balance ?? 0) - (a.balance ?? 0))
      .slice(0, 3);
  }, [bookmakerSummary]);

  const topStrategies = useMemo(() => {
    if (!strategySummary?.length) return [];

    return [...strategySummary]
      .map((item) => ({
        id: item.strategy_id,
        name: item.strategy_name,
        description: item.description,
        balance: parseNumber(item.coupon_balance),
      }))
      .sort((a, b) => (b.balance ?? 0) - (a.balance ?? 0))
      .slice(0, 3);
  }, [strategySummary]);

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* Top Bookmakers */}
      <div className="bg-background-paper rounded-xl shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Trophy size={20} className="text-primary-main" />
          <h3 className="text-lg font-semibold text-text-primary">
            Top Bookmakers
          </h3>
        </div>

        {loading ? (
          <div className="text-sm text-text-secondary">Loading bookmakers...</div>
        ) : error ? (
          <div className="text-sm text-status-error">{error}</div>
        ) : topBookmakers.length === 0 ? (
          <div className="text-sm text-text-secondary">No bookmakers data.</div>
        ) : (
          <div className="space-y-3">
            {topBookmakers.map((bookmaker, index) => (
              <div
                key={String(bookmaker.id ?? `${bookmaker.name}-${index}`)}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      index === 0
                        ? 'bg-yellow-500'
                        : index === 1
                        ? 'bg-gray-400'
                        : 'bg-amber-600'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-text-primary">
                      {bookmaker.name}
                    </div>
                    <div className="text-xs text-text-secondary">
                      —
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-text-primary">
                    {bookmaker.balance !== undefined ? `${bookmaker.balance.toFixed(2)} ${bookmaker.currency}` : '—'}
                  </div>
                  <div className="text-xs text-text-secondary flex items-center gap-1">
                    <TrendingUp size={10} />
                    Balance
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Strategies */}
      <div className="bg-background-paper rounded-xl shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Award size={20} className="text-secondary-main" />
          <h3 className="text-lg font-semibold text-text-primary">
            Top Strategies
          </h3>
        </div>
        {strategyLoading ? (
          <div className="text-sm text-text-secondary">Loading strategies...</div>
        ) : strategyError ? (
          <div className="text-sm text-status-error">{strategyError}</div>
        ) : topStrategies.length === 0 ? (
          <div className="text-sm text-text-secondary">No strategies data.</div>
        ) : (
          <div className="space-y-3">
            {topStrategies.map((strategy, index) => (
              <div
                key={strategy.id ?? index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      index === 0
                        ? 'bg-yellow-500'
                        : index === 1
                        ? 'bg-gray-400'
                        : 'bg-amber-600'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-text-primary">
                      {strategy.name}
                    </div>
                    <div className="text-xs text-text-secondary">
                      {strategy.description || '—'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-text-primary">
                    {strategy.balance !== undefined ? `${strategy.balance.toFixed(2)} PLN` : '—'}
                  </div>
                  <div className="text-xs text-text-secondary flex items-center gap-1">
                    <TrendingUp size={10} />
                    Balance
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TopPerformers;
