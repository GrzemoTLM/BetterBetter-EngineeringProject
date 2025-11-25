import { X } from 'lucide-react';
import UploadCoupon from './UploadCoupon';
import BetSlip from './BetSlip';

interface AddCouponProps {
  onClose: () => void;
  strategies?: string[];
}

const AddCoupon = ({ onClose, strategies = [] }: AddCouponProps) => {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background-page w-full max-w-[1400px] h-[90vh] rounded-xl shadow-2xl flex flex-col mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-default">
          <h2 className="text-2xl font-bold text-text-primary">
            Add Coupon
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-background-table-header rounded-lg transition-colors"
          >
            <X size={24} className="text-text-secondary" />
          </button>
        </div>

        {/* Main Content - Centered Single Column */}
        <div className="flex-1 flex justify-center p-6 overflow-y-auto">
          <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
            {/* Upload Coupon Section */}
            <UploadCoupon />

            {/* Bet Slip Section */}
            <BetSlip strategies={strategies} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddCoupon;

