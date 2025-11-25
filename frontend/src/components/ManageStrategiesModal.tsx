import { X, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface ManageStrategiesModalProps {
  onClose: () => void;
  strategies: string[];
  onStrategiesChange: (strategies: string[]) => void;
}

const ManageStrategiesModal = ({
  onClose,
  strategies,
  onStrategiesChange,
}: ManageStrategiesModalProps) => {
  const [newStrategy, setNewStrategy] = useState('');

  const handleAddStrategy = () => {
    if (newStrategy.trim() && !strategies.includes(newStrategy.trim())) {
      onStrategiesChange([...strategies, newStrategy.trim()]);
      setNewStrategy('');
    }
  };

  const handleDeleteStrategy = (strategyToDelete: string) => {
    onStrategiesChange(strategies.filter((s) => s !== strategyToDelete));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddStrategy();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background-paper rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-default">
          <h2 className="text-xl font-bold text-text-primary">
            Manage Strategies
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-background-table-header rounded-lg transition-colors"
          >
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Add New Strategy */}
          <div className="mb-6">
            <label
              htmlFor="newStrategy"
              className="block text-sm font-medium text-text-secondary mb-2"
            >
              Add New Strategy
            </label>
            <div className="flex gap-2">
              <input
                id="newStrategy"
                type="text"
                value={newStrategy}
                onChange={(e) => setNewStrategy(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter strategy name"
                className="flex-1 px-3 py-2 border border-border-default rounded-md text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-main focus:border-transparent"
              />
              <button
                onClick={handleAddStrategy}
                className="px-4 py-2 rounded-md text-sm font-medium bg-primary-main text-primary-contrast hover:bg-primary-hover transition-colors flex items-center gap-2"
              >
                <Plus size={16} />
                Add
              </button>
            </div>
          </div>

          {/* Strategies List */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3">
              Existing Strategies ({strategies.length})
            </h3>
            {strategies.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">
                <p className="text-sm">No strategies yet</p>
                <p className="text-xs mt-1">Add your first strategy above</p>
              </div>
            ) : (
              <div className="space-y-2">
                {strategies.map((strategy, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-sm font-medium text-text-primary">
                      {strategy}
                    </span>
                    <button
                      onClick={() => handleDeleteStrategy(strategy)}
                      className="p-2 hover:bg-red-50 rounded transition-colors group"
                      title="Delete strategy"
                    >
                      <Trash2
                        size={16}
                        className="text-status-error opacity-70 group-hover:opacity-100"
                      />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border-default flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm font-medium bg-primary-main text-primary-contrast hover:bg-primary-hover transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageStrategiesModal;

