import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import api from '../services/api';
import type { Coupon } from '../types/coupons';

interface PieSlice {
  name: string;
  value: number;
  color: string;
}

const STATUS_COLORS: Record<string, string> = {
  won: '#10B981',
  lost: '#EF4444',
  in_progress: '#F59E0B',
  cashed_out: '#2A4B8D',
  other: '#9CA3AF',
};

const CouponsPieChart = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getCoupons();
        setCoupons(data || []);
      } catch (err) {
        console.error('[CouponsPieChart] Failed to fetch coupons:', err);
        setError('Failed to load coupons');
      } finally {
        setLoading(false);
      }
    };

    fetchCoupons();
  }, []);

  const totalCount = coupons.length;

  const rawCounts: Record<string, number> = coupons.reduce(
    (acc, coupon) => {
      const status = (coupon.status as string) || 'other';

      if (status === 'won' || status === 'lost' || status === 'in_progress' || status === 'cashed_out') {
        acc[status] = (acc[status] || 0) + 1;
      } else {
        acc.other = (acc.other || 0) + 1;
      }

      return acc;
    },
    { won: 0, lost: 0, in_progress: 0, cashed_out: 0, other: 0 } as Record<string, number>
  );

  const pieData: PieSlice[] = Object.entries(rawCounts)
    .filter(([, count]) => count > 0 && totalCount > 0)
    .map(([key, count]) => ({
      name:
        key === 'won'
          ? 'Won'
          : key === 'lost'
          ? 'Lost'
          : key === 'in_progress'
          ? 'In progress'
          : key === 'cashed_out'
          ? 'Cashed out'
          : 'Other',
      value: (count / totalCount) * 100,
      color: STATUS_COLORS[key] || STATUS_COLORS.other,
    }));

  interface LabelProps {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
  }

  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: LabelProps) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (loading) {
    return <div className="text-sm text-text-secondary">Loading coupon stats...</div>;
  }

  if (error) {
    return <div className="text-sm text-status-error">{error}</div>;
  }

  if (!totalCount || pieData.length === 0) {
    return <div className="text-sm text-text-secondary">No coupons yet</div>;
  }

  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width="60%" height={200}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={80}
            dataKey="value"
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, _name, props) => {
              const label = String(props?.payload?.name ?? '');
              const statusKey =
                label === 'Won'
                  ? 'won'
                  : label === 'Lost'
                  ? 'lost'
                  : label === 'In progress'
                  ? 'in_progress'
                  : label === 'Cashed out'
                  ? 'cashed_out'
                  : 'other';
              const count = rawCounts[statusKey] ?? 0;
              const percent = typeof value === 'number' ? value.toFixed(1) : value;
              return [`${percent}% (${count} coupons)`, label];
            }}
            contentStyle={{ fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex-1 space-y-2">
        {pieData.map((item, index) => (
          <div key={index} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-text-secondary">{item.name}</span>
            </div>
            <span className="text-xs font-medium text-text-primary">
              {item.value.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CouponsPieChart;
