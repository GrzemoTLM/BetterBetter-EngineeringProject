import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface NicknameModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentNickname: string | undefined;
  onSave: (nickname: string) => Promise<void>;
}

const NicknameModal: React.FC<NicknameModalProps> = ({
  isOpen,
  onClose,
  currentNickname,
  onSave,
}) => {
  const [nickname, setNickname] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNickname(currentNickname || '');
      setError(null);
    }
  }, [isOpen, currentNickname]);

  const handleSave = async () => {
    if (!nickname.trim()) {
      setError('Nickname cannot be empty');
      return;
    }

    if (nickname.length > 50) {
      setError('Nickname must be 50 characters or less');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSave(nickname.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save nickname');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSaving && nickname.trim()) {
      handleSave();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background-paper rounded-xl shadow-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-text-primary">Change Nickname</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-background-table-header rounded-lg transition-colors"
            disabled={isSaving}
          >
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-text-primary mb-2">
            Enter your nickname
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g., John"
            maxLength={50}
            className="w-full px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:border-primary-main focus:ring-1 focus:ring-primary-main"
            disabled={isSaving}
            autoFocus
          />
          <p className="text-xs text-text-secondary mt-2">
            {nickname.length}/50 characters
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 px-4 py-2 border border-border-light rounded-lg hover:bg-background-table-header transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !nickname.trim()}
            className="flex-1 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NicknameModal;

