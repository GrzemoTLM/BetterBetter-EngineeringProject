import { Trash2, Settings } from 'lucide-react';

interface ActionBarProps {
  onManageStrategies?: () => void;
}

const ActionBar = ({ onManageStrategies }: ActionBarProps) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      {/* Left Side Actions */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Delete coupon */}
        <button className="bg-white border border-gray-300 text-text-primary rounded-lg px-6 py-2 hover:bg-gray-50 hover:text-status-error transition-colors flex items-center gap-2 font-medium">
          <Trash2 size={18} />
          Delete coupon
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

