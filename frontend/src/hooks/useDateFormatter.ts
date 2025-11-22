import { useCallback, useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { formatDateByUserSettings, formatDateOnly } from '../utils/dateFormatter';

export const useDateFormatter = () => {
  const [dateFormat, setDateFormat] = useState<string>('DD/MM/YYYY');

  useEffect(() => {
    const loadDateFormat = async () => {
      try {
        const settings = await apiService.getSettings();
        setDateFormat(settings.date_format || 'DD/MM/YYYY');
      } catch {
        setDateFormat('DD/MM/YYYY');
      }
    };

    loadDateFormat();
  }, []);

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

  return { formatDate, formatDateWithoutTime };
};

