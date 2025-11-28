import { User } from 'lucide-react';
import UsersTable from './UsersTable';
import ActiveUsers from './ActiveUsers';
import UserQuickView from './UserQuickView';
import Snapshots from './Snapshots';
import TicketsAdminPage from './TicketsAdminPage';
import Backups from './Backups';
import SystemHealth from './SystemHealth';

const AdminConsole = () => {
  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-text-primary">Admin console</h1>
        <div className="flex items-center gap-4">
          <button className="border border-primary-main text-primary-main rounded-lg px-4 py-2 text-sm hover:bg-blue-50 transition-colors font-medium">
            Impersonate user
          </button>
          <div className="w-10 h-10 bg-primary-main rounded-full flex items-center justify-center">
            <User size={20} className="text-white" />
          </div>
        </div>
      </div>

      {/* 3-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column - Users & Active Users (Span 6) */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <UsersTable />
          <ActiveUsers />
        </div>

        {/* Middle Column - User Quick View & Snapshots (Span 3) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <UserQuickView />
          <Snapshots />
        </div>

        {/* Right Column - Tickets, Backups, System Health (Span 3) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <TicketsAdminPage />
          <Backups />
          <SystemHealth />
        </div>
      </div>
    </div>
  );
};

export default AdminConsole;
