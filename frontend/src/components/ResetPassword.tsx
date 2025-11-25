import { Mail, ArrowLeft, Lock, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { apiService } from '../services/api';

interface ResetPasswordProps {
  onBackToLogin: () => void;
  onResetSent: () => void;
}

const ResetPassword = ({ onBackToLogin, onResetSent }: ResetPasswordProps) => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      await apiService.requestPasswordReset({ email });
      setStep('code');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send reset code';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (code.trim().length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);
    try {
      await apiService.confirmPasswordReset({ email, code, new_password: '' });
      setStep('password');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid verification code';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await apiService.confirmPasswordReset({ email, code, new_password: newPassword });
      onResetSent();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset password';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await apiService.resendPasswordReset({ email });
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend code';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1: Enter Email
  if (step === 'email') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background-page p-4">
        <div className="w-full max-w-[480px] bg-background-card rounded-2xl shadow-xl p-10">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-heading mb-2">BetBetter</h1>
            <h2 className="text-xl font-semibold text-heading mb-2 mt-4">
              Reset Password
            </h2>
            <p className="text-body text-sm">
              Enter your email address and we'll send you a verification code.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleEmailSubmit} className="space-y-4">
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-primary-main text-primary-text font-medium rounded-lg hover:bg-primary-hover transition-colors shadow-md mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Sending...' : 'Send Code'}
            </button>
          </form>

          <div className="text-center mt-6">
            <button
              onClick={onBackToLogin}
              className="text-link font-medium hover:underline flex items-center justify-center gap-2"
            >
              <ArrowLeft size={16} />
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Enter Code
  if (step === 'code') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background-page p-4">
        <div className="w-full max-w-[480px] bg-background-card rounded-2xl shadow-xl p-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-main/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck size={32} className="text-primary-main" />
            </div>
            <h2 className="text-2xl font-semibold text-heading mb-2">
              Enter Verification Code
            </h2>
            <p className="text-body text-sm mb-2">
              We've sent a 6-digit code to <strong>{email}</strong>
            </p>
            <p className="text-body text-xs text-text-secondary">
              Please check your email and enter the code below
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleCodeSubmit} className="space-y-6">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-body mb-2">
                Verification Code
              </label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-3 border border-default rounded-lg focus:ring-2 focus:ring-primary-main focus:border-transparent outline-none transition-all bg-background-input text-heading text-center text-2xl tracking-widest placeholder:text-input-placeholder"
                required
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-primary-main text-primary-text font-medium rounded-lg hover:bg-primary-hover transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>

          <div className="text-center mt-6 space-y-2">
            <button
              onClick={() => {
                setStep('email');
                setCode('');
                setError(null);
              }}
              className="text-link text-sm font-medium hover:underline"
              disabled={isLoading}
            >
              Change email address
            </button>
            <button
              onClick={handleResendCode}
              className="text-link text-sm font-medium hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              Resend code
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Set New Password
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background-page p-4">
      <div className="w-full max-w-[480px] bg-background-card rounded-2xl shadow-xl p-10">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-heading mb-2">
            Set New Password
          </h2>
          <p className="text-body text-sm">
            Create a new password for your account
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-body mb-2">
              New Password
            </label>
            <div className="relative">
              <Lock
                size={20}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-input-placeholder"
              />
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full pl-12 pr-4 py-3 border border-default rounded-lg focus:ring-2 focus:ring-primary-main focus:border-transparent outline-none transition-all bg-background-input text-heading placeholder:text-input-placeholder"
                required
                minLength={8}
                disabled={isLoading}
              />
            </div>
            <p className="text-xs text-body mt-1">Must be at least 8 characters</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-body mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock
                size={20}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-input-placeholder"
              />
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full pl-12 pr-4 py-3 border border-default rounded-lg focus:ring-2 focus:ring-primary-main focus:border-transparent outline-none transition-all bg-background-input text-heading placeholder:text-input-placeholder"
                required
                disabled={isLoading}
              />
            </div>
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-status-error mt-1">Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-primary-main text-primary-text font-medium rounded-lg hover:bg-primary-hover transition-colors shadow-md mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={onBackToLogin}
            className="text-link font-medium hover:underline flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

