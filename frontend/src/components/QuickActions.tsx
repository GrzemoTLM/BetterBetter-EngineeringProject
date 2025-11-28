import { Plus, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { useState } from 'react';
import DepositModal from './DepositModal';
import WithdrawModal from './WithdrawModal';
import AddBookmakerModal from './AddBookmakerModal';

interface QuickActionsProps {
  onTransactionSuccess?: () => void;
}

const QuickActions = ({ onTransactionSuccess }: QuickActionsProps) => {
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showAddBookmakerModal, setShowAddBookmakerModal] = useState(false);

  const handleSuccess = () => {
    if (onTransactionSuccess) {
      onTransactionSuccess();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-background-paper rounded-md p-6 shadow-card">
        <h3 className="text-xl font-medium text-text-primary mb-4">
          Quick Actions
        </h3>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setShowAddBookmakerModal(true)}
            className="px-5 py-2.5 rounded-md font-medium text-base cursor-pointer border border-primary-main text-primary-main hover:bg-[rgba(42,75,141,0.05)] transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Add bookmaker
          </button>

          <button
            onClick={() => setShowDepositModal(true)}
            className="px-5 py-2.5 rounded-md font-medium text-base cursor-pointer border-none bg-secondary-main text-secondary-contrast shadow-button hover:bg-secondary-dark transition-all duration-200 flex items-center justify-center gap-2"
          >
            <ArrowDownLeft size={18} />
            Deposit
          </button>

          <button
            onClick={() => setShowWithdrawModal(true)}
            className="px-5 py-2.5 rounded-md font-medium text-base cursor-pointer border-none bg-secondary-main text-secondary-contrast shadow-button hover:bg-secondary-dark transition-all duration-200 flex items-center justify-center gap-2"
          >
            <ArrowUpRight size={18} />
            Withdraw
          </button>
        </div>
      </div>
      {showDepositModal && (
        <DepositModal
          onClose={() => setShowDepositModal(false)}
          onSuccess={handleSuccess}
        />
      )}
      {showWithdrawModal && (
        <WithdrawModal
          onClose={() => setShowWithdrawModal(false)}
          onSuccess={handleSuccess}
        />
      )}
      {showAddBookmakerModal && (
        <AddBookmakerModal
          onClose={() => setShowAddBookmakerModal(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

export default QuickActions;

