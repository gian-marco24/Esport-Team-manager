/**
 * Helper to format task deadlines into friendly Spanish text
 */
export function formatDeadlineDisplay(deadline?: string): string {
  if (!deadline) return '';

  // Check if it's in YYYY-MM-DD or YYYY-MM-DDTHH:mm or YYYY-MM-DD HH:mm format
  const isoPattern = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}))?/;
  const match = deadline.match(isoPattern);

  if (match) {
    const [, year, month, day, hours, minutes] = match;
    const months = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];
    const monthName = months[parseInt(month, 10) - 1] || month;
    const formattedDate = `${parseInt(day, 10)} ${monthName} ${year}`;

    if (hours !== undefined && minutes !== undefined) {
      return `${formattedDate} - ${hours}:${minutes} hs`;
    }
    return formattedDate;
  }

  return deadline;
}

/**
 * Parses a deadline string to extract { date: 'YYYY-MM-DD', time: 'HH:mm' }
 */
export function parseDeadlineToInputs(deadline?: string): { date: string; time: string; hasTime: boolean } {
  if (!deadline) return { date: '', time: '', hasTime: false };

  const isoPattern = /^(\d{4}-\d{2}-\d{2})(?:[T\s](\d{2}:\d{2}))?/;
  const match = deadline.match(isoPattern);

  if (match) {
    return {
      date: match[1],
      time: match[2] || '',
      hasTime: Boolean(match[2]),
    };
  }

  return { date: '', time: '', hasTime: false };
}

/**
 * Combines date and optional time into a clean deadline value
 */
export function buildDeadlineString(date: string, time?: string, includeTime?: boolean): string {
  if (!date) return '';
  if (includeTime && time) {
    return `${date} ${time}`;
  }
  return date;
}
