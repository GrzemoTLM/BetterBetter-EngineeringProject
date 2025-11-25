import { ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface TwoFAProps {
  challengeId: string;
  onEnter: () => void;
}

const TwoFA = ({ challengeId, onEnter }: TwoFAProps) => {
  const { verify2FA, isLoading, error } = useAuth();
  const [code, setCode] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (code.trim().length < 6) {
      setLocalError('Please enter a valid 6-digit code');
      return;
    }

    try {
      await verify2FA(challengeId, code);
      onEnter();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid 2FA code';
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
          <h2 className="text-2xl font-semibold text-heading mb-4">
            Need additional verification
          </h2>
          
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary-main/10 rounded-full flex items-center justify-center">
              <ShieldCheck size={32} className="text-primary-main" />
            </div>
          </div>
        </div>

        {/* Error Display */}
        {displayError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{displayError}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 2FA Code Input */}
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-body mb-2">
              Enter your 2FA code
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

          {/* Enter Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-primary-main text-primary-text font-medium rounded-lg hover:bg-primary-hover transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Verifying...' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TwoFA;

