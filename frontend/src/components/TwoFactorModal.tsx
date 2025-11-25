import React, { useState, useEffect } from 'react';
import { X, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import QRCode from 'qrcode';
import { apiService } from '../services/api';

interface TwoFactorModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEnabling: boolean;
  onVerificationSuccess: () => void;
}

const TwoFactorModal: React.FC<TwoFactorModalProps> = ({
  isOpen,
  onClose,
  isEnabling,
  onVerificationSuccess,
}) => {
  const [step, setStep] = useState<'setup' | 'verify'>('setup');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [success, setSuccess] = useState(false);

  // Step 1: Generate QR code when modal opens and isEnabling is true
  useEffect(() => {
    if (isOpen && isEnabling) {
      generateQRCode();
    }
  }, [isOpen, isEnabling]);

  const generateQRCode = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Call setup endpoint to get QR URI
      const response = await apiService.startTwoFactor({ method: 'totp' });
      
      if (response.otp_uri) {
        setSecret(response.secret || null);
        
        // Generate QR code from URI
        const qrDataUrl = await QRCode.toDataURL(response.otp_uri, {
          errorCorrectionLevel: 'H',
          type: 'image/png',
          width: 300,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        });
        
        setQrCode(qrDataUrl);
        setStep('setup');
      } else {
        setError('Failed to generate QR code');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate QR code';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    try {
      setIsVerifying(true);
      setError(null);
      
      // Call verify endpoint
      await apiService.verifyTwoFactor({ code: verificationCode });
      
      setSuccess(true);
      setStep('verify');
      
      // Call success callback after showing success message
      setTimeout(() => {
        onVerificationSuccess();
        handleClose();
      }, 1500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid verification code';
      setError(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    setStep('setup');
    setQrCode(null);
    setSecret(null);
    setVerificationCode('');
    setError(null);
    setCopied(false);
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background-paper rounded-xl shadow-lg w-full max-w-md p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-text-primary">
            {success ? 'Two-Factor Authentication Enabled' : 'Set Up Two-Factor Authentication'}
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading || isVerifying}
            className="p-2 hover:bg-background-table-header rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        {/* Success State */}
        {success && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="mb-4">
              <CheckCircle size={64} className="text-green-500" />
            </div>
            <p className="text-center text-text-primary font-medium">
              Two-Factor Authentication has been successfully enabled!
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && !success && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Setup Step */}
        {step === 'setup' && !success && (
          <div className="space-y-6">
            {/* Loading State */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="animate-spin mb-4">
                  <div className="w-8 h-8 border-4 border-border-divider border-t-primary-main rounded-full"></div>
                </div>
                <p className="text-text-secondary">Generating QR code...</p>
              </div>
            ) : qrCode ? (
              <>
                {/* QR Code Section */}
                <div className="space-y-3">
                  <p className="text-sm text-text-secondary">
                    Scan this QR code with an authenticator app (Google Authenticator, Authy, Microsoft Authenticator, etc.)
                  </p>
                  <div className="flex justify-center p-4 bg-background-app rounded-lg">
                    <img src={qrCode} alt="2FA QR Code" className="w-40 h-40" />
                  </div>
                </div>

                {/* Manual Entry Option */}
                {secret && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-text-secondary uppercase">
                      Can't scan? Enter this code manually:
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-2 bg-background-app rounded font-mono text-sm text-text-primary break-all">
                        {secret}
                      </code>
                      <button
                        onClick={handleCopySecret}
                        className="p-2 hover:bg-background-table-header rounded-lg transition-colors"
                        title="Copy secret"
                      >
                        {copied ? (
                          <CheckCircle size={20} className="text-green-500" />
                        ) : (
                          <Copy size={20} className="text-text-secondary" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Proceed to Verification */}
                <button
                  onClick={() => setStep('verify')}
                  className="w-full px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                  Next: Verify Code
                </button>
              </>
            ) : null}
          </div>
        )}

        {/* Verify Step */}
        {step === 'verify' && !success && (
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm text-text-secondary">
                Enter the 6-digit code from your authenticator app:
              </p>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                disabled={isVerifying}
                className="w-full px-4 py-3 text-center text-2xl font-mono border border-border-divider rounded-lg focus:outline-none focus:border-primary-main focus:ring-1 focus:ring-primary-main disabled:bg-background-app"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('setup')}
                disabled={isVerifying}
                className="flex-1 px-4 py-2 border border-border-divider rounded-lg hover:bg-background-table-header transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleVerifyCode}
                disabled={isVerifying || verificationCode.length !== 6}
                className="flex-1 px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {isVerifying ? 'Verifying...' : 'Verify & Enable'}
              </button>
            </div>
          </div>
        )}

        {/* Cancel Button for non-success states */}
        {!success && (
          <div className="mt-4">
            <button
              onClick={handleClose}
              disabled={isLoading || isVerifying}
              className="w-full px-4 py-2 text-text-secondary hover:bg-background-table-header rounded-lg transition-colors disabled:opacity-50"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TwoFactorModal;

