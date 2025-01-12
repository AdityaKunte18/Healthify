// utils/dateUtils.ts

import { format, toZonedTime } from 'date-fns-tz';

/**
 * Converts a UTC date string to IST and formats it.
 * @param dateString - The original date string in UTC (YYYY-MM-DD HH:MM:SS).
 * @returns Formatted date string in IST.
 */
export const formatToIST = (dateString: string): string => {
  try {
    const timeZone = 'Asia/Kolkata'; // IST Time Zone

    // Step 1: Convert 'YYYY-MM-DD HH:MM:SS' to 'YYYY-MM-DDTHH:MM:SSZ' for UTC
    const isoDateString = dateString.replace(' ', 'T') + 'Z';
    const date = new Date(isoDateString);

    // Validate the parsed date
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date string: ${dateString}`);
    }

    // Step 2: Convert UTC date to IST
    const zonedDate = toZonedTime(date, timeZone);

    // Step 3: Format the date in IST
    return format(zonedDate, 'dd MMM yyyy, hh:mm a', { timeZone });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString; // Fallback to original string if formatting fails
  }
};


export const formatDateToIST = (dateString: string): string => {
    try {
      const timeZone = 'Asia/Kolkata'; // IST Time Zone
  
      // Step 1: Convert 'YYYY-MM-DD' to 'YYYY-MM-DDT00:00:00Z' for UTC
      const isoDateString = `${dateString}T00:00:00Z`;
      const date = new Date(isoDateString);
  
      // Validate the parsed date
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date string: ${dateString}`);
      }
  
      // Step 2: Convert UTC date to IST
      const zonedDate = toZonedTime(date, timeZone);
  
      // Step 3: Format the date in IST
      return format(zonedDate, 'dd MMM yyyy', { timeZone });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString; // Fallback to original string if formatting fails
    }
  };