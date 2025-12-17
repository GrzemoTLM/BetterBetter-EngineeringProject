import { Bell, Calendar, Filter, BellPlus, X } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import StatisticsKPIs from './StatisticsKPIs';
import StatisticsCharts from './StatisticsCharts';
import StatisticsTable from './StatisticsTable';
import StatisticsReports from './StatisticsReports';
import CreateNotificationModal from './CreateNotificationModal';
import CustomFilterBuilder from './CustomFilterBuilder';
import TopPerformers from './TopPerformers';
import ActiveNotifications from './ActiveNotifications';
import PerformanceInsights from './PerformanceInsights';
import PeriodicReports from './PeriodicReports';
import api from '../services/api';
import type { UserSettings } from '../types/settings';
import type { Coupon } from '../types/coupons';
import type { FilterResult } from '../services/api';

const Statistics = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bookmakerAccountId, setBookmakerAccountId] = useState<'All' | number>('All');
  const [betType, setBetType] = useState<'All' | 'SOLO' | 'AKO'>('All');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showCustomFilter, setShowCustomFilter] = useState(false);
  const [couponSummary, setCouponSummary] = useState<import('../services/api').CouponSummary | null>(null);
  const [bookmakerAccounts, setBookmakerAccounts] = useState<import('../types/finances').BookmakerAccountCreateResponse[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);

  const [customFilterResults, setCustomFilterResults] = useState<FilterResult | null>(null);
  const [filteredCoupons, setFilteredCoupons] = useState<Coupon[] | null>(null);
  const [customFilterActive, setCustomFilterActive] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accounts, settings] = await Promise.all([
          api.getBookmakerAccounts(),
          api.getSettings(),
        ]);
        setBookmakerAccounts(accounts);
        setUserSettings(settings);
      } catch (error) {
        console.error('[Statistics] Failed to fetch data:', error);
      }
    };

    fetchData();
  }, []);

  const loadSummary = useCallback(async () => {
    try {
      setSummaryLoading(true);
      setSummaryError(null);

      const params: Record<string, string> = {};
      if (startDate) params.date_from = startDate;
      if (endDate) params.date_to = endDate;
      if (bookmakerAccountId !== 'All') {
        params.bookmaker_account = String(bookmakerAccountId);
      }


      if (betType !== 'All') {
        params.coupon_type = betType;
      }

      const summary = await api.getCouponSummary(params);
      console.log('[Statistics] Coupon summary with filters:', params, summary);
      setCouponSummary(summary);
    } catch (error) {
      console.error('[Statistics] Failed to fetch coupon summary:', error);
      setCouponSummary(null);
      const msg = error instanceof Error ? error.message : 'Failed to load summary';
      setSummaryError(msg);
    } finally {
      setSummaryLoading(false);
    }
  }, [startDate, endDate, bookmakerAccountId, betType]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const handleApplyFilters = () => {
    setCustomFilterResults(null);
    setFilteredCoupons(null);
    setCustomFilterActive(false);
    loadSummary();
  };

  const handleCustomFilterApply = (coupons: Coupon[], filterResult: FilterResult) => {
    console.log('[Statistics] Custom filter applied:', { coupons: coupons.length, filterResult });
    setFilteredCoupons(coupons);
    setCustomFilterResults(filterResult);
    setCustomFilterActive(true);
  };

  const clearCustomFilter = () => {
    setCustomFilterResults(null);
    setFilteredCoupons(null);
    setCustomFilterActive(false);
    loadSummary();
  };


  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-text-primary">Statistics</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNotificationModal(true)}
            className="bg-primary-main text-primary-contrast rounded-lg px-4 py-2 hover:bg-primary-hover transition-colors flex items-center gap-2 font-medium text-sm"
          >
            <BellPlus size={18} />
            Create Notification
          </button>
          <button className="p-2 hover:bg-background-table-header rounded-lg transition-colors">
            <Bell size={24} className="text-text-secondary" />
          </button>
        </div>
      </div>

      {/* Section A: Data Filters */}
      <div className="bg-background-paper rounded-xl shadow-sm p-4">
        <div className="flex items-end gap-3 overflow-x-auto">
          {/* Date Range */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <label className="text-sm text-text-secondary whitespace-nowrap">Date range</label>
            <div className="flex items-center gap-2 border border-gray-300 rounded-md px-3 py-2">
              <Calendar size={16} className="text-text-secondary" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-sm text-text-primary focus:outline-none w-32"
              />
              <span className="text-text-secondary">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-sm text-text-primary focus:outline-none w-32"
              />
            </div>
          </div>

          {/* Bookmaker Account */}
          <div className="flex-shrink-0">
            <label className="block text-sm text-text-secondary mb-1 whitespace-nowrap">
              Bookmaker
            </label>
            <select
              value={bookmakerAccountId === 'All' ? 'All' : String(bookmakerAccountId)}
              onChange={(e) => {
                const value = e.target.value;
                setBookmakerAccountId(value === 'All' ? 'All' : Number(value));
              }}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary-main min-w-[150px]"
            >
              <option value="All">All</option>
              {bookmakerAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.bookmaker} ({acc.external_username})
                </option>
              ))}
            </select>
          </div>

          {/* Coupon Type (SOLO / AKO) */}
          <div className="flex-shrink-0">
            <label className="block text-sm text-text-secondary mb-1 whitespace-nowrap">
              Type
            </label>
            <select
              value={betType}
              onChange={(e) => setBetType(e.target.value as 'All' | 'SOLO' | 'AKO')}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary-main min-w-[100px]"
            >
              <option value="All">All</option>
              <option value="SOLO">SOLO</option>
              <option value="AKO">AKO</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 ml-auto flex-shrink-0">
            <button
              onClick={handleApplyFilters}
              className="bg-primary-main text-primary-contrast rounded-md px-4 py-2 text-sm hover:bg-primary-hover transition-colors flex items-center gap-2"
              disabled={summaryLoading}
            >
              <Filter size={16} />
              {summaryLoading ? 'Applying…' : 'Apply Filters'}
            </button>
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setBookmakerAccountId('All');
                setBetType('All');
                clearCustomFilter();
              }}
              className="border border-gray-300 text-text-primary rounded-md px-4 py-2 text-sm hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              Clear All Filters
            </button>
            <button
              onClick={() => setShowCustomFilter(true)}
              className={`border rounded-md px-4 py-2 text-sm transition-colors whitespace-nowrap ${
                customFilterActive 
                  ? 'border-primary-main bg-primary-main/10 text-primary-main' 
                  : 'border-gray-300 text-text-primary hover:bg-gray-50'
              }`}
            >
              Custom Filter
            </button>
          </div>
        </div>
      </div>

      {/* Custom Filter Active Indicator */}
      {customFilterActive && customFilterResults && (
        <div className="bg-primary-main/10 border border-primary-main rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Filter size={18} className="text-primary-main" />
            <span className="text-primary-main font-medium">
              Custom Filter Active: {customFilterResults.count} coupons found
            </span>
          </div>
          <button
            onClick={clearCustomFilter}
            className="flex items-center gap-1 px-3 py-1 bg-white rounded border border-primary-main text-primary-main text-sm hover:bg-gray-50"
          >
            <X size={14} />
            Clear
          </button>
        </div>
      )}

      {/* Section B: KPIs */}
      {summaryError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm">{summaryError}</div>
      )}
      {customFilterActive && customFilterResults ? (
        <StatisticsKPIs
          summary={{
            count: customFilterResults.count,
            won_count: customFilterResults.won_count || 0,
            lost_count: customFilterResults.lost_count || 0,
            in_progress_count: 0,
            canceled_count: 0,
            win_rate: customFilterResults.win_rate || 0,
            total_stake: customFilterResults.total_stake || '0',
            total_won: customFilterResults.total_won || '0',
            profit: customFilterResults.profit || '0',
            roi: customFilterResults.roi || 0,
            avg_coupon_odds: undefined,
          }}
        />
      ) : (
        <StatisticsKPIs summary={couponSummary} />
      )}


      {/* Section C: Charts Area */}
      <StatisticsCharts
        customFilterActive={customFilterActive}
        customFilterResults={customFilterResults}
        filteredCoupons={filteredCoupons}
      />


      {/* Section D: Detailed Data & Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column - Table (2/3) */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          <StatisticsTable
            filters={(() => {
              const params: Record<string, string> = {};
              if (startDate) params.date_from = startDate;
              if (endDate) params.date_to = endDate;
              if (bookmakerAccountId !== 'All') {
                params.bookmaker_account = String(bookmakerAccountId);
              }

              if (betType !== 'All') {
                params.coupon_type = betType;
              }

              return params;
            })()}
            customFilteredCoupons={customFilterActive ? filteredCoupons : null}
          />
          {/* Top Performers and Active Notifications side by side under table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ActiveNotifications />
            <TopPerformers />
          </div>
        </div>

        {/* Right Column - Reports (1/3) */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          <PeriodicReports userSettings={userSettings} />
          <StatisticsReports />
          <PerformanceInsights />
        </div>
      </div>

      {/* Custom Filter Builder Modal */}
      {showCustomFilter && (
        <CustomFilterBuilder
          onClose={() => setShowCustomFilter(false)}
          onApplyFilter={handleCustomFilterApply}
        />
      )}

      {/* Create Notification Modal */}
      {showNotificationModal && (
        <CreateNotificationModal
          onClose={() => setShowNotificationModal(false)}
        />
      )}
    </div>
  );
};

export default Statistics;
