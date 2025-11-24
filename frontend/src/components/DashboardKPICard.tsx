interface DashboardKPICardProps {
  label: string;
  value: string;
  valueColor?: string;
}

const DashboardKPICard = ({
  label,
  value,
  valueColor = 'text-text-primary',
}: DashboardKPICardProps) => {
  return (
    <div className="bg-background-paper rounded-xl p-6 shadow-sm">
      <div className="text-sm font-medium text-text-secondary mb-2">
        {label}
      </div>
      <div className={`text-3xl font-bold ${valueColor}`}>{value}</div>
    </div>
  );
};

export default DashboardKPICard;

