import {
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const StatisticsCharts = () => {
  // Profit over time data
  const profitData = [
    { month: 'Jan', profit: 1200 },
    { month: 'Feb', profit: 1900 },
    { month: 'Mar', profit: 3000 },
    { month: 'Apr', profit: 2500 },
    { month: 'May', profit: 3200 },
    { month: 'Jun', profit: 2800 },
    { month: 'Jul', profit: 3500 },
    { month: 'Aug', profit: 4100 },
    { month: 'Sep', profit: 3800 },
    { month: 'Oct', profit: 4500 },
    { month: 'Nov', profit: 4200 },
    { month: 'Dec', profit: 4800 },
  ];

  // Balance trend data
  const balanceData = [
    { day: 'Mon', balance: 500 },
    { day: 'Tue', balance: 650 },
    { day: 'Wed', balance: 720 },
    { day: 'Thu', balance: 680 },
    { day: 'Fri', balance: 800 },
    { day: 'Sat', balance: 750 },
    { day: 'Sun', balance: 900 },
  ];

  // Win/Loss pie data
  const pieData = [
    { name: 'Won', value: 63, color: '#10B981' },
    { name: 'Lost', value: 37, color: '#EF4444' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Main Chart - Profit over time (2/3) */}
      <div className="lg:col-span-8 bg-background-paper rounded-xl shadow-sm p-5">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Profit over time
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={profitData}>
            <defs>
              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2A4B8D" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#2A4B8D" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="month" stroke="#64748B" />
            <YAxis stroke="#64748B" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
              }}
            />
            <Area
              type="monotone"
              dataKey="profit"
              stroke="#2A4B8D"
              fillOpacity={1}
              fill="url(#colorProfit)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Secondary Charts (1/3) */}
      <div className="lg:col-span-4 flex flex-col gap-5">
        {/* Line Chart - Balance Trend */}
        <div className="bg-background-paper rounded-xl shadow-sm p-5">
          <h3 className="text-base font-semibold text-text-primary mb-4">
            Balance Trend
          </h3>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={balanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="day" stroke="#64748B" fontSize={12} />
              <YAxis stroke="#64748B" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="#7E57C2"
                strokeWidth={2}
                dot={{ fill: '#7E57C2', r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart - Win/Loss */}
        <div className="bg-background-paper rounded-xl shadow-sm p-5">
          <h3 className="text-base font-semibold text-text-primary mb-4">
            Win/Loss Ratio
          </h3>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={50}
                paddingAngle={2}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => `${value}%`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default StatisticsCharts;

