/**
 * Capitalizes the first letter of each word in a string
 * @param str String to capitalize
 * @returns String with first letter of each word capitalized
 */
export function capFirst(str: string): string {
  if (!str) return '';
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Formats a duration string or calculates duration from a start time
 * @param duration Duration string in format "HH:MM:SS.MS" or null
 * @param startTime Optional start time for calculating ongoing duration
 * @returns Formatted duration string
 */
export function formatDuration(duration: string | null, startTime?: string): string {
  let hours = '00';
  let minutes = '00';
  let seconds = '00';
  let milliseconds = '00.00';

  // Calculate duration for ongoing processes
  if (!duration && startTime) {
    const xduration = new Date().getTime() - new Date(startTime).getTime();
    const _seconds = Math.floor(xduration / 1000);
    const _minutes = Math.floor(_seconds / 60);
    hours = String(Math.floor(_minutes / 60));
    minutes = String(_minutes % 60);
    seconds = String(_seconds % 60);
  }
  // Parse provided duration string
  else {
    if (!duration) {
      return 'N/A';
    }
    [hours, minutes, milliseconds] = duration.split(':');
    [seconds, milliseconds] = milliseconds.split('.');
  }

  // Format the duration in a human-readable way
  const h = parseInt(hours);
  const m = parseInt(minutes);
  const s = parseInt(seconds);

  if (h === 0 && m === 0) {
    return `${s} seconds`;
  } else if (h === 0) {
    return `${m} minutes ${s} seconds`;
  } else {
    return `${h} hours ${m} minutes`;
  }
}
