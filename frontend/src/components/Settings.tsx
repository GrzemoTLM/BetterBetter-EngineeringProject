/* eslint-disable @typescript-eslint/no-explicit-any */
import { Bell } from 'lucide-react';
import SettingsRow from './SettingsRow';
import ToggleSwitch from './ToggleSwitch';
import DateFormatModal from './DateFormatModal';
import CurrencyModal from './CurrencyModal';
import MonthlyBudgetLimitModal from './MonthlyBudgetLimitModal';
import NicknameModal from './NicknameModal';
import LanguageModal from './LanguageModal';
import PredefinedBetValuesModal from './PredefinedBetValuesModal';
import TwoFactorModal from './TwoFactorModal';
import TelegramConnectionModal from './TelegramConnectionModal';
import { useState, useEffect, useContext, useCallback, useRef } from 'react';
import apiService from '../services/api';
import { useDateFormatter } from '../hooks/useDateFormatter';
import { useCurrency } from '../hooks/useCurrency';
import { useLanguage } from '../hooks/useLanguage';
import { DateFormatContext } from '../context/DateFormatContext';
import type { UserSettings, UpdateSettingsRequest } from '../types/settings';
import type { Currency } from '../context/CurrencyContext';

const Settings = () => {
  const { dateFormat } = useDateFormatter();
  const { setCurrency } = useCurrency();
  const { language, setLanguage } = useLanguage();
  const dateFormatContext = useContext(DateFormatContext);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDateFormatModalOpen, setIsDateFormatModalOpen] = useState(false);
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  const [isMonthlyBudgetLimitModalOpen, setIsMonthlyBudgetLimitModalOpen] = useState(false);
  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isPredefinedBetsModalOpen, setIsPredefinedBetsModalOpen] = useState(false);
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [is2FAEnabling, setIs2FAEnabling] = useState(false);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const previousLanguageRef = useRef<string>(language);

  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiService.getSettings();

      const settingsWithCurrency = {
        ...data,
        basic_currency: (data as any).preferred_currency || data.basic_currency || 'USD'
      };

      setSettings(settingsWithCurrency);

      // Synchronize language from backend locale
      if (data.locale && data.locale.startsWith('pl')) {
        setLanguage('pl');
      } else if (data.locale && data.locale.startsWith('en')) {
        setLanguage('en');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error loading settings';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [setLanguage]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (previousLanguageRef.current !== language) {
      previousLanguageRef.current = language;
      loadSettings();
    }
  }, [language, loadSettings]);

  const handleUpdateSettings = async (updates: UpdateSettingsRequest) => {
    if (!settings) return;

    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      const completePayload: any = {
        nickname: settings.nickname,
        auto_coupon_payoff: settings.auto_coupon_payoff,
        automatic_payoff: settings.automatic_payoff,
        monthly_budget_limit: settings.monthly_budget_limit,
        locale: settings.locale,
        date_format: settings.date_format,
        basic_currency: settings.basic_currency,
        notification_gate: settings.notification_gate,
        notification_gate_ref: settings.notification_gate_ref,
        two_factor_enabled: settings.two_factor_enabled,
        two_factor_method: settings.two_factor_method,
        ...updates, // Override with new updates
      };

      const updated = await apiService.updateSettings(completePayload);

      const updatedWithPreferred = updated as any;
      const settingsWithCurrency = {
        ...updated,
        basic_currency: updatedWithPreferred.preferred_currency || updated.basic_currency || 'USD',
        // Ensure predefined_bet_values is always an array
        predefined_bet_values: Array.isArray(updated.predefined_bet_values)
          ? updated.predefined_bet_values
          : []
      };

      setSettings(settingsWithCurrency);
      setSuccessMessage('Settings saved successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error saving settings';
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

  const handleNicknameClick = () => {
    setIsNicknameModalOpen(true);
  };

  const handleCurrencyClick = () => {
    setIsCurrencyModalOpen(true);
  };

  const handleMonthlyBudgetLimitClick = () => {
    setIsMonthlyBudgetLimitModalOpen(true);
  };

  const handleLanguageClick = () => {
    setIsLanguageModalOpen(true);
  };

  const handlePredefinedBetsClick = () => {
    setIsPredefinedBetsModalOpen(true);
  };

  const handleTelegramClick = () => {
    setIsTelegramModalOpen(true);
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
      onClick: handleNicknameClick,
    },
    {
      label: 'Email address',
      value: settings.email || 'Not set',
      action: 'Update',
      onClick: undefined,
    },
    {
      label: 'Set predefined bet values',
      value: settings.predefined_bet_values && settings.predefined_bet_values.length > 0
        ? settings.predefined_bet_values.join(', ')
        : 'Not set',
      action: 'Update',
      onClick: handlePredefinedBetsClick,
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
      onClick: handleMonthlyBudgetLimitClick,
    },
    {
      label: 'Language',
      value: settings.locale && settings.locale.startsWith('pl') ? '🇵🇱 Polski' : '🇬🇧 English',
      action: 'Update',
      onClick: handleLanguageClick,
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
      value: settings.notification_gate === 'telegram' && settings.notification_gate_ref
        ? `✓ Telegram Connected`
        : 'None',
      action: 'Update',
      onClick: handleTelegramClick,
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

      {/* Nickname Modal */}
      <NicknameModal
        isOpen={isNicknameModalOpen}
        onClose={() => setIsNicknameModalOpen(false)}
        currentNickname={settings.nickname || undefined}
        onSave={async (nickname) => {
          await handleUpdateSettings({ nickname });
        }}
      />

      {/* Language Modal */}
      <LanguageModal
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
        onSave={async (locale) => {
          setLanguage(locale.startsWith('pl') ? 'pl' : 'en');
          await handleUpdateSettings({ locale });
        }}
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

      {/* Monthly Budget Limit Modal */}
      <MonthlyBudgetLimitModal
        isOpen={isMonthlyBudgetLimitModalOpen}
        onClose={() => setIsMonthlyBudgetLimitModalOpen(false)}
        currentLimit={settings.monthly_budget_limit || undefined}
        onSave={async (limit) => {
          await handleUpdateSettings({ monthly_budget_limit: limit });
        }}
      />

      {/* Predefined Bet Values Modal */}
      <PredefinedBetValuesModal
        isOpen={isPredefinedBetsModalOpen}
        onClose={() => setIsPredefinedBetsModalOpen(false)}
        currentValues={settings.predefined_bet_values}
        onSave={async (values) => {
          await handleUpdateSettings({ predefined_bet_values: values });
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

      {/* Telegram Connection Modal */}
      <TelegramConnectionModal
        isOpen={isTelegramModalOpen}
        onClose={() => setIsTelegramModalOpen(false)}
        isConnected={settings.notification_gate === 'telegram' && !!settings.notification_gate_ref}
        onConnectionSuccess={() => {
          loadSettings();
        }}
        onDisconnectSuccess={() => {
          loadSettings();
        }}
      />
    </div>
  );
};

export default Settings;
