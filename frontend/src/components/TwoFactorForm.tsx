import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface TwoFactorFormProps {
  challengeId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const TwoFactorForm: React.FC<TwoFactorFormProps> = ({ challengeId, onSuccess, onCancel }) => {
  const { verify2FA, isLoading, error } = useAuth();
  const [code, setCode] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    try {
      await verify2FA(challengeId, code);
      onSuccess();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Błąd weryfikacji kodu 2FA';
      setLocalError(errorMessage);
    }
  };

  const displayError = localError || error;

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <h2>Weryfikacja dwuetapowa</h2>
        <p>Wprowadź kod z aplikacji uwierzytelniającej</p>

        {displayError && (
          <div role="alert" style={{ color: 'red', marginBottom: '10px' }}>
            {displayError}
          </div>
        )}

        <div>
          <label htmlFor="code">Kod 2FA</label>
          <input
            id="code"
            type="text"
            name="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            disabled={isLoading}
            placeholder="000000"
            maxLength={6}
            pattern="[0-9]{6}"
            autoComplete="one-time-code"
            autoFocus
          />
        </div>

        <div>
          <button type="submit" disabled={isLoading || code.length !== 6}>
            {isLoading ? 'Weryfikacja...' : 'Zweryfikuj'}
          </button>
          <button type="button" onClick={onCancel} disabled={isLoading}>
            Anuluj
          </button>
        </div>
      </form>
    </div>
  );
};
