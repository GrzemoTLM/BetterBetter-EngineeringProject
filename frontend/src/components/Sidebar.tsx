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

interface SidebarProps {
  activeView: 'dashboard' | 'money-flow' | 'settings' | 'coupons' | 'statistics' | 'admin' | 'help';
  onViewChange: (view: 'dashboard' | 'money-flow' | 'settings' | 'coupons' | 'statistics' | 'admin' | 'help') => void;
  onLogout: () => void;
}

const Sidebar = ({ activeView, onViewChange, onLogout }: SidebarProps) => {
  const navItems = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      view: 'dashboard' as const,
    },
    {
      icon: Ticket,
      label: 'Coupons',
      view: 'coupons' as const,
    },
    {
      icon: BarChart3,
      label: 'Statistics',
      view: 'statistics' as const,
    },
    {
      icon: Wallet,
      label: 'Money Flow',
      view: 'money-flow' as const,
    },
    {
      icon: User,
      label: 'Profile',
      view: 'dashboard' as const, // Placeholder - can be extended later
    },
    {
      icon: SettingsIcon,
      label: 'Settings',
      view: 'settings' as const,
    },
    {
      icon: HelpCircle,
      label: 'Help',
      view: 'help' as const,
    },
    {
      icon: Shield,
      label: 'Admin Console',
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
      <div className="border-t border-white/10 p-4">
        <button
          onClick={onLogout}
          className="w-full flex items-center px-6 py-3 gap-2 text-text-sidebar-inactive hover:text-text-sidebar-active transition-colors"
        >
          <LogOut size={20} />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

