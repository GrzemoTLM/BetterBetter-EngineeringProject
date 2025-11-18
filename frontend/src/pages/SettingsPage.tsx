import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import type { UserSettings } from '../types/settings';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [show2FASetup, setShow2FASetup] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState<'totp' | 'email' | ''>('');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [is2FAVerifying, setIs2FAVerifying] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiService.getSettings();

      if (data && typeof data === 'object' && ('code' in data || 'message' in data)) {
        throw new Error(JSON.stringify(data));
      }

      setSettings(data);
    }
    catch (err) {
      let errorMessage = 'Error loading settings';

      if (err instanceof Error) {
        errorMessage = err.message;
      }
      else if (typeof err === 'object' && err !== null) {
        const errorObj = err as { message?: string; code?: string };
        errorMessage = errorObj.message || errorObj.code || JSON.stringify(err);
      }

      setError(errorMessage);
    }
    finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSettings = async (updates: Partial<UserSettings>) => {
    if (!settings) return;

    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);
      const updated = await apiService.updateSettings(updates);

      setSettings(updated);
      setSuccessMessage('Settings saved successfully');
    }
    catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error saving settings';
      setError(errorMessage);
    }
    finally {
      setIsSaving(false);
    }
  };

  const handleStart2FA = async () => {
    try {
      setError(null);
      const response = await apiService.startTwoFactor({ method: twoFactorMethod });

      if (response.qr_code) {
        setQrCode(response.qr_code);
      }

      setShow2FASetup(true);
    }
    catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error initializing 2FA';
      setError(errorMessage);
    }
  };

  const handleVerify2FA = async () => {
    try {
      setIs2FAVerifying(true);
      setError(null);
      await apiService.verifyTwoFactor({ code: verificationCode });
      setSuccessMessage('2FA enabled successfully');
      setShow2FASetup(false);
      setVerificationCode('');
      setQrCode(null);
      await loadSettings();
    }
    catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid verification code';
      setError(errorMessage);
    }
    finally {
      setIs2FAVerifying(false);
    }
  };

  if (isLoading) {
    return <div>Loading settings...</div>;
  }

  if (!settings) {
    return <div>Failed to load settings</div>;
  }

  return (
    <div>
      <h1>Settings</h1>

      <button onClick={() => navigate('/dashboard')}>← Back to Dashboard</button>

      {error && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          {String(error)}
        </div>
      )}

      {successMessage && (
        <div style={{ color: 'green', marginTop: '10px' }}>
          {String(successMessage)}
        </div>
      )}

      <section style={{ marginTop: '20px' }}>
        <h2>Profile Settings</h2>

        <div style={{ marginTop: '10px' }}>
          <label htmlFor="nickname">Nickname</label>
          <input
            id="nickname"
            type="text"
            value={settings.nickname || ''}
            onChange={(e) => setSettings({ ...settings, nickname: e.target.value })}
            onBlur={() => handleUpdateSettings({ nickname: settings.nickname })}
            disabled={isSaving}
          />
        </div>

        <div style={{ marginTop: '10px' }}>
          <label htmlFor="locale">Language</label>
          <select
            id="locale"
            value={settings.locale}
            onChange={(e) => setSettings({ ...settings, locale: e.target.value })}
            onBlur={() => handleUpdateSettings({ locale: settings.locale })}
            disabled={isSaving}
          >
            <option value="en">English</option>
            <option value="pl">Polski</option>
          </select>
        </div>

        <div style={{ marginTop: '10px' }}>
          <label htmlFor="date_format">Date Format</label>
          <select
            id="date_format"
            value={settings.date_format}
            onChange={(e) => setSettings({ ...settings, date_format: e.target.value })}
            onBlur={() => handleUpdateSettings({ date_format: settings.date_format })}
            disabled={isSaving}
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>

        <div style={{ marginTop: '10px' }}>
          <label htmlFor="monthly_budget_limit">Monthly Budget Limit</label>
          <input
            id="monthly_budget_limit"
            type="text"
            value={settings.monthly_budget_limit || ''}
            onChange={(e) => setSettings({ ...settings, monthly_budget_limit: e.target.value })}
            onBlur={() => handleUpdateSettings({ monthly_budget_limit: settings.monthly_budget_limit })}
            disabled={isSaving}
          />
        </div>

        <div style={{ marginTop: '10px' }}>
          <label>
            <input
              type="checkbox"
              checked={settings.auto_coupon_payoff}
              onChange={(e) => handleUpdateSettings({ auto_coupon_payoff: e.target.checked })}
              disabled={isSaving}
            />
            Automatic Coupon Payout
          </label>
        </div>
      </section>

      <section style={{ marginTop: '30px' }}>
        <h2>Notifications</h2>

        <div style={{ marginTop: '10px' }}>
          <label htmlFor="notification_gate">Notification Channel</label>
          <select
            id="notification_gate"
            value={settings.notification_gate}
            onChange={(e) => handleUpdateSettings({ notification_gate: e.target.value as 'email' | 'telegram' | 'none' })}
            disabled={isSaving}
          >
            <option value="none">None</option>
            <option value="email">Email</option>
            <option value="telegram">Telegram</option>
          </select>
        </div>

        {settings.notification_gate === 'email' && (
          <div style={{ marginTop: '10px' }}>
            <label htmlFor="notification_gate_ref">Email Address</label>
            <input
              id="notification_gate_ref"
              type="text"
              value={settings.notification_gate_ref || ''}
              onChange={(e) => setSettings({ ...settings, notification_gate_ref: e.target.value })}
              onBlur={() => handleUpdateSettings({ notification_gate_ref: settings.notification_gate_ref })}
              disabled={isSaving}
            />
          </div>
        )}

        {settings.notification_gate === 'telegram' && (
          <div style={{ marginTop: '10px' }}>
            <button>Configure Telegram</button>
          </div>
        )}
      </section>

      <section style={{ marginTop: '30px' }}>
        <h2>Two-Factor Authentication (2FA)</h2>

        <div style={{ marginTop: '10px' }}>
          <p>
            Status: {settings.two_factor_enabled ? (
              <strong style={{ color: 'green' }}>Enabled ({settings.two_factor_method})</strong>
            ) : (
              <strong style={{ color: 'red' }}>Disabled</strong>
            )}
          </p>

          {!settings.two_factor_enabled && !show2FASetup && (
            <div style={{ marginTop: '10px' }}>
              <label htmlFor="2fa_method">Select 2FA method:</label>
              <select
                id="2fa_method"
                value={twoFactorMethod}
                onChange={(e) => setTwoFactorMethod(e.target.value as 'totp' | 'email')}
              >
                <option value="">Select method</option>
                <option value="totp">Mobile App (TOTP)</option>
                <option value="email">Email</option>
              </select>
              {twoFactorMethod && (
                <button style={{ marginLeft: '10px' }}>Configure 2FA</button>
              )}
            </div>
          )}

          {show2FASetup && (
            <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ccc' }}>
              <h3>2FA Setup</h3>

              {qrCode && (
                <div style={{ marginTop: '10px' }}>
                  <p>Scan the QR code with your authentication app (e.g., Google Authenticator):</p>
                  <img src={qrCode} alt="QR Code" style={{ maxWidth: '200px' }} />
                </div>
              )}

              <div style={{ marginTop: '15px' }}>
                <label htmlFor="verification_code">Enter the code from the app:</label>
                <input
                  id="verification_code"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                  placeholder="000000"
                  disabled={is2FAVerifying}
                />
              </div>

              <div style={{ marginTop: '10px' }}>
                <button
                  onClick={handleVerify2FA}
                  disabled={is2FAVerifying || verificationCode.length !== 6}
                >
                  {is2FAVerifying ? 'Verifying...' : 'Confirm'}
                </button>
                <button
                  onClick={() => {
                    setShow2FASetup(false);
                    setVerificationCode('');
                    setQrCode(null);
                  }}
                  disabled={is2FAVerifying}
                  style={{ marginLeft: '10px' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
