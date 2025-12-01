interface Backup {
  schedule: string;
  size: string;
  health: string;
  result: string;
}

const Backups = () => {
  const backups: Backup[] = [
    {
      schedule: 'Daily',
      size: '2.5 GB',
      health: 'Good',
      result: 'Success',
    },
    {
      schedule: 'Weekly',
      size: '15.2 GB',
      health: 'Good',
      result: 'Success',
    },
    {
      schedule: 'Monthly',
      size: '45.8 GB',
      health: 'Warning',
      result: 'Partial',
    },
  ];

  return (
    <div className="bg-background-paper rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-text-primary mb-1">Backups</h3>
      <p className="text-xs text-text-secondary mb-3">Work in progress</p>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-background-table-header border-b border-default">
              <th className="px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">
                Schedule
              </th>
              <th className="px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">
                Size
              </th>
              <th className="px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">
                Health
              </th>
              <th className="px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wider text-text-table-header">
                Result
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-default">
            {backups.map((backup, index) => (
              <tr
                key={index}
                className="hover:bg-gray-50 transition-colors bg-background-paper"
              >
                <td className="px-2 py-1.5 text-xs text-text-primary">
                  {backup.schedule}
                </td>
                <td className="px-2 py-1.5 text-xs text-text-primary">
                  {backup.size}
                </td>
                <td className="px-2 py-1.5 text-xs">
                  <span
                    className={`${
                      backup.health === 'Good'
                        ? 'text-status-success'
                        : 'text-status-warning'
                    }`}
                  >
                    {backup.health}
                  </span>
                </td>
                <td className="px-2 py-1.5 text-xs text-text-primary">
                  {backup.result}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Backups;
