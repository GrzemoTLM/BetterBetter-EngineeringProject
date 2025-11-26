import { Bell, Search, Plus } from 'lucide-react';
import { useState, useRef } from 'react';
import CouponsTable, { type CouponsTableRef } from './CouponsTable';
import ActionBar from './ActionBar';
import AddCoupon from './AddCoupon';
import ManageStrategiesModal from './ManageStrategiesModal';
import type { Strategy } from '../types/strategies';
import api from '../services/api';

const Coupons = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddCoupon, setShowAddCoupon] = useState(false);
  const [showManageStrategies, setShowManageStrategies] = useState(false);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const couponsTableRef = useRef<CouponsTableRef>(null);

  const handleCouponCreated = () => {
    if (couponsTableRef.current) {
      couponsTableRef.current.refetch();
    }
  };

  const handleToggleBulk = () => {
    if (!bulkMode) {
      setBulkMode(true);
      return;
    }

    if (bulkMode && selectedIds.size === 0) {
      setBulkMode(false);
      return;
    }

    const proceed = window.confirm(`Usunąć ${selectedIds.size} kuponów?`);
    if (!proceed) return;

    (async () => {
      for (const id of selectedIds) {
        await api.deleteCoupon(id);
      }

      setSelectedIds(new Set());
      setBulkMode(false);
      if (couponsTableRef.current) {
        await couponsTableRef.current.refetch();
      }
    })();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-text-primary">Coupons</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddCoupon(true)}
            className="bg-primary-main text-primary-contrast rounded-lg px-6 py-2 shadow-sm hover:bg-primary-hover transition-colors flex items-center gap-2 font-medium"
          >
            <Plus size={18} />
            Add new coupon
          </button>
          <button className="p-2 hover:bg-background-table-header rounded-lg transition-colors">
            <Bell size={24} className="text-text-secondary" />
          </button>
        </div>
      </div>

      {/* Main Card with Filters and Table */}
      <div className="bg-background-paper rounded-xl shadow-sm">
        {/* Filter Section */}
        <div className="p-6 border-b border-default">
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            ALL COUPONS
          </h2>
          <div className="flex flex-wrap items-center gap-4">

            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search
                size={16}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-secondary"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="search by date"
                className="w-full pl-10 pr-4 py-1 border border-default rounded-full text-sm bg-gray-50 text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-main focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <CouponsTable ref={couponsTableRef} bulkMode={bulkMode} selectedIds={selectedIds} onToggleSelect={(id) => {
          setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
          });
        }} />

        {/* Action Bar */}
        <div className="p-6 border-t border-default">
          <ActionBar onManageStrategies={() => setShowManageStrategies(true)} onBulkDelete={handleToggleBulk} bulkMode={bulkMode} selectedCount={selectedIds.size} />
        </div>
      </div>

      {/* Add Coupon Modal */}
      {showAddCoupon && (
        <AddCoupon
          onClose={() => setShowAddCoupon(false)}
          strategies={strategies}
          onCouponCreated={handleCouponCreated}
        />
      )}

      {/* Manage Strategies Modal */}
      {showManageStrategies && (
        <ManageStrategiesModal
          onClose={() => setShowManageStrategies(false)}
          onStrategiesChange={setStrategies}
        />
      )}
    </div>
  );
};

export default Coupons;
