import { User } from 'lucide-react';
import UsersTable from './UsersTable';
import ActiveUsers from './ActiveUsers';
import TicketsAdminPage from './TicketsAdminPage';
import SystemHealth from './SystemHealth';
import Backups from './Backups';

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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-6 flex flex-col gap-4">
          <UsersTable />
          <ActiveUsers />
        </div>

        <div className="lg:col-span-6 flex flex-col gap-4">
          <TicketsAdminPage />
          <SystemHealth />
          <Backups />
        </div>
      </div>
    </div>
  );
};

export default AdminConsole;
