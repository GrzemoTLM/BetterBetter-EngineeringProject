import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const Snapshots = () => {
  const data = [
    { time: '00:00', value: 100 },
    { time: '04:00', value: 120 },
    { time: '08:00', value: 95 },
    { time: '12:00', value: 140 },
    { time: '16:00', value: 130 },
    { time: '20:00', value: 150 },
  ];

  return (
    <div className="bg-background-paper rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-text-primary mb-1">Snapshots</h3>
      <p className="text-xs text-text-secondary mb-3">Work in progress</p>

      {/* Info */}
      <div className="mb-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-text-secondary">Schedule:</span>
          <span className="text-text-primary font-medium">Daily</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-secondary">Time:</span>
          <span className="text-text-primary font-medium">02:00</span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="time" stroke="#64748B" fontSize={10} />
            <YAxis stroke="#64748B" fontSize={10} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#2A4B8D"
              strokeWidth={2}
              dot={{ fill: '#2A4B8D', r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Snapshots;
