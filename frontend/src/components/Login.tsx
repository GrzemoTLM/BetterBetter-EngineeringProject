import { Mail, Lock } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import apiService from '../services/api';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';

interface LoginProps {
  onContinue: (challengeId?: string) => void;
  onNavigateToRegister?: () => void;
  onNavigateToReset?: () => void;
}

const Login = ({ onContinue, onNavigateToRegister, onNavigateToReset }: LoginProps) => {
  const { login, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email.trim() || !password.trim()) {
      setLocalError('Please enter both email and password');
      return;
    }

    try {
      const response = await login(email, password);
      
      // If 2FA is required, pass challenge_id to parent
      if (response?.challenge_id) {
        onContinue(response.challenge_id);
      } else {
        // Login successful without 2FA
        onContinue();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login error';
      setLocalError(errorMessage);
    }
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

          console.log('Redirecting...');
          // Reload to trigger auth check
          window.location.reload();
        } catch (err) {
          console.error('Google login error:', err);
          const errorMessage = err instanceof Error ? err.message : 'Google login error';
          setLocalError(errorMessage);
        }
      },
    });

    google.accounts.id.prompt();
  };

  const displayError = localError || error;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background-page p-4">
      {/* Main Card */}
      <div className="w-full max-w-[480px] bg-background-card rounded-2xl shadow-xl p-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-heading mb-2">BetBetter</h1>
        </div>

        {/* Error Display */}
        {displayError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{displayError}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-body mb-2">
              Email address
            </label>
            <div className="relative">
              <Mail
                size={20}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-input-placeholder"
              />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full pl-12 pr-4 py-3 border border-default rounded-lg focus:ring-2 focus:ring-primary-main focus:border-transparent outline-none transition-all bg-background-input text-heading placeholder:text-input-placeholder"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-body mb-2">
              Password
            </label>
            <div className="relative">
              <Lock
                size={20}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-input-placeholder"
              />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-12 pr-4 py-3 border border-default rounded-lg focus:ring-2 focus:ring-primary-main focus:border-transparent outline-none transition-all bg-background-input text-heading placeholder:text-input-placeholder"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-primary-main text-primary-text font-medium rounded-lg hover:bg-primary-hover transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Logging in...' : 'Continue'}
          </button>
        </form>

        {/* Links */}
        <div className="space-y-3 mt-4">
          <div className="text-center">
            <span className="text-body">
              Don't have an account?{' '}
              <button 
                onClick={onNavigateToRegister}
                className="text-link font-medium hover:underline"
              >
                Sign Up
              </button>
            </span>
          </div>
          <div className="text-center">
            <button 
              onClick={onNavigateToReset}
              className="text-link text-sm font-medium hover:underline"
            >
              Forgot password?
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-default"></div>
          <span className="px-4 text-body text-sm">OR</span>
          <div className="flex-1 border-t border-default"></div>
        </div>

        {/* Google Button */}
        <button 
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full py-3 border border-default bg-white text-heading font-medium rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>
      </div>

      {/* Footer - Outside Card */}
      <div className="mt-8 text-center space-y-2">
        <button className="text-primary-main font-bold text-lg hover:underline">
          try app
        </button>
        <div className="text-body text-sm">
          Terms of Use | Privacy Policy
        </div>
      </div>
    </div>
  );
};

export default Login;

