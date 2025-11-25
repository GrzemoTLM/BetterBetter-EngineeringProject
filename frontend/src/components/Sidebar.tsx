import {
  LayoutDashboard,
  Ticket,
  BarChart3,
  Wallet,
  User,
  Settings as SettingsIcon,
  HelpCircle,
  LogOut,
  Shield,
} from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import apiService from '../services/api';

interface SidebarProps {
  activeView: 'dashboard' | 'money-flow' | 'settings' | 'coupons' | 'statistics' | 'admin' | 'help';
  onViewChange: (view: 'dashboard' | 'money-flow' | 'settings' | 'coupons' | 'statistics' | 'admin' | 'help') => void;
  onLogout: () => void;
  onLanguageChange?: () => Promise<void>;
}

const Sidebar = ({ activeView, onViewChange, onLogout, onLanguageChange }: SidebarProps) => {
  const { language, setLanguage, t } = useLanguage();
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);

  const handleLanguageChange = async (lang: 'pl' | 'en') => {
    if (language === lang) return;

    setIsChangingLanguage(true);
    const previousLanguage = language;
    setLanguage(lang);

    try {
      const locale = lang === 'pl' ? 'pl-PL' : 'en-US';
      await apiService.updateSettings({ locale });

      if (onLanguageChange) {
        await onLanguageChange();
      } else {
        await apiService.getSettings();
      }
    } catch (err) {
      console.error('Failed to change language:', err);
      setLanguage(previousLanguage);
    } finally {
      setIsChangingLanguage(false);
    }
  };

  const navItems = [
    {
      icon: LayoutDashboard,
      label: t.sidebar.dashboard,
      view: 'dashboard' as const,
    },
    {
      icon: Ticket,
      label: t.sidebar.coupons,
      view: 'coupons' as const,
    },
    {
      icon: BarChart3,
      label: t.sidebar.statistics,
      view: 'statistics' as const,
    },
    {
      icon: Wallet,
      label: t.sidebar.moneyFlow,
      view: 'money-flow' as const,
    },
    {
      icon: User,
      label: t.sidebar.profile,
      view: 'dashboard' as const,
    },
    {
      icon: SettingsIcon,
      label: t.sidebar.settings,
      view: 'settings' as const,
    },
    {
      icon: HelpCircle,
      label: t.sidebar.help,
      view: 'help' as const,
    },
    {
      icon: Shield,
      label: t.sidebar.adminConsole,
      view: 'admin' as const,
    },
  ];

  return (
    <div className="fixed left-0 top-0 h-screen w-[260px] bg-background-sidebar z-[100] flex flex-col">
      <div className="flex flex-col pt-8 flex-1">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeView === item.view;
          return (
            <div
              key={index}
              onClick={() => onViewChange(item.view)}
              className={`flex items-center px-6 py-3 gap-2 cursor-pointer transition-colors ${
                isActive
                  ? 'bg-white/8 text-text-sidebar-active border-l-4 border-secondary-main'
                  : 'text-text-sidebar-inactive hover:text-text-sidebar-active'
              }`}
            >
              <Icon size={20} />
              <span className="text-sm font-medium">{item.label}</span>
            </div>
          );
        })}
      </div>

      {/* Logout Button */}
      <div className="border-t border-white/10 p-4 space-y-3">
        {/* Language Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => handleLanguageChange('pl')}
            disabled={isChangingLanguage}
            className={`flex-1 px-3 py-2 rounded text-xs font-medium transition-colors ${
              language === 'pl'
                ? 'bg-secondary-main text-white'
                : 'bg-white/10 text-text-sidebar-inactive hover:text-text-sidebar-active'
            } disabled:opacity-50`}
          >
            🇵🇱 PL
          </button>
          <button
            onClick={() => handleLanguageChange('en')}
            disabled={isChangingLanguage}
            className={`flex-1 px-3 py-2 rounded text-xs font-medium transition-colors ${
              language === 'en'
                ? 'bg-secondary-main text-white'
                : 'bg-white/10 text-text-sidebar-inactive hover:text-text-sidebar-active'
            } disabled:opacity-50`}
          >
            🇬🇧 EN
          </button>
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="w-full flex items-center px-6 py-3 gap-2 text-text-sidebar-inactive hover:text-text-sidebar-active transition-colors"
        >
          <LogOut size={20} />
          <span className="text-sm font-medium">{t.sidebar.logout}</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

