import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

interface ResetPasswordFormProps {
  onSuccess?: () => void;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ onSuccess }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'verify'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      if (!email) {
        throw new Error('Email is required');
      }

      console.log('Sending password reset request for email:', email);
      const response = await apiService.requestPasswordReset({ email });
      console.log('Password reset response:', response);
      setSuccess('Reset code has been sent to your email');
      setStep('verify');
    } catch (err) {
      console.error('Password reset error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error requesting password reset';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      if (!code) {
        throw new Error('Reset code is required');
      }

      if (!newPassword) {
        throw new Error('New password is required');
      }

      if (newPassword !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }

      await apiService.confirmPasswordReset({
        email,
        code,
        new_password: newPassword,
      });

      setSuccess('Password has been reset successfully');
      setTimeout(() => {
        onSuccess?.();
        navigate('/login');
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error resetting password';
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
      setSuccess('New reset code has been sent to your email');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error resending code';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <h2>Reset Password</h2>

      {error && (
        <div role="alert" style={{ color: 'red', marginBottom: '10px', padding: '10px', backgroundColor: '#ffe0e0', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      {success && (
        <div role="status" style={{ color: 'green', marginBottom: '10px', padding: '10px', backgroundColor: '#e0ffe0', borderRadius: '4px' }}>
          {success}
        </div>
      )}

      {step === 'email' ? (
        <form onSubmit={handleRequestReset}>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            {isLoading ? 'Sending...' : 'Send Reset Code'}
          </button>

          <p style={{ textAlign: 'center', marginTop: '15px', fontSize: '14px' }}>
            <button
              type="button"
              onClick={() => navigate('/login')}
              style={{
                background: 'none',
                border: 'none',
                color: '#667eea',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Back to Login
            </button>
          </p>
        </form>
      ) : (
        <form onSubmit={handleConfirmReset}>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="code" style={{ display: 'block', marginBottom: '5px' }}>
              Reset Code
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={isLoading}
              placeholder="Enter code from email"
              required
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="newPassword" style={{ display: 'block', marginBottom: '5px' }}>
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isLoading}
              placeholder="At least 8 characters"
              required
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '5px' }}>
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              placeholder="Confirm new password"
              required
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </button>

          <p style={{ textAlign: 'center', marginTop: '15px', fontSize: '14px' }}>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={isLoading}
              style={{
                background: 'none',
                border: 'none',
                color: '#667eea',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                textDecoration: 'underline',
              }}
            >
              Resend Code
            </button>
          </p>

          <p style={{ textAlign: 'center', marginTop: '5px', fontSize: '14px' }}>
            <button
              type="button"
              onClick={() => {
                setStep('email');
                setCode('');
                setNewPassword('');
                setConfirmPassword('');
                setError(null);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#667eea',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Use different email
            </button>
          </p>
        </form>
      )}
    </div>
  );
};
