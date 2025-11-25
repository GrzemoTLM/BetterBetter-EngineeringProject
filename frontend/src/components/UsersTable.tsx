import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface User {
  id: string;
  displayName: string;
  role: string;
  status: 'Active' | 'Blocked';
  created: string;
}

const UsersTable = () => {
  const [statusFilter, setStatusFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');

  const users: User[] = [
    {
      id: '001',
      displayName: 'John Doe',
      role: 'Admin',
      status: 'Active',
      created: '2024-01-15',
    },
    {
      id: '002',
      displayName: 'Jane Smith',
      role: 'User',
      status: 'Active',
      created: '2024-02-20',
    },
    {
      id: '003',
      displayName: 'Bob Johnson',
      role: 'User',
      status: 'Blocked',
      created: '2024-01-10',
    },
    {
      id: '004',
      displayName: 'Alice Brown',
      role: 'Moderator',
      status: 'Active',
      created: '2024-03-05',
    },
  ];

  return (
    <div className="bg-background-paper rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-text-primary mb-4">Users</h3>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-background-paper border border-default rounded-sm px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-main"
        >
          <option>All</option>
          <option>Active</option>
          <option>Blocked</option>
        </select>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-background-paper border border-default rounded-sm px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-main"
        >
          <option>All</option>
          <option>Admin</option>
          <option>User</option>
          <option>Moderator</option>
        </select>
        <button className="bg-primary-main text-primary-contrast px-4 py-1.5 rounded-sm text-sm hover:bg-primary-hover transition-colors">
          Apply filters
        </button>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button className="border border-default text-text-primary rounded-sm px-3 py-1 text-sm hover:bg-gray-50 transition-colors">
          Activate
        </button>
        <button className="border border-default text-text-primary rounded-sm px-3 py-1 text-sm hover:bg-gray-50 transition-colors">
          Block
        </button>
        <button className="border border-default text-text-primary rounded-sm px-3 py-1 text-sm hover:bg-gray-50 transition-colors">
          Force 2FA
        </button>
        <button className="border border-default text-text-primary rounded-sm px-3 py-1 text-sm hover:bg-gray-50 transition-colors">
          Export
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-background-table-header border-b border-default">
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">
                ID
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">
                Display Name
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">
                Role
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">
                Status
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-default">
            {users.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-gray-50 transition-colors bg-background-paper"
              >
                <td className="px-3 py-2 text-sm text-text-primary">{user.id}</td>
                <td className="px-3 py-2 text-sm text-text-primary font-medium">
                  {user.displayName}
                </td>
                <td className="px-3 py-2 text-sm text-text-secondary">{user.role}</td>
                <td className="px-3 py-2 text-sm">
                  <span
                    className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                      user.status === 'Active'
                        ? 'bg-status-active-bg text-status-active-text'
                        : 'bg-status-blocked-bg text-status-blocked-text'
                    }`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-sm text-text-secondary">
                  {user.created}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersTable;

