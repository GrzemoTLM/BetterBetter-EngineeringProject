import { Mail, Lock, User } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface RegisterProps {
  onRegister: (challengeId?: string) => void;
  onBackToLogin: () => void;
}

const Register = ({ onRegister, onBackToLogin }: RegisterProps) => {
  const { register, isLoading, error } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!formData.username.trim()) {
      setLocalError('Username is required');
      return;
    }

    if (!formData.email.trim()) {
      setLocalError('Email is required');
      return;
    }

    if (formData.password.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    try {
      await register(formData.username, formData.email, formData.password);
      onRegister();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration error';
      setLocalError(errorMessage);
    }
  };

  const displayError = localError || error;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background-page p-4">
      {/* Main Card */}
      <div className="w-full max-w-[480px] bg-background-card rounded-2xl shadow-xl p-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-heading mb-2">BetterBetter</h1>
          <p className="text-body text-sm mt-2">Create your account</p>
        </div>

        {/* Error Display */}
        {displayError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{displayError}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username Input */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-body mb-2">
              Username
            </label>
            <div className="relative">
              <User
                size={20}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-input-placeholder"
              />
              <input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Enter your username"
                className="w-full pl-12 pr-4 py-3 border border-default rounded-lg focus:ring-2 focus:ring-primary-main focus:border-transparent outline-none transition-all bg-background-input text-heading placeholder:text-input-placeholder"
                required
                disabled={isLoading}
              />
            </div>
            <p className="text-xs text-body mt-1">Allowed: letters, digits, @, ., +, -, _</p>
          </div>

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
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Create a password"
                className="w-full pl-12 pr-4 py-3 border border-default rounded-lg focus:ring-2 focus:ring-primary-main focus:border-transparent outline-none transition-all bg-background-input text-heading placeholder:text-input-placeholder"
                required
                minLength={8}
                disabled={isLoading}
              />
            </div>
            <p className="text-xs text-body mt-1">Must be at least 8 characters</p>
          </div>

          {/* Confirm Password Input */}
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
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Confirm your password"
                className="w-full pl-12 pr-4 py-3 border border-default rounded-lg focus:ring-2 focus:ring-primary-main focus:border-transparent outline-none transition-all bg-background-input text-heading placeholder:text-input-placeholder"
                required
                disabled={isLoading}
              />
            </div>
            {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="text-xs text-status-error mt-1">Passwords do not match</p>
            )}
          </div>

          {/* Register Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-primary-main text-primary-text font-medium rounded-lg hover:bg-primary-hover transition-colors shadow-md mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Links */}
        <div className="text-center mt-4">
          <span className="text-body">
            Already have an account?{' '}
            <button 
              onClick={onBackToLogin}
              className="text-link font-medium hover:underline"
            >
              Sign In
            </button>
          </span>
        </div>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-default"></div>
          <span className="px-4 text-body text-sm">OR</span>
          <div className="flex-1 border-t border-default"></div>
        </div>

        {/* Google Button */}
        <button className="w-full py-3 border border-default bg-white text-heading font-medium rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors">
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

export default Register;

