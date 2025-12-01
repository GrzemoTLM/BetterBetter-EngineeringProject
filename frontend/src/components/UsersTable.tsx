import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import api from '../services/api';
import type { UserProfile } from '../types/auth';

interface UserProfileWithStatus extends UserProfile {
  is_active?: boolean;
}

const UsersTable = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserProfileWithStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfileWithStatus | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchUsers = async () => {
      try {
        if (!isMounted) return;
        setLoading(true);
        setError(null);
        const data = await api.getAllUsers();
        if (!isMounted) return;
        
        if (Array.isArray(data)) {
          setUsers(data as UserProfileWithStatus[]);
        } else {
          console.warn('[UsersTable] Unexpected data format:', data);
          setUsers([]);
        }
      } catch (err) {
        if (!isMounted) return;
        const message = err instanceof Error ? err.message : 'Failed to load users';
        setError(message);
        setUsers([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  const safeUsers = Array.isArray(users) ? users : [];
  const filteredUsers = safeUsers.filter((user) => {
    let statusMatches = true;
    let roleMatches = true;
    let searchMatches = true;

    if (statusFilter === 'Active') {
      statusMatches = user.is_active !== false;
    } else if (statusFilter === 'Blocked') {
      statusMatches = user.is_active === false;
    }

    if (roleFilter === 'Admin') {
      roleMatches = !!user.is_superuser || !!user.is_staff;
    } else if (roleFilter === 'User') {
      roleMatches = !user.is_superuser && !user.is_staff;
    } else if (roleFilter === 'Moderator') {
      roleMatches = false;
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      searchMatches = 
        user.username.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.id.toString().includes(query);
    }

    return statusMatches && roleMatches && searchMatches;
  });

  const getRoleLabel = (user: UserProfile) => {
    if (user.is_superuser) return 'Admin';
    if (user.is_staff) return 'Staff';
    return 'User';
  };

  const handleUserClick = (user: UserProfileWithStatus) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleToggleBlock = async () => {
    if (!selectedUser) return;

    try {
      setIsUpdating(true);
      const newStatus = !selectedUser.is_active;
      await api.toggleUserStatus(selectedUser.id, newStatus);
      
      setUsers(Array.isArray(users) ? users.map(user => 
        user.id === selectedUser.id 
          ? { ...user, is_active: newStatus }
          : user
      ) : []);
      
      setSelectedUser({ ...selectedUser, is_active: newStatus });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update user status';
      setError(message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-background-paper rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-text-primary mb-4">Users</h3>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by username, email, or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-background-paper border border-default rounded-sm px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-main"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-background-paper border border-default rounded-sm px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-main"
        >
          <option value="" disabled className="text-text-secondary">Status</option>
          <option>Active</option>
          <option>Blocked</option>
        </select>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-background-paper border border-default rounded-sm px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-main"
        >
          <option value="" disabled className="text-text-secondary">Role</option>
          <option>Admin</option>
          <option>User</option>
          <option>Moderator</option>
        </select>
        <button className="bg-primary-main text-primary-contrast px-4 py-1.5 rounded-sm text-sm hover:bg-primary-hover transition-colors">
          Apply filters
        </button>
      </div>

      {error && (
        <div className="mb-3 text-xs text-red-500">{error}</div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-background-table-header border-b border-default">
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">
                ID
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">
                Username
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">
                Email
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">
                Role
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">
                Registered
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-default">
            {loading && filteredUsers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-sm text-text-secondary text-center">
                  Loading users...
                </td>
              </tr>
            )}
            {!loading && filteredUsers.length === 0 && !error && (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-sm text-text-secondary text-center">
                  No users found
                </td>
              </tr>
            )}
            {filteredUsers.map((user) => (
              <tr
                key={user.id}
                onClick={() => handleUserClick(user)}
                className="hover:bg-gray-50 transition-colors bg-background-paper cursor-pointer"
              >
                <td className="px-3 py-2 text-sm text-text-primary">{user.id}</td>
                <td className="px-3 py-2 text-sm text-text-primary font-medium">
                  {user.username}
                </td>
                <td className="px-3 py-2 text-sm text-text-secondary">{user.email}</td>
                <td className="px-3 py-2 text-sm text-text-secondary">{getRoleLabel(user)}</td>
                <td className="px-3 py-2 text-sm text-text-secondary">
                  {new Date(user.registered_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background-paper rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-default">
              <h2 className="text-2xl font-bold text-text-primary">
                User Details
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-background-table-header rounded-lg transition-colors"
              >
                <X size={24} className="text-text-secondary" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Username
                </label>
                <p className="text-text-primary">{selectedUser.username}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Email
                </label>
                <p className="text-text-primary">{selectedUser.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Role
                </label>
                <p className="text-text-primary">{getRoleLabel(selectedUser)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Status
                </label>
                <p className={`font-medium ${selectedUser.is_active !== false ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedUser.is_active !== false ? 'Active' : 'Blocked'}
                </p>
              </div>

              <div className="pt-4 border-t border-default">
                <button
                  onClick={handleToggleBlock}
                  disabled={isUpdating}
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedUser.is_active !== false
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isUpdating 
                    ? 'Updating...' 
                    : selectedUser.is_active !== false 
                      ? 'Block User' 
                      : 'Unblock User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersTable;
