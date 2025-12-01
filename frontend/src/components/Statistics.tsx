import { Bell, Calendar, Filter, BellPlus } from 'lucide-react';
import { useState, useEffect } from 'react';
import StatisticsKPIs from './StatisticsKPIs';
import StatisticsCharts from './StatisticsCharts';
import StatisticsTable from './StatisticsTable';
import StatisticsReports from './StatisticsReports';
import CreateNotificationModal from './CreateNotificationModal';
import CustomFilterBuilder from './CustomFilterBuilder';
import TopPerformers from './TopPerformers';
import ActiveNotifications from './ActiveNotifications';
import PerformanceInsights from './PerformanceInsights';
import api from '../services/api';

const Statistics = () => {
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState('2024-12-31');
  const [bookmaker, setBookmaker] = useState('All');
  const [status, setStatus] = useState('All');
  const [betType, setBetType] = useState('All');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showCustomFilter, setShowCustomFilter] = useState(false);
  const [couponSummary, setCouponSummary] = useState<import('../services/api').CouponSummary | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const summary = await api.getCouponSummary();
        console.log('[Statistics] Coupon summary from /api/analytics/coupons/summary/:', summary);
        setCouponSummary(summary);
      } catch (error) {
        console.error('[Statistics] Failed to fetch coupon summary:', error);
      }
    };

    fetchSummary();
  }, []);

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
        <div className="flex flex-wrap items-end gap-3">
          {/* Date Range */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-text-secondary">Data range</label>
            <div className="flex items-center gap-2 border border-gray-300 rounded-md px-3 py-2">
              <Calendar size={16} className="text-text-secondary" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-sm text-text-primary focus:outline-none"
              />
              <span className="text-text-secondary">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-sm text-text-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Bookmaker */}
          <div>
            <label className="block text-sm text-text-secondary mb-1">
              Bookmaker
            </label>
            <select
              value={bookmaker}
              onChange={(e) => setBookmaker(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary-main"
            >
              <option>All</option>
              <option>Bet365</option>
              <option>William Hill</option>
              <option>Betfair</option>
              <option>Pinnacle</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm text-text-secondary mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary-main"
            >
              <option>All</option>
              <option>Won</option>
              <option>Lost</option>
            </select>
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm text-text-secondary mb-1">
              Type
            </label>
            <select
              value={betType}
              onChange={(e) => setBetType(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary-main"
            >
              <option>All</option>
              <option>Single</option>
              <option>Combo</option>
              <option>System</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <button className="bg-primary-main text-primary-contrast rounded-md px-4 py-2 text-sm hover:bg-primary-hover transition-colors flex items-center gap-2">
              <Filter size={16} />
              Apply Filters
            </button>
            <button
              onClick={() => setShowCustomFilter(true)}
              className="border border-gray-300 text-text-primary rounded-md px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
            >
              Create uncommon filter
            </button>
          </div>
        </div>
      </div>

      {/* Section B: KPIs */}
      <StatisticsKPIs summary={couponSummary} />

      {/* Section C: Charts Area */}
      <StatisticsCharts />

      {/* Section D: Detailed Data & Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column - Table (2/3) */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          <StatisticsTable />
          {/* Top Performers and Active Notifications side by side under table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ActiveNotifications />
            <TopPerformers />
          </div>
        </div>

        {/* Right Column - Reports (1/3) */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          <StatisticsReports />
          <PerformanceInsights />
        </div>
      </div>

      {/* Custom Filter Builder Modal */}
      {showCustomFilter && (
        <CustomFilterBuilder onClose={() => setShowCustomFilter(false)} />
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
