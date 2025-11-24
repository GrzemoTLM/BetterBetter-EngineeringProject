import { Bell } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import DashboardKPICard from './DashboardKPICard';
import ResultsBarChart from './ResultsBarChart';
import CouponsPieChart from './CouponsPieChart';
import RecentCouponsTable from './RecentCouponsTable';

const Dashboard = () => {
  const { user } = useAuth();
  const username = user?.username || 'User';

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-text-primary">
          WELCOME BACK, {username.toUpperCase()}
        </h1>
        <button className="p-2 hover:bg-background-table-header rounded-lg transition-colors">
          <Bell size={24} className="text-text-secondary" />
        </button>
      </div>

      {/* Top Grid - 3 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Monthly Balance Card */}
        <DashboardKPICard
          label="Monthly balance"
          value="+ $128,100"
          valueColor="text-status-success"
        />

        {/* Results for Last Week - Bar Chart */}
        <div className="bg-background-paper rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Results for Last Week
          </h3>
          <ResultsBarChart />
        </div>

        {/* Coupons Progress - Pie Chart */}
        <div className="bg-background-paper rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Coupons Progress
          </h3>
          <CouponsPieChart />
        </div>
      </div>

      {/* Bottom Section - Recent Coupons Table */}
      <div className="bg-background-paper rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Recent coupons
        </h3>
        <RecentCouponsTable />
      </div>
    </div>
  );
};

export default Dashboard;

