
export const formatDateByUserSettings = (
  dateString: string,
  format: string = 'DD/MM/YYYY',
  includeTime: boolean = true
): string => {
  try {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');

    let formattedDate: string;

    switch (format) {
      case 'MM/DD/YYYY':
        formattedDate = `${month}/${day}/${year}`;
        break;
      case 'YYYY-MM-DD':
        formattedDate = `${year}-${month}-${day}`;
        break;
      case 'DD/MM/YYYY':
      default:
        formattedDate = `${day}/${month}/${year}`;
        break;
    }

    if (includeTime) {
      formattedDate += ` ${hour}:${minute}`;
    }

    return formattedDate;
  } catch {
    return 'Invalid date';
  }
};

export const formatDateOnly = (
  dateString: string,
  format: string = 'DD/MM/YYYY'
): string => {
  return formatDateByUserSettings(dateString, format, false);
};

