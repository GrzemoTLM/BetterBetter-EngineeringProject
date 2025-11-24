import {
  Play,
  Save,
  RotateCcw,
  Share2,
  Plus,
  FolderOpen,
} from 'lucide-react';
import { useState } from 'react';

interface QueryRow {
  id: string;
  logic: 'AND' | 'OR';
  condition: string;
}

const QueryCanvas = () => {
  const [queryRows, setQueryRows] = useState<QueryRow[]>([
    { id: '1', logic: 'AND', condition: 'Sport is Football' },
    { id: '2', logic: 'OR', condition: 'Market-type is Over/Under' },
    { id: '3', logic: 'OR', condition: '= 2.5' },
    { id: '4', logic: 'OR', condition: 'Outcome status is Lost' },
    { id: '5', logic: 'OR', condition: 'Cashout used is true' },
  ]);

  const [groupBy, setGroupBy] = useState('Ada');
  const [sortBy, setSortBy] = useState('');

  return (
    <div className="p-6">
      {/* Toolbar */}
      <div className="flex gap-2 mb-6 border-b border-default pb-4">
        <button className="bg-white border border-default text-text-primary rounded-md px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors">
          <Play size={16} />
          Preview results
        </button>
        <button className="bg-primary-main text-primary-contrast rounded-md px-4 py-2 text-sm hover:bg-primary-hover flex items-center gap-2 transition-colors">
          <Save size={16} />
          Save filter
        </button>
        <button className="bg-white border border-default text-text-primary rounded-md px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors">
          <RotateCcw size={16} />
          Reset
        </button>
        <button className="bg-white border border-default text-text-primary rounded-md px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors">
          <FolderOpen size={16} />
          Load preset
        </button>
        <button className="bg-white border border-default text-text-primary rounded-md px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors">
          <Share2 size={16} />
          Share
        </button>
      </div>

      {/* Query Builder Area */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Query Builder
        </h3>

        {/* Query Rows */}
        <div className="space-y-3">
          {queryRows.map((row, index) => (
            <div
              key={row.id}
              className="flex items-center gap-3 p-3 bg-white border border-default rounded-lg shadow-sm group hover:border-blue-300 transition-colors"
            >
              {/* Logic Badge */}
              <div
                className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                  row.logic === 'AND'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {row.logic}
              </div>

              {/* Condition */}
              <div className="flex-1 text-sm text-text-primary">
                {row.condition}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <button className="bg-white border border-default text-text-primary rounded-md px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors">
            <Plus size={16} />
            Add condition
          </button>
          <button className="bg-white border border-default text-text-primary rounded-md px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors">
            <Plus size={16} />
            Add group
          </button>
        </div>
      </div>

      {/* Footer: Grouping & Aggregations */}
      <div className="border-t border-default pt-4">
        <h4 className="text-sm font-semibold text-text-primary mb-3">
          Grouping & Aggregations
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-text-secondary mb-1">
              Group by
            </label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="w-full px-3 py-2 border border-default rounded-md text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-main focus:border-transparent"
            >
              <option>Ada</option>
              <option>Date</option>
              <option>Bookmaker</option>
              <option>Status</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-secondary mb-1">
              Sort by
            </label>
            <input
              type="text"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              placeholder="Enter sort field"
              className="w-full px-3 py-2 border border-default rounded-md text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-main focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueryCanvas;

