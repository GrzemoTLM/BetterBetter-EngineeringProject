import { ChevronDown, Calendar } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface DropdownProps {
  label: string;
  options: string[];
}

const Dropdown = ({ label, options }: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(options[0]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-background-paper border border-border-light rounded-sm px-3 py-2 text-sm text-text-primary flex items-center justify-between min-w-[120px] hover:border-border-medium transition-colors"
      >
        <span>{selected || label}</span>
        <ChevronDown size={16} className="ml-2" />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-background-paper border border-border-light rounded-sm shadow-dropdown z-10">
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => {
                setSelected(option);
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-background-table-header transition-colors"
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

interface DatePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const DatePicker = ({ label, value, onChange }: DatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const displayValue = value
    ? new Date(value).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : label;

  return (
    <div className="relative" ref={datePickerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-background-paper border border-border-light rounded-sm px-3 py-2 text-sm flex items-center justify-between min-w-[120px] hover:border-border-medium transition-colors"
      >
        <span className={value ? 'text-text-primary' : 'text-text-secondary'}>
          {displayValue}
        </span>
        <Calendar size={16} className="ml-2 text-text-secondary" />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 z-10 bg-background-paper border border-border-light rounded-sm shadow-dropdown p-2">
          <input
            type="date"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setIsOpen(false);
            }}
            className="w-full px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-main focus:border-transparent border border-default rounded"
            autoFocus
          />
        </div>
      )}
    </div>
  );
};

interface FilterBarProps {
  filters: {
    date_from?: string;
    date_to?: string;
    bookmaker?: string;
    transaction_type?: string;
  };
  onFiltersChange: (filters: {
    date_from?: string;
    date_to?: string;
    bookmaker?: string;
    transaction_type?: string;
  }) => void;
  onClearFilters: () => void;
  uniqueBookmakers: string[];
}

const FilterBar = ({ filters, onFiltersChange, onClearFilters, uniqueBookmakers }: FilterBarProps) => {
  const [startDate, setStartDate] = useState(filters.date_from || '');
  const [endDate, setEndDate] = useState(filters.date_to || '');
  const [selectedBookmaker, setSelectedBookmaker] = useState(filters.bookmaker || '');
  const [selectedTransactionType, setSelectedTransactionType] = useState(filters.transaction_type || '');

  // Sync local state with props
  useEffect(() => {
    setStartDate(filters.date_from || '');
    setEndDate(filters.date_to || '');
    setSelectedBookmaker(filters.bookmaker || '');
    setSelectedTransactionType(filters.transaction_type || '');
  }, [filters]);

  const handleApplyFilters = () => {
    const newFilters: typeof filters = {};
    if (startDate) newFilters.date_from = startDate;
    if (endDate) newFilters.date_to = endDate;
    if (selectedBookmaker) newFilters.bookmaker = selectedBookmaker;
    if (selectedTransactionType) newFilters.transaction_type = selectedTransactionType;
    onFiltersChange(newFilters);
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    setSelectedBookmaker('');
    setSelectedTransactionType('');
    onClearFilters();
  };

  const bookmakerOptions = ['All', ...uniqueBookmakers];
  const transactionTypeOptions = ['All', 'DEPOSIT', 'WITHDRAWAL'];

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Date Range - Start Date */}
      <DatePicker
        label="Start Date"
        value={startDate}
        onChange={setStartDate}
      />

      {/* Date Range - End Date */}
      <DatePicker label="End Date" value={endDate} onChange={setEndDate} />

      {/* Bookmaker Filter */}
      <div className="relative">
        <select
          value={selectedBookmaker}
          onChange={(e) => setSelectedBookmaker(e.target.value)}
          className="bg-background-paper border border-border-light rounded-sm px-3 py-2 text-sm text-text-primary min-w-[120px] hover:border-border-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-main"
        >
          {bookmakerOptions.map((bm) => (
            <option key={bm} value={bm === 'All' ? '' : bm}>
              {bm}
            </option>
          ))}
        </select>
      </div>

      {/* Transaction Type Filter */}
      <div className="relative">
        <select
          value={selectedTransactionType}
          onChange={(e) => setSelectedTransactionType(e.target.value)}
          className="bg-background-paper border border-border-light rounded-sm px-3 py-2 text-sm text-text-primary min-w-[120px] hover:border-border-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-main"
        >
          {transactionTypeOptions.map((type) => (
            <option key={type} value={type === 'All' ? '' : type}>
              {type === 'All' ? 'All' : type === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'}
            </option>
          ))}
        </select>
      </div>

      {/* Apply Button */}
      <button
        onClick={handleApplyFilters}
        className="bg-primary-main text-primary-contrast px-5 py-2 rounded-md font-medium text-base cursor-pointer border-none shadow-button hover:bg-primary-dark transition-all duration-200"
      >
        Apply filters
      </button>

      {/* Clear Button */}
      <button
        onClick={handleClear}
        className="bg-background-table-header text-text-primary px-5 py-2 rounded-md font-medium text-base cursor-pointer border border-border-light hover:bg-background-page transition-all duration-200"
      >
        Clear filters
      </button>
    </div>
  );
};

export default FilterBar;

