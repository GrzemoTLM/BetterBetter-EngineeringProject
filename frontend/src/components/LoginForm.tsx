
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { TwoFactorForm } from './TwoFactorForm';

interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { login, isLoading, error } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [localError, setLocalError] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    try {
      const response = await login(formData.email, formData.password);

      // Check if 2FA is required
      if (response?.challenge_id) {
        setChallengeId(response.challenge_id);
      } else {
        onSuccess?.();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Błąd podczas logowania';
      setLocalError(errorMessage);
    }
  };

  const handle2FASuccess = () => {
    setChallengeId(null);
    onSuccess?.();
  };

  const handle2FACancel = () => {
    setChallengeId(null);
    setFormData({ email: '', password: '' });
  };

  // Show 2FA form if challenge_id is present
  if (challengeId) {
    return (
      <TwoFactorForm
        challengeId={challengeId}
        onSuccess={handle2FASuccess}
        onCancel={handle2FACancel}
      />
    );
  }

  const displayError = localError || error;

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <h2>Logowanie</h2>

        {displayError && (
          <div role="alert" style={{ color: 'red', marginBottom: '10px' }}>
            {displayError}
          </div>
        )}

        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="password">Hasło</label>
          <input
            id="password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Logowanie...' : 'Zaloguj się'}
        </button>
      </form>
    </div>
  );
};

