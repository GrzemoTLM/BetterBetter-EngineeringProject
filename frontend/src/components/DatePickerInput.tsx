import React, { useRef, useState, useEffect } from 'react';
import { useDateFormatter } from '../hooks/useDateFormatter';

interface DatePickerInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const DatePickerInput: React.FC<DatePickerInputProps> = ({
  value,
  onChange,
  placeholder = 'Select date'
}) => {
  const { formatDateWithoutTime } = useDateFormatter();
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    if (value) {
      setDisplayValue(formatDateWithoutTime(value));
    } else {
      setDisplayValue('');
    }
  }, [value, formatDateWithoutTime]);

  const handleClick = () => {
    dateInputRef.current?.showPicker?.();
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <input
        type="text"
        value={displayValue}
        onClick={handleClick}
        readOnly
        placeholder={placeholder}
        style={{
          padding: '6px 8px',
          borderRadius: '4px',
          border: '1px solid #ccc',
          cursor: 'pointer',
          fontSize: '14px',
          minWidth: '150px',
          maxWidth: '180px',
          backgroundColor: 'white'
        }}
      />
      <input
        ref={dateInputRef}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          opacity: 0,
          cursor: 'pointer',
          zIndex: -1
        }}
      />
    </div>
  );
};

