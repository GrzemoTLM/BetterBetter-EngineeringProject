import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ResultsBarChart = () => {
  const data = [
    { day: 'Mon', value: 1200 },
    { day: 'Tue', value: 1900 },
    { day: 'Wed', value: 3000 },
    { day: 'Thu', value: 2500 },
    { day: 'Fri', value: 3200 },
    { day: 'Sat', value: 2800 },
    { day: 'Sun', value: 3500 },
  ];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
        <XAxis dataKey="day" stroke="#64748B" fontSize={12} />
        <YAxis stroke="#64748B" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E0E0E0',
            borderRadius: '8px',
          }}
        />
        <Bar dataKey="value" fill="#7E57C2" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ResultsBarChart;

