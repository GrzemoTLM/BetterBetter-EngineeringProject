import { useState } from 'react';
import { User as UserIcon } from 'lucide-react';

const UserQuickView = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'activity'>(
    'profile'
  );

  const tabs = [
    { id: 'profile' as const, label: 'Profile' },
    { id: 'security' as const, label: 'Security' },
    { id: 'activity' as const, label: 'Activity' },
  ];

  return (
    <div className="bg-background-paper rounded-lg shadow-sm border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-primary-main rounded-full flex items-center justify-center">
          <UserIcon size={24} className="text-white" />
        </div>
        <div>
          <div className="text-sm font-semibold text-text-primary">
            John Doe
          </div>
          <div className="text-xs text-text-secondary">john.doe@example.com</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-primary-main shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Email:</span>
          <span className="text-text-primary font-medium">
            john.doe@example.com
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Role:</span>
          <span className="text-text-primary font-medium">Admin</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Status:</span>
          <span className="bg-status-active-bg text-status-active-text px-2 py-0.5 rounded-full text-xs font-medium">
            Active
          </span>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="border border-danger rounded-lg p-3 bg-background-danger-zone">
        <div className="text-xs font-semibold text-red-800 mb-2 uppercase">
          Danger Zone
        </div>
        <div className="flex flex-col gap-2">
          <button className="border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1 rounded text-sm transition-colors text-left">
            Block User
          </button>
          <button className="border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1 rounded text-sm transition-colors text-left">
            Delete user
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserQuickView;

