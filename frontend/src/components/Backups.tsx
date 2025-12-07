import { useState, useEffect } from 'react';
import { RefreshCw, Plus, Trash2, RotateCcw, X, AlertTriangle } from 'lucide-react';
import api from '../services/api';

interface BackupFile {
  filename: string;
  size_bytes: number;
  size_kb: number;
  created_at: string;
  timestamp: string;
}

const Backups = () => {
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBackup, setSelectedBackup] = useState<BackupFile | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchBackups = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getBackups();
      console.log('Backups data:', data);
      if (Array.isArray(data)) {
        setBackups(data);
      } else if (data && Array.isArray(data.backups)) {
        setBackups(data.backups);
      } else {
        setBackups([]);
      }
    } catch (err) {
      console.error('Failed to fetch backups:', err);
      setError('Failed to load backups');
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    try {
      setCreating(true);
      setError(null);
      const result = await api.createBackup();
      console.log('Backup created:', result);
      await fetchBackups();
    } catch (err) {
      console.error('Failed to create backup:', err);
      setError('Failed to create backup');
    } finally {
      setCreating(false);
    }
  };

  const restoreBackup = async () => {
    if (!selectedBackup) return;

    try {
      setRestoring(true);
      setError(null);
      await api.restoreBackup(selectedBackup.filename);
      console.log('Backup restored:', selectedBackup.filename);
      setShowRestoreConfirm(false);
      setSelectedBackup(null);
      alert('Backup restored successfully!');
    } catch (err) {
      console.error('Failed to restore backup:', err);
      setError('Failed to restore backup');
    } finally {
      setRestoring(false);
    }
  };

  const deleteBackup = async () => {
    if (!selectedBackup) return;

    try {
      setDeleting(true);
      setError(null);
      await api.deleteBackup(selectedBackup.filename);
      console.log('Backup deleted:', selectedBackup.filename);
      setSelectedBackup(null);
      await fetchBackups();
    } catch (err) {
      console.error('Failed to delete backup:', err);
      setError('Failed to delete backup');
    } finally {
      setDeleting(false);
    }
  };

  const closeModal = () => {
    setSelectedBackup(null);
    setShowRestoreConfirm(false);
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const formatSize = (sizeKb: number): string => {
    if (sizeKb >= 1024) {
      return `${(sizeKb / 1024).toFixed(2)} MB`;
    }

    return `${sizeKb.toFixed(2)} KB`;
  };

  const formatDate = (timestamp: string): string => {
    if (!timestamp) return 'N/A';
    const year = timestamp.slice(0, 4);
    const month = timestamp.slice(4, 6);
    const day = timestamp.slice(6, 8);
    const hour = timestamp.slice(9, 11);
    const min = timestamp.slice(11, 13);

    return `${year}-${month}-${day} ${hour}:${min}`;
  };

  return (
    <div className="bg-background-paper rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Backups</h3>
          <p className="text-xs text-text-secondary">Database backups</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchBackups}
            disabled={loading}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={createBackup}
            disabled={creating}
            className="flex items-center gap-1 px-3 py-1.5 bg-primary-main text-white text-xs font-medium rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            <Plus size={14} />
            {creating ? 'Creating...' : 'Create Backup'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-background-table-header border-b border-default">
              <th className="px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">
                Filename
              </th>
              <th className="px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">
                Size
              </th>
              <th className="px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-default">
            {loading ? (
              <tr>
                <td colSpan={3} className="px-2 py-4 text-center text-xs text-text-secondary">
                  Loading backups...
                </td>
              </tr>
            ) : backups.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-2 py-4 text-center text-xs text-text-secondary">
                  No backups found. Create your first backup!
                </td>
              </tr>
            ) : (
              backups.map((backup, index) => (
                <tr
                  key={index}
                  onClick={() => setSelectedBackup(backup)}
                  className="hover:bg-gray-100 transition-colors bg-background-paper cursor-pointer"
                >
                  <td className="px-2 py-1.5 text-xs text-text-primary font-mono">
                    {backup.filename}
                  </td>
                  <td className="px-2 py-1.5 text-xs text-text-primary">
                    {formatSize(backup.size_kb)}
                  </td>
                  <td className="px-2 py-1.5 text-xs text-text-secondary">
                    {formatDate(backup.timestamp)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Backup Actions Modal */}
      {selectedBackup && !showRestoreConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">Backup Actions</h3>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-text-secondary" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-text-secondary mb-1">Selected backup:</p>
              <p className="text-sm font-mono text-text-primary">{selectedBackup.filename}</p>
              <p className="text-xs text-text-secondary mt-1">
                Size: {formatSize(selectedBackup.size_kb)} | Created: {formatDate(selectedBackup.timestamp)}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => setShowRestoreConfirm(true)}
                disabled={restoring}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <RotateCcw size={18} />
                Restore Backup
              </button>

              <button
                onClick={deleteBackup}
                disabled={deleting}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <Trash2 size={18} />
                {deleting ? 'Deleting...' : 'Delete Backup'}
              </button>

              <button
                onClick={closeModal}
                className="w-full px-4 py-2 text-text-secondary font-medium rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {showRestoreConfirm && selectedBackup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertTriangle size={24} className="text-yellow-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">Confirm Restore</h3>
                <p className="text-sm text-text-secondary">This action cannot be undone</p>
              </div>
            </div>

            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Warning:</strong> Restoring this backup will replace all current data in the database.
                Make sure you have a recent backup of the current state before proceeding.
              </p>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-text-secondary mb-1">Backup to restore:</p>
              <p className="text-sm font-mono text-text-primary">{selectedBackup.filename}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRestoreConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-text-primary font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={restoreBackup}
                disabled={restoring}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white font-medium rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
              >
                {restoring ? 'Restoring...' : 'Yes, Restore'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Backups;
