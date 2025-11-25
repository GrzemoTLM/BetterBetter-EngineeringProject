interface LogEntry {
  time: string;
  user: string;
  action: string;
  resource: string;
  dateRange: string;
}

const ActivityLog = () => {
  const logs: LogEntry[] = [
    {
      time: '10:30',
      user: 'John Doe',
      action: 'Login',
      resource: '/dashboard',
      dateRange: '2024-01-15',
    },
    {
      time: '09:15',
      user: 'Jane Smith',
      action: 'Create',
      resource: 'Coupon #123',
      dateRange: '2024-01-15',
    },
    {
      time: '08:45',
      user: 'Bob Johnson',
      action: 'Update',
      resource: 'Settings',
      dateRange: '2024-01-15',
    },
    {
      time: '07:20',
      user: 'Alice Brown',
      action: 'Delete',
      resource: 'Transaction #456',
      dateRange: '2024-01-15',
    },
  ];

  return (
    <div className="bg-background-paper rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-text-primary mb-4">
        Activity Log
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-background-table-header border-b border-default">
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">
                Time
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">
                User
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">
                Action
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">
                Resource
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">
                Date range
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-default">
            {logs.map((log, index) => (
              <tr
                key={index}
                className="hover:bg-gray-50 transition-colors bg-background-paper"
              >
                <td className="px-3 py-2 text-sm text-text-secondary">{log.time}</td>
                <td className="px-3 py-2 text-sm text-text-primary">{log.user}</td>
                <td className="px-3 py-2 text-sm text-text-primary">{log.action}</td>
                <td className="px-3 py-2 text-sm text-text-secondary">
                  {log.resource}
                </td>
                <td className="px-3 py-2 text-sm text-text-secondary">
                  {log.dateRange}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ActivityLog;

