import { X, Play, Save, RotateCcw, Plus, Trash2, Filter, Search, FolderOpen, Bookmark } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../services/api';
import type { UniversalFilterParams, QueryCondition, FilterResult, SavedQuery } from '../services/api';
import type { Coupon, BetType, Discipline } from '../types/coupons';

interface CustomFilterBuilderProps {
  onClose: () => void;
  onApplyFilter?: (results: Coupon[], filterResult: FilterResult) => void;
}

type FilterMode = 'simple' | 'advanced';

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'gt', label: 'Greater Than' },
  { value: 'gte', label: 'Greater or Equal' },
  { value: 'lt', label: 'Less Than' },
  { value: 'lte', label: 'Less or Equal' },
  { value: 'in', label: 'In List' },
  { value: 'not_in', label: 'Not In List' },
];

const FIELDS = [
  { value: 'status', label: 'Coupon Status', type: 'select', options: ['won', 'lost', 'in_progress', 'canceled'] },
  { value: 'coupon_type', label: 'Coupon Type', type: 'select', options: ['SOLO', 'AKO', 'SYSTEM'] },
  { value: 'bets__discipline__code', label: 'Discipline', type: 'discipline' },
  { value: 'bets__bet_type__code', label: 'Bet Type', type: 'betType' },
  { value: 'bets__event_name', label: 'Event Name', type: 'text' },
  { value: 'bets__line', label: 'Line (1/X/2)', type: 'text' },
  { value: 'bets__odds', label: 'Odds', type: 'number' },
  { value: 'bet_stake', label: 'Stake', type: 'number' },
  { value: 'bookmaker_account__bookmaker__name', label: 'Bookmaker', type: 'text' },
  { value: 'created_at', label: 'Created Date', type: 'date' },
];

const FILTER_MODES = [
  { value: 'all', label: 'All Coupons' },
  { value: 'won_coupons', label: 'Won Coupons' },
  { value: 'lost_coupons', label: 'Lost Coupons' },
  { value: 'in_progress_coupons', label: 'In Progress Coupons' },
  { value: 'won_bets', label: 'Won Bets (in any coupon)' },
  { value: 'lost_bets', label: 'Lost Bets (in any coupon)' },
  { value: 'won_bets_lost_coupons', label: 'Won Bets in Lost Coupons' },
  { value: 'all_bets', label: 'All Bets' },
];

const CustomFilterBuilder = ({ onClose, onApplyFilter }: CustomFilterBuilderProps) => {
  const [filterMode, setFilterMode] = useState<FilterMode>('simple');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<FilterResult | null>(null);
  const [betTypes, setBetTypes] = useState<BetType[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);

  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');

  const [simpleFilter, setSimpleFilter] = useState<UniversalFilterParams>({
    filter_mode: 'all',
  });

  const [conditions, setConditions] = useState<QueryCondition[]>([]);
  const [logic, setLogic] = useState<'AND' | 'OR'>('AND');
  const [groupBy, setGroupBy] = useState('');
  const [orderBy, setOrderBy] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [types, discs, queries] = await Promise.all([
          api.getBetTypes(),
          api.getDisciplines(),
          api.getSavedQueries().catch(() => []),
        ]);

        setBetTypes(types);
        setDisciplines(discs);
        setSavedQueries(queries);
        console.log('[CustomFilter] Loaded bet types:', types.length);
        console.log('[CustomFilter] Loaded disciplines:', discs.length);
        console.log('[CustomFilter] Loaded saved queries:', queries.length);
      } catch (error) {
        console.error('[CustomFilter] Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleSimpleFilterChange = (key: keyof UniversalFilterParams, value: string) => {
    setSimpleFilter(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const addCondition = () => {
    setConditions([
      ...conditions,
      { field: 'status', operator: 'equals', value: '' },
    ]);
  };

  const updateCondition = (index: number, updates: Partial<QueryCondition>) => {
    setConditions(conditions.map((c, i) => (i === index ? { ...c, ...updates } : c)));
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const handlePreview = async () => {
    setIsLoading(true);
    try {
      let result: FilterResult;

      if (filterMode === 'simple') {
        const cleanParams = Object.fromEntries(
          Object.entries(simpleFilter).filter(([key, v]) => key && v !== undefined && v !== '')
        ) as UniversalFilterParams;

        console.log('[CustomFilter] Simple filter - sending params:', cleanParams);
        result = await api.filterCouponsUniversal(cleanParams);
        console.log('[CustomFilter] Simple filter - received:', result);
      } else {
        const validConditions = conditions.filter(c => c.value !== '' && c.value !== undefined);
        if (validConditions.length === 0) {
          alert('Please add at least one condition');
          setIsLoading(false);

          return;
        }

        const queryPayload = {
          conditions: validConditions,
          logic,
          group_by: groupBy || undefined,
          order_by: orderBy || undefined,
        };

        console.log('[CustomFilter] Query builder - sending:', queryPayload);
        result = await api.filterCouponsQueryBuilder(queryPayload);
        console.log('[CustomFilter] Query builder - received:', result);
      }

      setResults(result);
    } catch (error) {
      console.error('[CustomFilter] Error filtering:', error);
      alert('Error executing filter');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    const coupons = results?.coupons || results?.results;
    if (coupons && results) {
      onApplyFilter?.(coupons, results);
      onClose();
    }
  };

  const handleSaveQuery = async () => {
    if (!saveName.trim()) {
      alert('Please enter a name for the filter');

      return;
    }

    try {
      const queryData = {
        name: saveName.trim(),
        description: saveDescription.trim() || undefined,
        query_type: filterMode as 'simple' | 'advanced',
        params: filterMode === 'simple' ? simpleFilter : undefined,
        conditions: filterMode === 'advanced' ? conditions : undefined,
        logic: filterMode === 'advanced' ? logic : undefined,
        group_by: filterMode === 'advanced' ? groupBy || undefined : undefined,
        order_by: filterMode === 'advanced' ? orderBy || undefined : undefined,
      };

      console.log('[CustomFilter] Saving query:', queryData);
      const saved = await api.saveQuery(queryData);
      setSavedQueries([...savedQueries, saved]);
      setShowSaveModal(false);
      setSaveName('');
      setSaveDescription('');
      alert('Filter saved successfully!');
    } catch (error) {
      console.error('[CustomFilter] Error saving query:', error);
      alert('Error saving filter');
    }
  };

  const handleLoadQuery = (query: SavedQuery) => {
    console.log('[CustomFilter] Loading query:', query);

    if (query.query_type === 'simple' && query.params) {
      setFilterMode('simple');
      setSimpleFilter(query.params);
    } else if (query.query_type === 'advanced' && query.conditions) {
      setFilterMode('advanced');
      setConditions(query.conditions);
      setLogic(query.logic || 'AND');
      setGroupBy(query.group_by || '');
      setOrderBy(query.order_by || '');
    }

    setShowLoadModal(false);
    setResults(null);
  };

  const handleDeleteQuery = async (id: number) => {
    if (!confirm('Are you sure you want to delete this saved filter?')) {

      return;
    }

    try {
      await api.deleteSavedQuery(id);
      setSavedQueries(savedQueries.filter(q => q.id !== id));
    } catch (error) {
      console.error('[CustomFilter] Error deleting query:', error);
      alert('Error deleting filter');
    }
  };

  const handleReset = () => {
    setSimpleFilter({ filter_mode: 'all' });
    setConditions([]);
    setLogic('AND');
    setGroupBy('');
    setOrderBy('');
    setResults(null);
  };

  const getFieldConfig = (fieldValue: string) => {
    return FIELDS.find(f => f.value === fieldValue);
  };

  const renderValueInput = (condition: QueryCondition, index: number) => {
    const fieldConfig = getFieldConfig(condition.field);

    if (fieldConfig?.type === 'select') {
      return (
        <select
          value={String(condition.value)}
          onChange={e => updateCondition(index, { value: e.target.value })}
          className="flex-1 px-3 py-2 border border-default rounded-md text-sm"
        >
          <option value="">Select...</option>
          {fieldConfig.options?.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }

    if (fieldConfig?.type === 'betType') {
      return (
        <select
          value={String(condition.value)}
          onChange={e => updateCondition(index, { value: e.target.value })}
          className="flex-1 px-3 py-2 border border-default rounded-md text-sm"
        >
          <option value="">Select bet type...</option>
          {betTypes.map(bt => (
            <option key={bt.id || bt.code} value={bt.code}>{bt.description || bt.code}</option>
          ))}
        </select>
      );
    }

    if (fieldConfig?.type === 'discipline') {
      return (
        <select
          value={String(condition.value)}
          onChange={e => updateCondition(index, { value: e.target.value })}
          className="flex-1 px-3 py-2 border border-default rounded-md text-sm"
        >
          <option value="">Select discipline...</option>
          {disciplines.map(d => (
            <option key={d.id} value={d.code}>{d.name || d.code}</option>
          ))}
        </select>
      );
    }

    if (fieldConfig?.type === 'number') {
      return (
        <input
          type="number"
          step="0.01"
          value={String(condition.value)}
          onChange={e => updateCondition(index, { value: parseFloat(e.target.value) || e.target.value })}
          placeholder="Value"
          className="flex-1 px-3 py-2 border border-default rounded-md text-sm"
        />
      );
    }

    if (fieldConfig?.type === 'date') {
      return (
        <input
          type="date"
          value={String(condition.value)}
          onChange={e => updateCondition(index, { value: e.target.value })}
          className="flex-1 px-3 py-2 border border-default rounded-md text-sm"
        />
      );
    }

    return (
      <input
        type="text"
        value={String(condition.value)}
        onChange={e => updateCondition(index, { value: e.target.value })}
        placeholder="Value"
        className="flex-1 px-3 py-2 border border-default rounded-md text-sm"
      />
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      {/* Hide sidebar when modal is open */}
      <style>{`
        .sidebar-container { display: none !important; }
        main { margin-left: 0 !important; }
      `}</style>
      <div className="bg-background-paper w-full max-w-[95vw] lg:max-w-[1100px] h-[90vh] rounded-xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-default">
          <div className="flex items-center gap-4">
            <Filter size={24} className="text-primary-main" />
            <h2 className="text-xl font-bold text-text-primary">Custom Filter Builder</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLoadModal(true)}
              className="flex items-center gap-2 px-3 py-2 border border-default rounded-lg text-text-secondary hover:bg-gray-100"
            >
              <FolderOpen size={18} />
              Load Filter
            </button>
            <button
              onClick={() => setShowSaveModal(true)}
              disabled={!results}
              className="flex items-center gap-2 px-3 py-2 border border-default rounded-lg text-text-secondary hover:bg-gray-100 disabled:opacity-50"
            >
              <Bookmark size={18} />
              Save Filter
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={24} className="text-text-secondary" />
            </button>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 p-4 border-b border-default bg-gray-50">
          <button
            onClick={() => setFilterMode('simple')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterMode === 'simple'
                ? 'bg-primary-main text-white'
                : 'bg-white border border-default text-text-primary hover:bg-gray-100'
            }`}
          >
            Simple Filter
          </button>
          <button
            onClick={() => setFilterMode('advanced')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterMode === 'advanced'
                ? 'bg-primary-main text-white'
                : 'bg-white border border-default text-text-primary hover:bg-gray-100'
            }`}
          >
            Query Builder
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Filter Panel */}
          <div className="flex-1 overflow-y-auto p-6">
            {filterMode === 'simple' ? (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-text-primary">Simple Filter</h3>
                <p className="text-sm text-text-secondary">
                  Use simple filters for quick searches like "Barcelona away wins" or "BTTS won bets".
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Filter Mode</label>
                    <select
                      value={simpleFilter.filter_mode || 'all'}
                      onChange={e => handleSimpleFilterChange('filter_mode', e.target.value)}
                      className="w-full px-3 py-2 border border-default rounded-md text-sm"
                    >
                      {FILTER_MODES.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Team Name</label>
                    <input
                      type="text"
                      value={simpleFilter.team_name || ''}
                      onChange={e => handleSimpleFilterChange('team_name', e.target.value)}
                      placeholder="e.g. Barcelona, Real Madrid"
                      className="w-full px-3 py-2 border border-default rounded-md text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Position</label>
                    <select
                      value={simpleFilter.position || ''}
                      onChange={e => handleSimpleFilterChange('position', e.target.value as 'home' | 'away')}
                      className="w-full px-3 py-2 border border-default rounded-md text-sm"
                    >
                      <option value="">Any</option>
                      <option value="home">Home</option>
                      <option value="away">Away</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Bet Type</label>
                    <select
                      value={simpleFilter.bet_type_code || ''}
                      onChange={e => handleSimpleFilterChange('bet_type_code', e.target.value)}
                      className="w-full px-3 py-2 border border-default rounded-md text-sm"
                    >
                      <option value="">Any</option>
                      {betTypes.map(bt => (
                        <option key={bt.id || bt.code} value={bt.code}>{bt.description || bt.code}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Discipline</label>
                    <select
                      value={simpleFilter.discipline || ''}
                      onChange={e => handleSimpleFilterChange('discipline', e.target.value)}
                      className="w-full px-3 py-2 border border-default rounded-md text-sm"
                    >
                      <option value="">Any</option>
                      {disciplines.map(d => (
                        <option key={d.id} value={d.code}>{d.name || d.code}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Coupon Type</label>
                    <select
                      value={simpleFilter.coupon_type || ''}
                      onChange={e => handleSimpleFilterChange('coupon_type', e.target.value)}
                      className="w-full px-3 py-2 border border-default rounded-md text-sm"
                    >
                      <option value="">Any</option>
                      <option value="SOLO">Solo</option>
                      <option value="AKO">AKO</option>
                      <option value="SYSTEM">System</option>
                    </select>
                  </div>


                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Date From</label>
                    <input
                      type="date"
                      value={simpleFilter.date_from || ''}
                      onChange={e => handleSimpleFilterChange('date_from', e.target.value)}
                      className="w-full px-3 py-2 border border-default rounded-md text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Date To</label>
                    <input
                      type="date"
                      value={simpleFilter.date_to || ''}
                      onChange={e => handleSimpleFilterChange('date_to', e.target.value)}
                      className="w-full px-3 py-2 border border-default rounded-md text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Min Odds</label>
                    <input
                      type="number"
                      step="0.01"
                      value={simpleFilter.min_odds || ''}
                      onChange={e => handleSimpleFilterChange('min_odds', e.target.value)}
                      placeholder="1.50"
                      className="w-full px-3 py-2 border border-default rounded-md text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Max Odds</label>
                    <input
                      type="number"
                      step="0.01"
                      value={simpleFilter.max_odds || ''}
                      onChange={e => handleSimpleFilterChange('max_odds', e.target.value)}
                      placeholder="5.00"
                      className="w-full px-3 py-2 border border-default rounded-md text-sm"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-text-primary">Query Builder</h3>
                <p className="text-sm text-text-secondary">
                  Build complex queries with multiple conditions combined with AND/OR logic.
                </p>

                {/* Logic Toggle */}
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-text-secondary">Combine with:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setLogic('AND')}
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        logic === 'AND'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      AND
                    </button>
                    <button
                      onClick={() => setLogic('OR')}
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        logic === 'OR'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      OR
                    </button>
                  </div>
                </div>

                {/* Conditions */}
                <div className="space-y-3">
                  {conditions.map((condition, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-white border border-default rounded-lg"
                    >
                      {index > 0 && (
                        <div className={`px-2 py-1 rounded text-xs font-bold ${
                          logic === 'AND' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                        }`}>
                          {logic}
                        </div>
                      )}

                      <select
                        value={condition.field}
                        onChange={e => updateCondition(index, { field: e.target.value })}
                        className="w-48 px-3 py-2 border border-default rounded-md text-sm"
                      >
                        {FIELDS.map(f => (
                          <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                      </select>

                      <select
                        value={condition.operator}
                        onChange={e => updateCondition(index, { operator: e.target.value as QueryCondition['operator'] })}
                        className="w-40 px-3 py-2 border border-default rounded-md text-sm"
                      >
                        {OPERATORS.map(op => (
                          <option key={op.value} value={op.value}>{op.label}</option>
                        ))}
                      </select>

                      {renderValueInput(condition, index)}

                      <button
                        onClick={() => removeCondition(index)}
                        className="p-2 hover:bg-red-50 rounded text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={addCondition}
                  className="flex items-center gap-2 px-4 py-2 border border-dashed border-default rounded-lg text-text-secondary hover:bg-gray-50"
                >
                  <Plus size={16} />
                  Add Condition
                </button>

                {/* Grouping & Sorting */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-default">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Group By</label>
                    <select
                      value={groupBy}
                      onChange={e => setGroupBy(e.target.value)}
                      className="w-full px-3 py-2 border border-default rounded-md text-sm"
                    >
                      <option value="">None</option>
                      <option value="status">Status</option>
                      <option value="coupon_type">Coupon Type</option>
                      <option value="bookmaker">Bookmaker</option>
                      <option value="date">Date</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Order By</label>
                    <select
                      value={orderBy}
                      onChange={e => setOrderBy(e.target.value)}
                      className="w-full px-3 py-2 border border-default rounded-md text-sm"
                    >
                      <option value="">Default</option>
                      <option value="created_at">Date (Newest)</option>
                      <option value="-created_at">Date (Oldest)</option>
                      <option value="bet_stake">Stake (Lowest)</option>
                      <option value="-bet_stake">Stake (Highest)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Results Panel */}
          <div className="w-[350px] border-l border-default overflow-y-auto bg-gray-50 p-4">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Results Preview</h3>

            {results ? (
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-default">
                  <div className="text-3xl font-bold text-text-primary">{results.count}</div>
                  <div className="text-sm text-text-secondary">Coupons Found</div>
                </div>

                {/* Stats from backend response */}
                <div className="grid grid-cols-2 gap-3">
                  {results.total_stake && (
                    <div className="bg-white rounded-lg p-3 border border-default">
                      <div className="text-lg font-semibold text-text-primary">
                        ${parseFloat(results.total_stake).toFixed(2)}
                      </div>
                      <div className="text-xs text-text-secondary">Total Stake</div>
                    </div>
                  )}
                  {results.profit && (
                    <div className="bg-white rounded-lg p-3 border border-default">
                      <div className={`text-lg font-semibold ${
                        parseFloat(results.profit) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ${parseFloat(results.profit).toFixed(2)}
                      </div>
                      <div className="text-xs text-text-secondary">Profit</div>
                    </div>
                  )}
                  {results.win_rate !== undefined && (
                    <div className="bg-white rounded-lg p-3 border border-default">
                      <div className="text-lg font-semibold text-text-primary">
                        {results.win_rate.toFixed(1)}%
                      </div>
                      <div className="text-xs text-text-secondary">Win Rate</div>
                    </div>
                  )}
                  {results.roi !== undefined && (
                    <div className="bg-white rounded-lg p-3 border border-default">
                      <div className={`text-lg font-semibold ${
                        results.roi >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {results.roi.toFixed(2)}%
                      </div>
                      <div className="text-xs text-text-secondary">ROI</div>
                    </div>
                  )}
                  {results.won_count !== undefined && (
                    <div className="bg-white rounded-lg p-3 border border-default">
                      <div className="text-lg font-semibold text-green-600">
                        {results.won_count}
                      </div>
                      <div className="text-xs text-text-secondary">Won</div>
                    </div>
                  )}
                  {results.lost_count !== undefined && (
                    <div className="bg-white rounded-lg p-3 border border-default">
                      <div className="text-lg font-semibold text-red-600">
                        {results.lost_count}
                      </div>
                      <div className="text-xs text-text-secondary">Lost</div>
                    </div>
                  )}
                </div>

                {/* Sample coupons */}
                {((results.coupons && results.coupons.length > 0) || (results.results && results.results.length > 0)) && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-text-secondary mb-2">Sample Results</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {(results.coupons || results.results || []).slice(0, 5).map(coupon => (
                        <div key={coupon.id} className="bg-white rounded p-2 border border-default text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium">{coupon.bookmaker}</span>
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              coupon.status === 'won' ? 'bg-green-100 text-green-800' :
                              coupon.status === 'lost' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {coupon.status}
                            </span>
                          </div>
                          <div className="text-text-secondary text-xs mt-1">
                            Stake: {coupon.bet_stake} | Type: {coupon.coupon_type}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-text-secondary py-8">
                <Search size={48} className="mx-auto mb-4 opacity-30" />
                <p>Click "Preview Results" to see matching coupons</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-default bg-gray-50">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 border border-default rounded-lg text-text-secondary hover:bg-white"
          >
            <RotateCcw size={16} />
            Reset
          </button>

          <div className="flex gap-3">
            <button
              onClick={handlePreview}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-default rounded-lg text-text-primary hover:bg-gray-50 disabled:opacity-50"
            >
              <Play size={16} />
              {isLoading ? 'Loading...' : 'Preview Results'}
            </button>
            <button
              onClick={handleApply}
              disabled={!(results?.coupons?.length || results?.results?.length)}
              className="flex items-center gap-2 px-6 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
            >
              <Save size={16} />
              Apply Filter
            </button>
          </div>
        </div>
      </div>

      {/* Load Filter Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4">
          <div className="bg-background-paper w-full max-w-md rounded-xl shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-default">
              <h3 className="text-lg font-semibold text-text-primary">Load Saved Filter</h3>
              <button onClick={() => setShowLoadModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} className="text-text-secondary" />
              </button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              {savedQueries.length === 0 ? (
                <div className="text-center text-text-secondary py-8">
                  <FolderOpen size={48} className="mx-auto mb-4 opacity-30" />
                  <p>No saved filters yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {savedQueries.map(query => (
                    <div
                      key={query.id}
                      className="flex items-center justify-between p-3 border border-default rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1 cursor-pointer" onClick={() => handleLoadQuery(query)}>
                        <div className="font-medium text-text-primary">{query.name}</div>
                        {query.description && (
                          <div className="text-sm text-text-secondary">{query.description}</div>
                        )}
                        <div className="text-xs text-text-secondary mt-1">
                          {query.query_type === 'simple' ? 'Simple Filter' : 'Query Builder'}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteQuery(query.id)}
                        className="p-2 hover:bg-red-50 rounded text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Save Filter Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4">
          <div className="bg-background-paper w-full max-w-md rounded-xl shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-default">
              <h3 className="text-lg font-semibold text-text-primary">Save Filter</h3>
              <button onClick={() => setShowSaveModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} className="text-text-secondary" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Filter Name *</label>
                <input
                  type="text"
                  value={saveName}
                  onChange={e => setSaveName(e.target.value)}
                  placeholder="e.g. Barcelona Away Wins"
                  className="w-full px-3 py-2 border border-default rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Description (optional)</label>
                <textarea
                  value={saveDescription}
                  onChange={e => setSaveDescription(e.target.value)}
                  placeholder="Describe what this filter does..."
                  rows={3}
                  className="w-full px-3 py-2 border border-default rounded-md text-sm resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-default">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 border border-default rounded-lg text-text-secondary hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveQuery}
                className="px-4 py-2 bg-primary-main text-white rounded-lg hover:bg-primary-dark"
              >
                Save Filter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomFilterBuilder;

