import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { TwoFactorForm } from './TwoFactorForm';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { apiService } from '../services/api';

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

  const handleGoogleLogin = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
      setLocalError('Google Client ID is not configured');
      return;
    }

    if (typeof google === 'undefined') {
      setLocalError('Google Identity Services not loaded');
      return;
    }

    google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response: CredentialResponse) => {
        try {
          setLocalError(null);
          console.log('Google login - received credential from Google');

          const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.GOOGLE_LOGIN}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ token: response.credential }),
          });

          console.log('Backend response status:', res.status);

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({ detail: 'Login failed' }));
            throw new Error(errorData.detail || 'Google login failed');
          }

          const data = await res.json();
          console.log('Backend response data:', data);

          if (data.access) {
            console.log('Saving access token...');
            apiService.setToken(data.access);
            console.log('Token saved. Checking:', apiService.getToken() ? 'Token found ✅' : 'Token NOT found ❌');
          }

          if (data.refresh) {
            console.log('Saving refresh token...');
            apiService.setRefreshToken(data.refresh);
          }

          console.log('Redirecting to dashboard...');
          window.location.href = '/dashboard';
        } catch (err) {
          console.error('Google login error:', err);
          const errorMessage = err instanceof Error ? err.message : 'Google login error';
          setLocalError(errorMessage);
        }
      },
    });

    google.accounts.id.prompt();
  };

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
            {String(displayError)}
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

      <div style={{ marginTop: '12px', textAlign: 'center' }}>
        <button type="button" onClick={handleGoogleLogin} style={{ padding: '8px 12px' }}>
          Zaloguj przez Google
        </button>
      </div>
    </div>
  );
};
