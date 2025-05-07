import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isToday, isYesterday, isTomorrow, parseISO } from "date-fns";

// Combine classes with Tailwind's merge
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format match date for display
export function formatMatchDate(dateString: string): string {
  const date = parseISO(dateString);
  
  if (isToday(date)) {
    return 'Today';
  } else if (isYesterday(date)) {
    return 'Yesterday';
  } else if (isTomorrow(date)) {
    return 'Tomorrow';
  } else {
    return format(date, 'EEE, do MMM');
  }
}

// Format match time for display
export function formatMatchTime(dateString: string): string {
  const date = parseISO(dateString);
  return format(date, 'HH:mm');
}

// Format date and time for display
export function formatDateTime(dateString: string): string {
  const date = parseISO(dateString);
  return `${format(date, 'EEE, do MMM')} | ${format(date, 'HH:mm')}`;
}

// Get match status text
export function getMatchStatusText(status: string, elapsed?: number | null): string {
  switch (status.toLowerCase()) {
    case 'tbd':
      return 'TBD';
    case 'ns':
      return 'Not Started';
    case 'ft':
      return 'Full Time';
    case 'aet':
      return 'After Extra Time';
    case 'pen':
      return 'Penalties';
    case 'et':
      return 'Extra Time';
    case 'ht':
      return 'Half Time';
    case '1h':
      return elapsed ? `${elapsed}'` : '1st Half';
    case '2h':
      return elapsed ? `${elapsed}'` : '2nd Half';
    case 'p':
      return 'Postponed';
    case 'susp':
      return 'Suspended';
    case 'int':
      return 'Interrupted';
    case 'aban':
      return 'Abandoned';
    case 'awh':
      return 'Home Walkover';
    case 'awa':
      return 'Away Walkover';
    case 'wby':
      return 'Walkover';
    case 'live':
      return elapsed ? `${elapsed}'` : 'LIVE';
    default:
      return status;
  }
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Format elapsed time with "+" for additional time
export function formatElapsedTime(elapsed: number | null, added: number | null): string {
  if (!elapsed) return '';
  if (added && added > 0) {
    return `${elapsed}+${added}'`;
  }
  return `${elapsed}'`;
}

// Format large numbers with commas
export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Get relative time (e.g., "2 hours ago")
export function getRelativeTime(date: string | Date): string {
  const now = new Date();
  const pastDate = typeof date === 'string' ? new Date(date) : date;
  const diffInSeconds = Math.floor((now.getTime() - pastDate.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
}

// Check if a match is live
export function isLiveMatch(status: string): boolean {
  const liveStatuses = ['1h', '2h', 'ht', 'et', 'p', 'bt', 'live'];
  return liveStatuses.includes(status.toLowerCase());
}

// Generate a random ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}
