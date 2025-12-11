import { FileJson } from 'lucide-react';
import { useState } from 'react';

const FieldPalette = () => {
  const [selectedField, setSelectedField] = useState<string | null>(null);

  const fields = [
    'Bet basics',
    'Ticket properties',
    'Odds & lines',
    'Analytics',
    'Context',
    'User meta',
  ];

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-text-primary mb-4">
        Field palette
      </h3>

      {/* Field List */}
      <div className="space-y-1 mb-6">
        {fields.map((field, index) => (
          <div
            key={index}
            onClick={() => setSelectedField(field)}
            className={`px-4 py-3 text-sm font-medium text-text-primary hover:bg-gray-50 cursor-pointer border-l-2 transition-colors ${
              selectedField === field
                ? 'border-primary-main bg-blue-50'
                : 'border-transparent'
            }`}
          >
            {field}
          </div>
        ))}
      </div>

      {/* Grouping & Aggregations */}
      <div className="border-t border-default pt-4">
        <h4 className="text-sm font-semibold text-text-primary mb-3">
          Grouping & Aggregations
        </h4>
        <input
          type="text"
          placeholder="Sort"
          className="w-full px-3 py-2 border border-default rounded-md text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-main focus:border-transparent mb-3"
        />
        <button className="w-full border border-default text-text-primary rounded-md px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors">
          <FileJson size={16} />
          Export from JSON
        </button>
      </div>
    </div>
  );
};

export default FieldPalette;

