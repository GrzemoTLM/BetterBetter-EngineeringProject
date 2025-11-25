interface SettingsRowProps {
  label: string;
  value?: string;
  control?: React.ReactNode;
  action?: string;
  onActionClick?: () => void;
}

const SettingsRow = ({ label, value, control, action, onActionClick }: SettingsRowProps) => {
  return (
    <div className="flex items-center justify-between px-8 py-6 hover:bg-gray-50 transition-colors">
      <div className="flex-1 min-w-0">
        <span className="text-base text-text-primary font-medium">{label}</span>
      </div>
      <div className="flex-1 flex justify-center items-center">
        {value && (
          <span className="text-base text-text-secondary">{value}</span>
        )}
        {control && <div className="flex items-center">{control}</div>}
      </div>
      {action ? (
        <div className="flex-1 flex justify-end">
          <button
            onClick={onActionClick}
            className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer text-sm transition-colors"
          >
            {action}
          </button>
        </div>
      ) : (
        <div className="flex-1" />
      )}
    </div>
  );
};

export default SettingsRow;

