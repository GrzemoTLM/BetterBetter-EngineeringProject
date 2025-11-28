import { Trash2, Settings } from 'lucide-react';

interface ActionBarProps {
  onManageStrategies?: () => void;
  onBulkDelete?: () => void;
  bulkMode?: boolean;
  selectedCount?: number;
}

const ActionBar = ({ onManageStrategies, onBulkDelete, bulkMode = false, selectedCount = 0 }: ActionBarProps) => {
  const deleteLabel = bulkMode ? (selectedCount > 0 ? `Delete selected (${selectedCount})` : 'Select coupons') : 'Delete coupon';
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      {/* Left Side Actions */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Delete coupon */}
        <button
          onClick={onBulkDelete}
          className={`rounded-lg px-6 py-2 flex items-center gap-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 ${bulkMode ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-600 text-white hover:bg-red-700'}`}
        >
          <Trash2 size={18} />
          {deleteLabel}
        </button>
      </div>

      {/* Right Side Action */}
      <div>
        <button
          onClick={onManageStrategies}
          className="bg-white border border-primary-main text-primary-main rounded-lg px-6 py-2 hover:bg-blue-50 transition-colors flex items-center gap-2 font-medium"
        >
          <Settings size={18} />
          Manage strategies
        </button>
      </div>
    </div>
  );
};

export default ActionBar;
