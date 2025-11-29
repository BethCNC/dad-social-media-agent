import api from './api';

export interface Holiday {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  name: string;
  source: string;
  category?: string;
  is_marketing_relevant: boolean;
}

export interface HolidayContext {
  date: string;
  holidays_on_date: Holiday[];
  upcoming_holidays: Holiday[];
  marketing_relevant_holidays: Holiday[];
}

/**
 * Get upcoming holidays within the specified number of days.
 */
export const getUpcomingHolidays = async (days: number = 30): Promise<Holiday[]> => {
  const response = await api.get<Holiday[]>('/api/holidays/upcoming', {
    params: { days },
  });
  return response.data;
};

/**
 * Get all holidays on a specific date.
 */
export const getHolidaysOnDate = async (dateStr: string): Promise<Holiday[]> => {
  const response = await api.get<Holiday[]>('/api/holidays/on-date', {
    params: { date: dateStr },
  });
  return response.data;
};

/**
 * Get holiday context for a specific date, including holidays on that date
 * and upcoming holidays within the window.
 */
export const getHolidayContext = async (
  dateStr: string,
  windowDays: number = 7
): Promise<HolidayContext> => {
  const response = await api.get<HolidayContext>('/api/holidays/context', {
    params: { date: dateStr, window_days: windowDays },
  });
  return response.data;
};

