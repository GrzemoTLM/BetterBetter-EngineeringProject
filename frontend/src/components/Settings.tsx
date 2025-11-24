import { Bell } from 'lucide-react';
import SettingsRow from './SettingsRow';
import ToggleSwitch from './ToggleSwitch';
import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useDateFormatter } from '../hooks/useDateFormatter';
import type { UserSettings } from '../types/settings';

const Settings = () => {
  const { formatDate } = useDateFormatter();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiService.getSettings();
      setSettings(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error loading settings';
      setError(errorMessage);
    } finally {
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
    // Note: 2FA setup requires additional steps (QR code, verification)
    // This is a simplified version - full implementation would require modal
    await handleUpdateSettings({ two_factor_enabled: checked });
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
    },
    {
      label: 'Email address',
      value: settings.email || 'Not set',
      action: 'Update',
    },
    {
      label: 'Set predefined bet values',
      value: settings.predefined_bet_values || 'Not set',
      action: 'Update',
    },
    {
      label: 'Turn coupon automatic payoff',
      control: (
        <ToggleSwitch
          checked={settings.automatic_payoff ?? false}
          onChange={handleToggleAutomaticPayoff}
          disabled={isSaving}
        />
      ),
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
    },
    {
      label: 'Monthly budget limit',
      value: settings.monthly_budget_limit ? `$${settings.monthly_budget_limit}` : 'Not set',
      action: 'Update',
    },
    {
      label: 'Language',
      value: settings.language || 'English',
      action: 'Update',
    },
    {
      label: 'Date format',
      value: settings.date_format || 'DD-MM-YYYY',
      action: 'Update',
    },
    {
      label: 'Basic currency',
      value: settings.basic_currency || 'USD',
      action: 'Update',
    },
    {
      label: 'Notifications gate',
      value: settings.telegram_chat_id ? `Telegram #${settings.telegram_chat_id}` : 'Not configured',
      action: 'Update',
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
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Settings;

