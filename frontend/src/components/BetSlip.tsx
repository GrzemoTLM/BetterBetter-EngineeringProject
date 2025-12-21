import { Plus, Trash2, Search, Check, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import type { Strategy } from '../types/strategies';
import type { Bet as BetData, BetType as BetTypeOption, Discipline as DisciplineOption, OcrExtractResponse } from '../types/coupons';
import type { BookmakerAccountCreateResponse } from '../types/finances';
import type { Coupon } from '../types/coupons';

interface Bet extends BetData {
  id: number;
  confirmed?: boolean;
}

interface BetSlipProps {
  strategies?: Strategy[];
  selectedStrategy?: string;
  onStrategyChange?: (strategy: string) => void;
  onClose?: () => void;
  onCouponCreated?: () => void;
  initialCouponId?: number;
  initialBookmakerAccountId?: number;
  initialCouponFromOcr?: OcrExtractResponse | null;
  initialBets?: Array<{ event_name: string; bet_type: string; line: string; odds: string; start_time?: string; discipline?: string | null }>;
}

const BetSlip = ({
  strategies = [],
  selectedStrategy = '',
  onStrategyChange,
  onClose,
  onCouponCreated,
  initialCouponId,
  initialBookmakerAccountId,
  initialCouponFromOcr,
  initialBets,
}: BetSlipProps) => {
  const [bookmakerAccounts, setBookmakerAccounts] = useState<BookmakerAccountCreateResponse[]>([]);
  const [betTypes, setBetTypes] = useState<BetTypeOption[]>([]);
  const [disciplines, setDisciplines] = useState<DisciplineOption[]>([]);
  const [couponBookmakerAccountId, setCouponBookmakerAccountId] = useState<number | null>(null);
  const [disciplineModalOpen, setDisciplineModalOpen] = useState<{ betId: number | null }>({ betId: null });
  const [betTypeModalOpen, setBetTypeModalOpen] = useState<{ betId: number | null }>({ betId: null });
  const [disciplineSearchQuery, setDisciplineSearchQuery] = useState('');
  const [betTypeSearchQuery, setBetTypeSearchQuery] = useState('');
  const [favoriteDisciplines, setFavoriteDisciplines] = useState<number[]>([]);
  const [favoriteBetTypes, setFavoriteBetTypes] = useState<number[]>([]);
  const [couponBookmakerName, setCouponBookmakerName] = useState<string>('');
  const [strategy, setStrategy] = useState(selectedStrategy || (strategies[0]?.name ?? ''));
  const [bets, setBets] = useState<Bet[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStake, setActiveStake] = useState('50');
  const [customStake, setCustomStake] = useState('');
  const [loading, setLoading] = useState(false);
  const [couponId, setCouponId] = useState<number | null>(initialCouponId ?? null);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [potentialPayout, setPotentialPayout] = useState<number>(0);
  const [ocrSuccessVisible, setOcrSuccessVisible] = useState(false);
  const ocrFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accounts, types, discs, settings] = await Promise.all([
          api.getBookmakerAccounts(),
          api.getBetTypes(),
          api.getDisciplines(),
          api.getSettings(),
        ]);

        setBookmakerAccounts(accounts);
        setBetTypes(types);
        setDisciplines(discs);

        if (settings.favourite_disciplines) {
          setFavoriteDisciplines(settings.favourite_disciplines);
        }

        if (settings.favourite_bet_types) {
          setFavoriteBetTypes(settings.favourite_bet_types);
        }

        if (accounts.length > 0) {
          if (initialBookmakerAccountId) {
            setCouponBookmakerAccountId(initialBookmakerAccountId);
            const acc = accounts.find(a => a.id === initialBookmakerAccountId);
            if (acc) setCouponBookmakerName(acc.bookmaker);
          }

          if (initialCouponId && !couponId) {
            setCouponId(initialCouponId);
            try {
              const existing = await api.getCoupon(initialCouponId);
              applyCouponMetrics(existing);
              setCouponBookmakerAccountId((existing as Coupon).bookmaker_account ?? null);
              setCouponBookmakerName((existing as Coupon).bookmaker ?? '');
            } catch {
              const created = await api.createEmptyCoupon(accounts[0].id, activeStake, { strategy: strategy || undefined });
              setCouponId(created.id);
              applyCouponMetrics(created);
              setCouponBookmakerAccountId((created as Coupon).bookmaker_account ?? accounts[0].id);
              setCouponBookmakerName((created as Coupon).bookmaker ?? accounts[0].bookmaker);
            }
          } else if (!couponId) {
            const created = await api.createEmptyCoupon(accounts[0].id, activeStake, { strategy: strategy || undefined });
            setCouponId(created.id);
            applyCouponMetrics(created);
            setCouponBookmakerAccountId((created as Coupon).bookmaker_account ?? accounts[0].id);
            setCouponBookmakerName((created as Coupon).bookmaker ?? accounts[0].bookmaker);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (initialCouponId && !couponId) {
      setCouponId(initialCouponId);
      (async () => {
        try {
          const existing = await api.getCoupon(initialCouponId);
          applyCouponMetrics(existing);
          setCouponBookmakerAccountId((existing as Coupon).bookmaker_account ?? null);
          setCouponBookmakerName((existing as Coupon).bookmaker ?? '');
        } catch (err) {
          console.error('Failed to fetch existing coupon', err);
        }
      })();
    }
   }, [initialCouponId]);

  useEffect(() => {
    if (initialBets && initialBets.length > 0 && bets.length === 0) {
      const mappedBets: Bet[] = initialBets.map((bet, index) => ({
        id: Date.now() + index,
        event_name: bet.event_name,
        bet_type: String(bet.bet_type || ''),
        line: bet.line,
        odds: bet.odds,
        start_time: bet.start_time || new Date().toISOString(),
        discipline: bet.discipline ? parseInt(String(bet.discipline), 10) || null : null,
        confirmed: false,
      }));
      setBets(mappedBets);
    }
  }, [initialBets]);

  useEffect(() => {
    if (!strategy && strategies && strategies.length > 0) {
      const defaultName = strategies[0].name;
      setStrategy(defaultName);
      onStrategyChange?.(defaultName);
    }
  }, [strategies]);

  const applyCouponMetrics = (coupon: { potential_payout?: number; multiplier?: number; bet_stake?: number | string; bets?: Array<{ odds: number | string }> }) => {
    const backendMultiplier = coupon.multiplier;
    const backendPayout = coupon.potential_payout;

    if (backendMultiplier !== undefined && backendMultiplier !== null) {
      setMultiplier(backendMultiplier);
    } else if (Array.isArray(coupon.bets) && coupon.bets.length > 0) {
      const product = coupon.bets.reduce((acc, b) => {
        const v = parseFloat(String(b.odds));
        return isNaN(v) ? acc : acc * v;
      }, 1);
      setMultiplier(Number(product.toFixed(2)));
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
      await api.updateCouponStake(couponId, finalStake);
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

    if (betToRemove?.confirmed && couponId) {
      try {
        setLoading(true);
        setBets(bets.filter((bet) => bet.id !== id));

        const updatedCoupon = await api.recalculateCoupon(couponId);
        applyCouponMetrics(updatedCoupon);
      } catch (error) {
        console.error('Error removing bet:', error);
      } finally {
        setLoading(false);
      }
    } else {
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

    if (!betToConfirm.event_name || !betToConfirm.bet_type || !betToConfirm.line || !betToConfirm.odds) {
      alert('Please fill in all bet fields (Event, Type, Line, Odds)');
      return;
    }

    try {
      setLoading(true);

      const betData = {
        event_name: betToConfirm.event_name,
        bet_type: betToConfirm.bet_type,
        line: betToConfirm.line,
        odds: betToConfirm.odds,
        start_time: betToConfirm.start_time || new Date().toISOString(),
        discipline: betToConfirm.discipline ?? null,
      };

      await api.addSingleBetToCoupon(couponId, betData);

      await api.recalculateCoupon(couponId);
      const refreshed = await api.getCoupon(couponId);
      applyCouponMetrics(refreshed);

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
      discipline: null,
    };
    setBets([...bets, newBet]);
  };

  const handleBetChange = async (id: number, field: keyof Bet, value: string) => {
    setBets(prevBets => {
      return prevBets.map((bet) => {
        if (bet.id === id) {
          if (field === 'discipline') {
            if (!value || value === '') {
              return { ...bet, discipline: null };
            }

            const disciplineId = parseInt(value, 10);

            if (!isNaN(disciplineId)) {
              return { ...bet, discipline: disciplineId };
            }

            return { ...bet, discipline: null };
          }

          return { ...bet, [field]: value };
        }

        return bet;
      });
    });

    if (field === 'discipline' && value) {
      try {
        const disciplineId = parseInt(value, 10);

        if (!isNaN(disciplineId)) {
          const filtered = await api.fetchBetTypesByDiscipline(disciplineId);

          setBetTypes(filtered);
        }
      } catch (error) {
        console.error('Error fetching bet types for discipline:', error);
      }
    }
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

    const unconfirmedBets = bets.filter(bet => !bet.confirmed);
    if (unconfirmedBets.length > 0) {
      alert('Please confirm all bets before saving');
      return;
    }

    try {
      setLoading(true);

      const verifiedCoupon = await api.getCoupon(couponId);
      if (!verifiedCoupon) {
        alert('Coupon not found in database');
        return;
      }

      const payload = {
        bet_stake: verifiedCoupon.bet_stake,
        placed_at: verifiedCoupon.created_at ?? new Date().toISOString(),
        ...(strategy ? { strategy } : {}),
      } as const;

      await api.updateCoupon(couponId, payload);

      alert('Coupon saved successfully!');
      onCouponCreated?.();
      onClose?.();
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

  const toggleFavoriteDiscipline = (id: number) => {
    setFavoriteDisciplines((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const toggleFavoriteBetType = (id: number | undefined) => {
    if (id === undefined) return;
    setFavoriteBetTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    if (!favoriteDisciplines.length && !favoriteBetTypes.length) {
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        await api.updateSettings({
          favourite_disciplines: favoriteDisciplines,
          favourite_bet_types: favoriteBetTypes,
        } as never);
      } catch (error) {
        console.error('Error saving favourites to user settings:', error);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [favoriteDisciplines, favoriteBetTypes]);



  const handleOCRFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await api.extractCouponViaOCR(file);
    } catch (err) {
      console.error('[UI] OCR - Error:', err);
    } finally {
      if (ocrFileInputRef.current) {
        ocrFileInputRef.current.value = '' as unknown as string;
      }
    }
  };

  useEffect(() => {
    if (!initialCouponFromOcr) return;


    const mappedBets: Bet[] = (initialCouponFromOcr.bets || []).map((b: BetData, idx: number) => ({
      id: Date.now() + idx,
      event_name: String(b.event_name ?? ''),
      bet_type: b.bet_type,
      line: b.line,
      odds: b.odds,
      start_time: b.start_time ?? new Date().toISOString(),
      discipline: b.discipline ?? null,
      confirmed: false,
    }));

    if (mappedBets.length > 0) {
      setBets(mappedBets);
      setOcrSuccessVisible(true);
    }

    if (initialCouponFromOcr.bet_stake) {
      const stakeStr = String(initialCouponFromOcr.bet_stake);
      setActiveStake(stakeStr);
    }
  }, [initialCouponFromOcr]);

  return (
    <div className="bg-background-paper rounded-xl shadow-sm p-6 flex flex-col">
      {/* Hidden file input for OCR */}
      <input
        ref={ocrFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleOCRFileSelected}
      />
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Bookmaker</label>
            <div className="w-full px-4 py-2 border border-default rounded-lg text-sm text-text-primary bg-gray-50">
              {(() => {
                const acc = bookmakerAccounts.find(a => a.id === couponBookmakerAccountId);
                if (acc) {
                  return (
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{acc.bookmaker}</span>
                      <span className="text-text-secondary text-xs">{acc.external_username}</span>
                    </div>
                  );
                }

                if (couponBookmakerName) return <span className="font-medium">{couponBookmakerName}</span>;

                return <span className="text-text-secondary">Loading...</span>;
              })()}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Strategy</label>
            <select
              value={strategy}
              onChange={(e) => handleStrategyChange(e.target.value)}
              className="w-full px-4 py-2 border border-default rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-main focus:border-transparent bg-white"
            >
              {strategies.length > 0 ?
                strategies.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))
              :
                <option value="">No strategies available</option>
              }
            </select>
          </div>
        </div>
        <div className="flex gap-3 items-center">
          <button
            onClick={handleAddBet}
            className="border border-primary-main text-primary-main rounded-lg px-4 py-2 text-sm hover:bg-blue-50 transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            Add new bet
          </button>
        </div>
      </div>

      {ocrSuccessVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg max-w-sm w-full mx-4 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Check size={18} className="text-emerald-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900">
                  OCR parsing finished
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOcrSuccessVisible(false)}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={16} className="text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-700 mb-4">
              Bets were filled from the ticket. Please check all bets and accept them using the green check icons.
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setOcrSuccessVisible(false)}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

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
                  Discipline
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
                    <button
                      type="button"
                      onClick={() => !bet.confirmed && setDisciplineModalOpen({ betId: bet.id })}
                      disabled={bet.confirmed}
                      className={`w-full px-2 py-1 border border-default rounded text-text-primary text-left focus:outline-none focus:ring-2 focus:ring-primary-main ${
                        bet.confirmed ? 'bg-gray-50 cursor-not-allowed opacity-75' : 'hover:bg-gray-50 cursor-pointer'
                      }`}
                    >
                      {bet.discipline != null 
                        ? (() => {
                            const disciplineId = typeof bet.discipline === 'number' ? bet.discipline : parseInt(String(bet.discipline), 10);
                            const selectedDiscipline = disciplines.find(d => d.id === disciplineId);
                            return selectedDiscipline?.name ? selectedDiscipline.name : 'Select discipline';
                          })()
                        : 'Select discipline'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      type="button"
                      onClick={() => !bet.confirmed && setBetTypeModalOpen({ betId: bet.id })}
                      disabled={bet.confirmed}
                      className={`w-full px-2 py-1 border border-default rounded text-text-primary text-left focus:outline-none focus:ring-2 focus:ring-primary-main ${
                        bet.confirmed ? 'bg-gray-50 cursor-not-allowed opacity-75' : 'hover:bg-gray-50 cursor-pointer'
                      }`}
                    >
                      {bet.bet_type
                        ? (() => {
                            const betTypeValue = String(bet.bet_type);
                            const selectedType = betTypes.find(t => t.code === betTypeValue || String(t.id) === betTypeValue);
                            return selectedType
                              ? `${selectedType.code} - ${selectedType.description ?? selectedType.code}`
                              : betTypeValue;
                          })()
                        : 'Select bet type'}
                    </button>
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
                        className="p-1 rounded-full bg-green-50 border border-green-300 shadow-sm animate-pulse hover:bg-green-100 transition-colors"
                        title="Confirm bet"
                      >
                        <Check size={16} className="text-green-700" />
                      </button>
                    ) : (
                      <div className="p-1 rounded-full bg-green-50 border border-green-200">
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

      {/* Discipline Selection Modal */}
      {disciplineModalOpen.betId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background-paper rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-text-primary">Select Discipline</h2>
              <button
                onClick={() => {
                  setDisciplineModalOpen({ betId: null });
                  setDisciplineSearchQuery('');
                }}
                className="p-2 hover:bg-background-table-header rounded-lg transition-colors"
              >
                <X size={20} className="text-text-secondary" />
              </button>
            </div>

            <div className="mb-4">
              <input
                type="text"
                value={disciplineSearchQuery}
                onChange={(e) => setDisciplineSearchQuery(e.target.value)}
                placeholder="Search disciplines..."
                className="w-full px-3 py-2 border border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-main"
              />
            </div>

            <div className="space-y-2 mb-6 max-h-80 overflow-y-auto">
              {(() => {
                const filtered = disciplines.filter(d =>
                  (d.name?.toLowerCase() || '').includes(disciplineSearchQuery.toLowerCase()) ||
                  (d.code?.toLowerCase() || '').includes(disciplineSearchQuery.toLowerCase())
                );

                const sorted = [...filtered].sort((a, b) => {
                  const aFav = favoriteDisciplines.includes(a.id);
                  const bFav = favoriteDisciplines.includes(b.id);
                  if (aFav === bFav) return 0;
                  return aFav ? -1 : 1;
                });

                const currentBet = bets.find(b => b.id === disciplineModalOpen.betId);
                const currentDisciplineId = currentBet?.discipline
                  ? (typeof currentBet.discipline === 'number' ? currentBet.discipline : parseInt(String(currentBet.discipline), 10))
                  : null;

                return sorted.length > 0 ? (
                  sorted.map((discipline) => {
                    const isSelected = currentDisciplineId === discipline.id;
                    const isFavorite = favoriteDisciplines.includes(discipline.id);

                    return (
                      <div
                        key={discipline.id}
                        className={`w-full flex items-center justify-between p-3 border rounded-lg transition-colors text-left text-sm ${
                          isSelected
                            ? 'border-primary-main bg-blue-50'
                            : 'border-border-light hover:border-border-medium hover:bg-gray-50'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={async () => {
                            if (disciplineModalOpen.betId !== null && discipline.id) {
                              setBets(prevBets => {
                                return prevBets.map((bet) => {
                                  if (bet.id === disciplineModalOpen.betId) {
                                    return { ...bet, discipline: discipline.id, bet_type: '' };
                                  }

                                  return bet;
                                });
                              });

                              try {
                                const filtered = await api.fetchBetTypesByDiscipline(discipline.id);

                                setBetTypes(filtered);
                              } catch (error) {
                                console.error('Error fetching bet types for discipline:', error);
                              }

                              setDisciplineModalOpen({ betId: null });
                              setDisciplineSearchQuery('');
                            }
                          }}
                          className="flex-1 flex items-center justify-between mr-3"
                        >
                          <div className="font-medium text-text-primary">{discipline.name}</div>
                          {isSelected && (
                            <Check size={16} className="text-primary-main ml-2" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleFavoriteDiscipline(discipline.id)}
                          className="p-2 rounded-full hover:bg-background-table-header transition-colors"
                          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill={isFavorite ? '#FBBF24' : 'none'}
                            stroke={isFavorite ? '#FBBF24' : '#9CA3AF'}
                            strokeWidth="1.5"
                            className="w-5 h-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.563.563 0 0 0-.586 0L6.98 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.563.563 0 0 0-.182-.557L3.04 10.385a.563.563 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
                          />
                        </svg>
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-text-secondary py-8 text-sm">No disciplines found</div>
                );
              })()}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDisciplineModalOpen({ betId: null });
                  setDisciplineSearchQuery('');
                }}
                className="flex-1 px-4 py-2 border border-border-light rounded-lg hover:bg-background-table-header transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bet Type Selection Modal */}
      {betTypeModalOpen.betId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background-paper rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-text-primary">Select Bet Type</h2>
              <button
                onClick={() => {
                  setBetTypeModalOpen({ betId: null });
                  setBetTypeSearchQuery('');
                }}
                className="p-2 hover:bg-background-table-header rounded-lg transition-colors"
              >
                <X size={20} className="text-text-secondary" />
              </button>
            </div>

            <div className="mb-4">
              <input
                type="text"
                value={betTypeSearchQuery}
                onChange={(e) => setBetTypeSearchQuery(e.target.value)}
                placeholder="Search bet types..."
                className="w-full px-3 py-2 border border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-main"
              />
            </div>

            <div className="space-y-2 mb-6 max-h-80 overflow-y-auto">
              {(() => {
                const filteredBetTypes = betTypes.filter(bt =>
                  (bt.code?.toLowerCase() || '').includes(betTypeSearchQuery.toLowerCase()) ||
                  (bt.description?.toLowerCase() || '').includes(betTypeSearchQuery.toLowerCase())
                );

                const sortedBetTypes = [...filteredBetTypes].sort((a, b) => {
                  const aFav = a.id !== undefined && favoriteBetTypes.includes(a.id);
                  const bFav = b.id !== undefined && favoriteBetTypes.includes(b.id);
                  if (aFav === bFav) return 0;
                  return aFav ? -1 : 1;
                });

                const currentBet = bets.find(b => b.id === betTypeModalOpen.betId);
                const currentBetType = currentBet?.bet_type;

                return sortedBetTypes.length > 0 ? (
                  sortedBetTypes.map((type) => {
                    const isSelected = currentBetType === type.code;
                    const isFavorite = type.id !== undefined && favoriteBetTypes.includes(type.id);
                    return (
                      <div
                        key={type.id ?? `${type.code}`}
                        className={`w-full flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors text-left text-sm ${
                          isSelected
                            ? 'border-primary-main bg-blue-50'
                            : 'border-border-light hover:border-border-medium hover:bg-gray-50'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (betTypeModalOpen.betId !== null) {
                              setBets(prevBets => prevBets.map((bet) => (
                                bet.id === betTypeModalOpen.betId ? { ...bet, bet_type: type.code } : bet
                              )));
                              setBetTypeModalOpen({ betId: null });
                              setBetTypeSearchQuery('');
                            }
                          }}
                          className="flex-1 flex items-center justify-between mr-3"
                        >
                          <div>
                            <div className="font-medium text-text-primary">{type.code}</div>
                            <div className="text-xs text-text-secondary mt-0.5">{type.description}</div>
                          </div>
                          {isSelected && (
                            <Check size={16} className="text-primary-main" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleFavoriteBetType(type.id)}
                          className="p-2 rounded-full hover:bg-background-table-header transition-colors"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill={isFavorite ? '#FBBF24' : 'none'}
                            stroke={isFavorite ? '#FBBF24' : '#9CA3AF'}
                            strokeWidth="1.5"
                            className="w-5 h-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.563.563 0 0 0-.586 0L6.98 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.563.563 0 0 0-.182-.557L3.04 10.385a.563.563 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
                          />
                        </svg>
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-text-secondary py-8 text-sm">No bet types found</div>
                );
              })()}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setBetTypeModalOpen({ betId: null });
                  setBetTypeSearchQuery('');
                }}
                className="flex-1 px-4 py-2 border border-border-light rounded-lg hover:bg-background-table-header transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BetSlip;
