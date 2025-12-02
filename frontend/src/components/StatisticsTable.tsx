import CouponsTable from './CouponsTable';

interface StatisticsTableProps {
  filters?: Record<string, string>;
}

const StatisticsTable = ({ filters }: StatisticsTableProps) => {
  return (
    <div className="bg-background-paper rounded-xl shadow-sm p-5">
      <h3 className="text-lg font-semibold text-text-primary mb-4">Detailed Coupons Table</h3>
      <CouponsTable
        filters={filters}
        hideEdit={true}
        showOnlySettled={true}
      />
    </div>
  );
};

export default StatisticsTable;

