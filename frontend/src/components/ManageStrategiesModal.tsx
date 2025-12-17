import { X, Plus, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../services/api';
import type { Strategy } from '../types/strategies';

interface ManageStrategiesModalProps {
  onClose: () => void;
  onStrategiesChange?: (strategies: Strategy[]) => void;
}

const ManageStrategiesModal = ({
  onClose,
  onStrategiesChange,
}: ManageStrategiesModalProps) => {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [newStrategyName, setNewStrategyName] = useState('');
  const [newStrategyDescription, setNewStrategyDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchStrategies();
  }, []);

  const fetchStrategies = async () => {
    try {
      setLoading(true);
      const data = await api.getStrategies();
      setStrategies(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleAddStrategy = async () => {
    if (!newStrategyName.trim()) {
      return;
    }

    try {
      setLoadingCreate(true);
      const newStrategy = await api.createStrategy({
        name: newStrategyName.trim(),
        description: newStrategyDescription.trim() || undefined,
      });

      const updatedStrategies = [...strategies, newStrategy];
      setStrategies(updatedStrategies);
      if (onStrategiesChange) {
        onStrategiesChange(updatedStrategies);
      }

      setNewStrategyName('');
      setNewStrategyDescription('');
    } catch {
    } finally {
      setLoadingCreate(false);
    }
  };

  const handleDeleteStrategy = async (id: number) => {
    try {
      setDeletingId(id);
      await api.deleteStrategy(id);

      const updatedStrategies = strategies.filter((s) => s.id !== id);
      setStrategies(updatedStrategies);
      if (onStrategiesChange) {
        onStrategiesChange(updatedStrategies);
      }
    } catch {
    } finally {
      setDeletingId(null);
    }
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
            <div className="space-y-2 mb-3">
              <input
                id="newStrategy"
                type="text"
                value={newStrategyName}
                onChange={(e) => setNewStrategyName(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Strategy name"
                className="w-full px-3 py-2 border border-border-default rounded-md text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-main focus:border-transparent"
              />
              <textarea
                value={newStrategyDescription}
                onChange={(e) => setNewStrategyDescription(e.target.value)}
                placeholder="Description (optional)"
                className="w-full px-3 py-2 border border-border-default rounded-md text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-main focus:border-transparent resize-none"
                rows={2}
              />
            </div>
            <button
              onClick={handleAddStrategy}
              disabled={loadingCreate || !newStrategyName.trim()}
              className="w-full px-4 py-2 rounded-md text-sm font-medium bg-primary-main text-primary-contrast hover:bg-primary-main/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={16} />
              {loadingCreate ? 'Adding...' : 'Add Strategy'}
            </button>
          </div>

          {/* Strategies List */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-3">
              Existing Strategies ({strategies.length})
            </h3>
            {loading ? (
              <div className="text-center py-8 text-text-secondary">
                <p className="text-sm">Loading strategies...</p>
              </div>
            ) : strategies.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">
                <p className="text-sm">No strategies yet</p>
                <p className="text-xs mt-1">Add your first strategy above</p>
              </div>
            ) : (
              <div className="space-y-2">
                {strategies.map((strategy) => (
                  <div
                    key={strategy.id}
                    className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary">
                        {strategy.name}
                      </p>
                      {strategy.description && (
                        <p className="text-xs text-text-secondary mt-1">
                          {strategy.description}
                        </p>
                      )}
                      <p className="text-xs text-text-tertiary mt-1">
                        Created: {new Date(strategy.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteStrategy(strategy.id)}
                      disabled={deletingId === strategy.id}
                      className="ml-2 p-2 hover:bg-red-50 rounded transition-colors group disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
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
            className="px-4 py-2 rounded-md text-sm font-medium bg-primary-main text-primary-contrast hover:bg-primary-main/90 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageStrategiesModal;

