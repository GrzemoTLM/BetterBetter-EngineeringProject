const SystemHealth = () => {
  const metrics = [
    { label: 'DBP', value: '12ms' },
    { label: 'Error Rate', value: '0.5%' },
    { label: 'Queue', value: '42' },
    { label: 'Storage', value: '60%' },
    { label: 'CPU', value: '45%' },
    { label: 'Memory', value: '72%' },
    { label: 'Network', value: '1.2 GB/s' },
    { label: 'Uptime', value: '99.9%' },
  ];

  return (
    <div className="bg-background-paper rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-text-primary mb-4">
        System Health
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className="border border-default rounded p-2 text-center flex flex-col items-center justify-center bg-gray-50"
          >
            <div className="font-bold text-text-primary text-base">
              {metric.value}
            </div>
            <div className="text-xs text-text-secondary uppercase mt-1">
              {metric.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SystemHealth;

