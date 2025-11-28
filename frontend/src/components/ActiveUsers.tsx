import { useEffect, useState } from 'react';
import api, { type LoggedInUser } from '../services/api';

const ActiveUsers = () => {
  const [users, setUsers] = useState<LoggedInUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchUsers = async () => {
      try {
        if (!isMounted) return;
        setLoading(true);
        setError(null);
        const data = await api.getLoggedInUsers();
        if (!isMounted) return;
        setUsers(data);
      } catch (err) {
        if (!isMounted) return;
        const message = err instanceof Error ? err.message : 'Failed to load active users';
        setError(message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUsers();
    const intervalId = window.setInterval(fetchUsers, 5000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="bg-background-paper rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary">
          Online users
        </h3>
        {loading && (
          <span className="text-xs text-text-secondary">Refreshing...</span>
        )}
      </div>
      {error && (
        <div className="mb-3 text-xs text-red-500">{error}</div>
      )}
      {!error && users.length === 0 && !loading && (
        <div className="text-sm text-text-secondary">No active sessions</div>
      )}
      {users.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-background-table-header border-b border-default">
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
                  Last login
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">
                  Session expires
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {users.map((user) => (
                <tr
                  key={user.session_key}
                  className="hover:bg-gray-50 transition-colors bg-background-paper"
                >
                  <td className="px-3 py-2 text-sm text-text-primary">
                    {user.username}
                  </td>
                  <td className="px-3 py-2 text-sm text-text-secondary">
                    {user.email}
                  </td>
                  <td className="px-3 py-2 text-sm text-text-secondary">
                    {user.is_superuser
                      ? 'Superuser'
                      : user.is_staff
                      ? 'Staff'
                      : 'User'}
                  </td>
                  <td className="px-3 py-2 text-sm text-text-secondary">
                    {user.last_login
                      ? new Date(user.last_login).toLocaleString()
                      : '—'}
                  </td>
                  <td className="px-3 py-2 text-sm text-text-secondary">
                    {new Date(user.session_expire_date).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ActiveUsers;
