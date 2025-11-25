import { Bell } from 'lucide-react';
import SettingsRow from './SettingsRow';
import ToggleSwitch from './ToggleSwitch';
import DateFormatModal from './DateFormatModal';
import CurrencyModal from './CurrencyModal';
import TwoFactorModal from './TwoFactorModal';
import { useState, useEffect, useContext } from 'react';
import apiService from '../services/api';
import { useDateFormatter } from '../hooks/useDateFormatter';
import { useCurrency } from '../hooks/useCurrency';
import { DateFormatContext } from '../context/DateFormatContext';
import type { UserSettings, UpdateSettingsRequest } from '../types/settings';
import type { Currency } from '../context/CurrencyContext';

const Settings = () => {
  const { dateFormat } = useDateFormatter();
  const { setCurrency } = useCurrency();
  const dateFormatContext = useContext(DateFormatContext);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDateFormatModalOpen, setIsDateFormatModalOpen] = useState(false);
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [is2FAEnabling, setIs2FAEnabling] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiService.getSettings();

      // Map preferred_currency to basic_currency if it exists
      const settingsWithCurrency = {
        ...data,
        basic_currency: (data as any).preferred_currency || data.basic_currency || 'USD'
      };

      setSettings(settingsWithCurrency);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error loading settings';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSettings = async (updates: UpdateSettingsRequest) => {
    if (!settings) return;

    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      const completePayload: UpdateSettingsRequest = {
        nickname: settings.nickname,
        auto_coupon_payoff: settings.auto_coupon_payoff,
        automatic_payoff: settings.automatic_payoff,
        monthly_budget_limit: settings.monthly_budget_limit,
        locale: settings.locale,
        language: settings.language,
        date_format: settings.date_format,
        basic_currency: settings.basic_currency,
        notification_gate: settings.notification_gate,
        notification_gate_ref: settings.notification_gate_ref,
        two_factor_enabled: settings.two_factor_enabled,
        two_factor_method: settings.two_factor_method,
        ...updates, // Override with new updates
      };

      console.log('Settings: Sending PATCH request with payload:', completePayload);
      const updated = await apiService.updateSettings(completePayload);
      console.log('Settings: Received response:', updated);

      const settingsWithCurrency = {
        ...updated,
        basic_currency: (updated as any).preferred_currency || updated.basic_currency || 'USD'
      };

      setSettings(settingsWithCurrency);
      setSuccessMessage('Settings saved successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error saving settings';
      console.error('Settings: Error updating settings:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleAutomaticPayoff = async (checked: boolean) => {
    await handleUpdateSettings({ automatic_payoff: checked });
  };

  const handleToggle2FA = async (checked: boolean) => {
    if (checked) {
      setIs2FAEnabling(true);
      setIs2FAModalOpen(true);
    } else {
      await handleUpdateSettings({ two_factor_enabled: false });
    }
  };

  const handle2FAVerificationSuccess = async () => {
    // After successful verification, update settings to reflect 2FA is enabled
    if (settings) {
      setSettings({
        ...settings,
        two_factor_enabled: true,
        two_factor_method: 'totp',
      });
    }

    setIs2FAEnabling(false);
    setSuccessMessage('Two-Factor Authentication enabled successfully');
  };

  const handleDateFormatChange = async (format: string) => {
    await handleUpdateSettings({ date_format: format });
    if (dateFormatContext) {
      dateFormatContext.setDateFormat(format);
    }
  };

  const handleDateFormatClick = () => {
    setIsDateFormatModalOpen(true);
  };

  const handleCurrencyClick = () => {
    setIsCurrencyModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-text-secondary">Loading settings...</div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-status-error">Failed to load settings</div>
      </div>
    );
  }

  const settingsRows = [
    {
      label: 'Nickname',
      value: settings.nickname || 'Not set',
      action: 'Update',
      onClick: undefined,
    },
    {
      label: 'Email address',
      value: settings.email || 'Not set',
      action: 'Update',
      onClick: undefined,
    },
    {
      label: 'Set predefined bet values',
      value: settings.predefined_bet_values || 'Not set',
      action: 'Update',
      onClick: undefined,
    },
    {
      label: 'Turn coupon automatic payoff',
      control: (
        <ToggleSwitch
          checked={settings.automatic_payoff ?? false}
          onChange={handleToggleAutomaticPayoff}
        />
      ),
      onClick: undefined,
    },
    {
      label: 'Two factor authentication',
      control: (
        <ToggleSwitch
          checked={settings.two_factor_enabled ?? false}
          onChange={handleToggle2FA}
          disabled={isSaving}
        />
      ),
      onClick: undefined,
    },
    {
      label: 'Monthly budget limit',
      value: settings.monthly_budget_limit ? `$${settings.monthly_budget_limit}` : 'Not set',
      action: 'Update',
      onClick: undefined,
    },
    {
      label: 'Language',
      value: settings.language || 'English',
      action: 'Update',
      onClick: undefined,
    },
    {
      label: 'Date format',
      value: dateFormat || 'DD/MM/YYYY',
      action: 'Update',
      onClick: handleDateFormatClick,
    },
    {
      label: 'Basic currency',
      value: settings.basic_currency || 'USD',
      action: 'Update',
      onClick: handleCurrencyClick,
    },
    {
      label: 'Notifications gate',
      value: settings.telegram_chat_id ? `Telegram #${settings.telegram_chat_id}` : 'Not configured',
      action: 'Update',
      onClick: undefined,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-text-primary">Settings</h1>
        <button className="p-2 hover:bg-background-table-header rounded-lg transition-colors">
          <Bell size={24} className="text-text-secondary" />
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Settings Card */}
      <div className="bg-background-paper rounded-xl shadow-sm">
        <div className="divide-y divide-border-divider">
          {settingsRows.map((setting, index) => (
            <SettingsRow
              key={index}
              label={setting.label}
              value={setting.value}
              control={setting.control}
              action={setting.action}
              onActionClick={setting.onClick}
            />
          ))}
        </div>
      </div>

      {/* Date Format Modal */}
      <DateFormatModal
        isOpen={isDateFormatModalOpen}
        onClose={() => setIsDateFormatModalOpen(false)}
        currentFormat={dateFormat}
        onSave={handleDateFormatChange}
      />

      {/* Currency Modal */}
      <CurrencyModal
        isOpen={isCurrencyModalOpen}
        onClose={() => setIsCurrencyModalOpen(false)}
        currentCurrency={(settings.basic_currency as Currency) || 'USD'}
        onSave={async (currency) => {
          await handleUpdateSettings({ basic_currency: currency });
          setCurrency(currency);
        }}
      />

      {/* Two-Factor Authentication Modal */}
      <TwoFactorModal
        isOpen={is2FAModalOpen}
        onClose={() => {
          setIs2FAModalOpen(false);
          setIs2FAEnabling(false);
        }}
        isEnabling={is2FAEnabling}
        onVerificationSuccess={handle2FAVerificationSuccess}
      />
    </div>
  );
};

export default Settings;
