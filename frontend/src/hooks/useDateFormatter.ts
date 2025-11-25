import { useCallback, useContext } from 'react';
import { DateFormatContext } from '../context/DateFormatContext';
import { formatDateByUserSettings, formatDateOnly } from '../utils/dateFormatter';

export const useDateFormatter = () => {
  const context = useContext(DateFormatContext);

  if (context === undefined) {
    throw new Error('useDateFormatter musi być używany wewnątrz DateFormatProvider');
  }

  const { dateFormat } = context;

  const formatDate = useCallback(
    (dateString: string, includeTime: boolean = true) => {
      return formatDateByUserSettings(dateString, dateFormat, includeTime);
    },
    [dateFormat]
  );

  const formatDateWithoutTime = useCallback(
    (dateString: string) => {
      return formatDateOnly(dateString, dateFormat);
    },
    [dateFormat]
  );

  return { formatDate, formatDateWithoutTime, dateFormat };
};

