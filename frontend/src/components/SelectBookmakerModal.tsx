import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../services/api';
import type { BookmakerAccountCreateResponse } from '../types/finances';

interface SelectBookmakerModalProps {
  onClose: () => void;
  onSelect: (accountId: number) => void;
}

const SelectBookmakerModal = ({ onClose, onSelect }: SelectBookmakerModalProps) => {
  const [accounts, setAccounts] = useState<BookmakerAccountCreateResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const accs = await api.getBookmakerAccounts();
        setAccounts(accs);
        if (accs.length > 0) setSelected(accs[0].id);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load accounts');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-md w-full max-w-md">
        <div className="flex items-center justify-between px-4 py-3 border-b border-default">
          <h3 className="text-base font-semibold text-text-primary">Select bookmaker account</h3>
          <button className="p-2 rounded hover:bg-gray-100" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {loading && <div className="text-sm text-text-secondary">Loading...</div>}
          {error && <div className="text-sm text-status-error">{error}</div>}

          {!loading && !error && (
            <div className="space-y-2">
              {accounts.length === 0 ? (
                <div className="text-sm text-text-secondary">No bookmaker accounts found.</div>
              ) : (
                <ul className="space-y-2 max-h-64 overflow-y-auto">
                  {accounts.map((acc) => (
                    <li key={acc.id}>
                      <label className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer border border-transparent hover:border-default">
                        <input
                          type="radio"
                          name="bookmaker"
                          className="h-4 w-4"
                          checked={selected === acc.id}
                          onChange={() => setSelected(acc.id)}
                        />
                        <div className="flex flex-col">
                          <span className="text-sm text-text-primary font-medium">{acc.bookmaker}</span>
                          <span className="text-xs text-text-secondary">{acc.external_username}</span>
                        </div>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-default flex justify-end gap-2">
          <button className="px-4 py-2 rounded-md border border-default text-text-primary hover:bg-gray-50" onClick={onClose}>
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-md bg-primary-main text-white hover:bg-primary-hover disabled:opacity-50"
            onClick={() => selected && onSelect(selected)}
            disabled={!selected || loading}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectBookmakerModal;
