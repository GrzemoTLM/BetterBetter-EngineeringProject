import { useState } from 'react';

const PreviewPane = () => {
  const [activeTab, setActiveTab] = useState<'summary' | 'data' | 'groups'>(
    'summary'
  );
  const [xAxis, setXAxis] = useState('');
  const [yAxis, setYAxis] = useState('');
  const [yAxisSecondary, setYAxisSecondary] = useState('');
  const [splitBy, setSplitBy] = useState('');

  const tabs = [
    { id: 'summary' as const, label: 'Summary' },
    { id: 'data' as const, label: 'Data' },
    { id: 'groups' as const, label: 'Groups' },
  ];

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-text-primary mb-4">
        Preview Pane
      </h3>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-primary-main shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Metrics */}
      <div className="mb-6">
        <div className="flex gap-4 text-sm">
          <div>
            <span className="text-text-secondary">Count: </span>
            <span className="font-semibold text-text-primary">1,234</span>
          </div>
          <div>
            <span className="text-text-secondary">Yield: </span>
            <span className="font-semibold text-text-primary">+12.5%</span>
          </div>
          <div>
            <span className="text-text-secondary">ROI: </span>
            <span className="font-semibold text-status-roi-positive">
              +8.3%
            </span>
          </div>
        </div>
      </div>

      {/* Chart Configuration */}
      <div className="border-t border-default pt-4">
        <h4 className="text-sm font-semibold text-text-primary mb-4">
          Chart type
        </h4>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-text-secondary mb-1">
              X-axis
            </label>
            <input
              type="text"
              value={xAxis}
              onChange={(e) => setXAxis(e.target.value)}
              placeholder="Select field"
              className="w-full px-3 py-2 border border-default rounded-md text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-main focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1">
              Y-axis
            </label>
            <input
              type="text"
              value={yAxis}
              onChange={(e) => setYAxis(e.target.value)}
              placeholder="Select field"
              className="w-full px-3 py-2 border border-default rounded-md text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-main focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1">
              Y-axis (secondary)
            </label>
            <input
              type="text"
              value={yAxisSecondary}
              onChange={(e) => setYAxisSecondary(e.target.value)}
              placeholder="Select field"
              className="w-full px-3 py-2 border border-default rounded-md text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-main focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1">
              Split by
            </label>
            <input
              type="text"
              value={splitBy}
              onChange={(e) => setSplitBy(e.target.value)}
              placeholder="Select field"
              className="w-full px-3 py-2 border border-default rounded-md text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-main focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Footer: Raw Query Button */}
      <div className="mt-6 pt-4 border-t border-default">
        <button className="w-full bg-white border border-default text-text-primary rounded-md px-4 py-2 text-sm hover:bg-gray-50 transition-colors">
          Raw query
        </button>
      </div>
    </div>
  );
};

export default PreviewPane;

