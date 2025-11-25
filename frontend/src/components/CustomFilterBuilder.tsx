import { X } from 'lucide-react';
import FieldPalette from './FieldPalette';
import QueryCanvas from './QueryCanvas';
import PreviewPane from './PreviewPane';

interface CustomFilterBuilderProps {
  onClose: () => void;
}

const CustomFilterBuilder = ({ onClose }: CustomFilterBuilderProps) => {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background-page w-full max-w-[1600px] h-[90vh] rounded-xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-default">
          <h2 className="text-2xl font-bold text-text-primary">
            Create Custom Filter
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-background-table-header rounded-lg transition-colors"
          >
            <X size={24} className="text-text-secondary" />
          </button>
        </div>

        {/* Main Content - 3 Columns */}
        <div className="flex-1 flex overflow-hidden">
          {/* Column 1: Field Palette */}
          <div className="w-[240px] border-r border-default overflow-y-auto bg-background-panel">
            <FieldPalette />
          </div>

          {/* Column 2: Query Canvas */}
          <div className="flex-1 overflow-y-auto bg-background-canvas">
            <QueryCanvas />
          </div>

          {/* Column 3: Preview Pane */}
          <div className="w-[300px] border-l border-default overflow-y-auto bg-background-panel">
            <PreviewPane />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomFilterBuilder;

