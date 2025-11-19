import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import type { TransactionType, TransactionCreateRequest, BookmakerUserAccount } from '../types/finances';

interface AddTransactionModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ onClose, onSuccess }) => {
  const [type, setType] = useState<TransactionType | ''>('');
  const [accountId, setAccountId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [accounts, setAccounts] = useState<BookmakerUserAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await apiService.fetchBookmakerAccounts();
        if (mounted) setAccounts(data);
      } catch {
        if (mounted) setError('Failed to fetch bookmaker accounts');
      } finally {
        if (mounted) setLoadingAccounts(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!type || !accountId) {
      setError('Select transaction type and account.');
      return;
    }

    if (!amount || isNaN(Number(amount))) {
      setError('Enter a valid amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: TransactionCreateRequest = { transaction_type: type as TransactionType, amount: Number(amount), bookmaker_account: Number(accountId) };
      const response = await apiService.createTransaction(payload);
      console.log('Transaction created:', response);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create transaction';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0,0,0,0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', width: '320px' }}>
        <h2>Add Transaction</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>Transaction Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as TransactionType)} style={{ width: '100%' }}>
              <option value="">-- Select --</option>
              <option value="DEPOSIT">Deposit</option>
              <option value="WITHDRAWAL">Withdrawal</option>
            </select>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>Bookmaker Account</label>
            {loadingAccounts ? (
              <p>Loading accounts...</p>
            ) : (
              <select value={accountId} onChange={(e) => setAccountId(e.target.value)} style={{ width: '100%' }}>
                <option value="">-- Select --</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={String(acc.id)}>{acc.bookmaker} / {acc.external_username}</option>
                ))}
              </select>
            )}
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>Amount</label>
            <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ width: '100%' }} />
          </div>
          {error && <p style={{ color: 'red', marginBottom: '8px' }}>{error}</p>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button type="button" onClick={onClose} disabled={isSubmitting}>Cancel</button>
            <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
