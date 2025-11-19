import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import type { AvailableBookmaker, BookmakerAccountCreateRequest } from '../types/finances';

interface AddBookmakerAccountModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddBookmakerAccountModal: React.FC<AddBookmakerAccountModalProps> = ({ onClose, onSuccess }) => {
  const [bookmakers, setBookmakers] = useState<AvailableBookmaker[]>([]);
  const [loadingBookmakers, setLoadingBookmakers] = useState(true);
  const [bookmakerName, setBookmakerName] = useState<string>('');
  const [externalUsername, setExternalUsername] = useState('');
  const [currency, setCurrency] = useState('PLN');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const data = await apiService.fetchBookmakers();
        if (isMounted) setBookmakers(data);
      } catch {
        if (isMounted) setError('Failed to fetch bookmakers list');
      } finally {
        if (isMounted) setLoadingBookmakers(false);
      }
    };

    load();

    return () => { isMounted = false; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!bookmakerName) {
      setError('Select a bookmaker.');
      return;
    }

    if (!externalUsername.trim()) {
      setError('Enter account name (external_username).');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: BookmakerAccountCreateRequest = { bookmaker: bookmakerName, external_username: externalUsername.trim(), currency };
      const response = await apiService.createBookmakerAccount(payload);
      console.log('Bookmaker account created:', response);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create bookmaker account';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', width: '360px' }}>
        <h2>Add Bookmaker Account</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>Bookmaker</label>
            {loadingBookmakers ? (
              <p>Loading...</p>
            ) : (
              <select value={bookmakerName} onChange={(e) => setBookmakerName(e.target.value)} style={{ width: '100%' }}>
                <option value="">-- Select --</option>
                {bookmakers.map(b => (
                  <option key={b.id} value={b.name}>{b.name}</option>
                ))}
              </select>
            )}
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>external_username</label>
            <input type="text" value={externalUsername} onChange={(e) => setExternalUsername(e.target.value)} placeholder="e.g. main_user" style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>Currency</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ width: '100%' }}>
              <option value="PLN">PLN</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          </div>
          {error && <p style={{ color: 'red', marginBottom: '8px' }}>{error}</p>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" onClick={onClose} disabled={isSubmitting}>Cancel</button>
            <button type="submit" disabled={isSubmitting || loadingBookmakers}>{isSubmitting ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
