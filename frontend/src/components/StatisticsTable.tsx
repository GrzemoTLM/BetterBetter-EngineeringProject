import CouponsTable from './CouponsTable';
import type { Coupon } from '../types/coupons';

interface StatisticsTableProps {
  filters?: Record<string, string>;
  customFilteredCoupons?: Coupon[] | null;
}

const StatisticsTable = ({ filters, customFilteredCoupons }: StatisticsTableProps) => {
  return (
    <div className="bg-background-paper rounded-xl shadow-sm p-5">
      <h3 className="text-lg font-semibold text-text-primary mb-4">
        Detailed Coupons Table
        {customFilteredCoupons && (
          <span className="text-sm font-normal text-primary-main ml-2">
            (Custom filter: {customFilteredCoupons.length} coupons)
          </span>
        )}
      </h3>
      <CouponsTable
        filters={filters}
        hideEdit={true}
        showOnlySettled={true}
        customFilteredCoupons={customFilteredCoupons}
      />
    </div>
  );
};

export default StatisticsTable;

