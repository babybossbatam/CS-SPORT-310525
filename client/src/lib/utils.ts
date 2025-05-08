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

// Format exact date and time for upcoming matches
export function formatExactDateTime(dateString: string): string {
  const date = parseISO(dateString);
  return format(date, 'EEE, MMM d, yyyy • h:mm a');
}

// Function to get formatted match date for display in cards
export function formatMatchDateFn(dateString: string): string {
  const date = parseISO(dateString);
  return format(date, 'EEE, MMM d • h:mm a');
}

// Function to calculate countdown timer
export function getCountdownTimer(dateString: string): string {
  const matchDate = parseISO(dateString);
  const now = new Date();
  
  // Get difference in milliseconds
  const diffMs = matchDate.getTime() - now.getTime();
  
  if (diffMs <= 0) {
    return "Starting now";
  }
  
  // Convert to days, hours, minutes, seconds
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
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

// Team color mapping based on common team logos and colors
export const teamColorMap: Record<string, { primary: string, secondary: string }> = {
  // Premier League teams
  'Manchester City': { primary: 'from-sky-700', secondary: 'to-sky-500' },
  'Manchester United': { primary: 'from-red-800', secondary: 'to-red-600' },
  'Liverpool': { primary: 'from-red-700', secondary: 'to-red-500' },
  'Chelsea': { primary: 'from-blue-800', secondary: 'to-blue-600' },
  'Arsenal': { primary: 'from-red-900', secondary: 'to-red-700' },
  'Tottenham': { primary: 'from-blue-900', secondary: 'to-blue-800' },
  'Newcastle': { primary: 'from-black', secondary: 'to-gray-800' },
  'Aston Villa': { primary: 'from-indigo-900', secondary: 'to-indigo-700' },
  'West Ham': { primary: 'from-purple-800', secondary: 'to-purple-600' },
  'Brighton': { primary: 'from-blue-600', secondary: 'to-blue-400' },
  'Everton': { primary: 'from-blue-800', secondary: 'to-blue-600' },
  'Leicester': { primary: 'from-blue-700', secondary: 'to-blue-500' },
  
  // LaLiga teams
  'Real Madrid': { primary: 'from-indigo-900', secondary: 'to-indigo-700' },
  'Barcelona': { primary: 'from-blue-800', secondary: 'to-red-800' },
  'Atletico Madrid': { primary: 'from-red-700', secondary: 'to-white' },
  'Sevilla': { primary: 'from-red-800', secondary: 'to-red-600' },
  'Valencia': { primary: 'from-orange-600', secondary: 'to-orange-400' },
  'Real Betis': { primary: 'from-green-800', secondary: 'to-green-600' },
  'Athletic Bilbao': { primary: 'from-red-700', secondary: 'to-red-500' },

  // Serie A teams
  'Juventus': { primary: 'from-black', secondary: 'to-white' },
  'AC Milan': { primary: 'from-red-900', secondary: 'to-black' },
  'Inter': { primary: 'from-blue-900', secondary: 'to-black' },
  'Napoli': { primary: 'from-blue-700', secondary: 'to-blue-500' },
  'Roma': { primary: 'from-amber-700', secondary: 'to-red-800' },
  'Lazio': { primary: 'from-sky-600', secondary: 'to-sky-400' },
  
  // Bundesliga teams
  'Bayern Munich': { primary: 'from-red-800', secondary: 'to-blue-800' },
  'Borussia Dortmund': { primary: 'from-yellow-500', secondary: 'to-black' },
  'RB Leipzig': { primary: 'from-red-600', secondary: 'to-red-400' },
  'Bayer Leverkusen': { primary: 'from-red-700', secondary: 'to-red-500' },
  
  // Ligue 1 teams
  'PSG': { primary: 'from-blue-900', secondary: 'to-blue-700' },
  'Marseille': { primary: 'from-sky-600', secondary: 'to-sky-400' },
  'Lyon': { primary: 'from-blue-700', secondary: 'to-red-700' },
  'Monaco': { primary: 'from-red-700', secondary: 'to-white' },
  
  // Color mapping by common team name components
  'United': { primary: 'from-red-900', secondary: 'to-red-700' },
  'City': { primary: 'from-sky-700', secondary: 'to-sky-500' },
  'Real': { primary: 'from-blue-800', secondary: 'to-blue-600' },
  'FC': { primary: 'from-blue-900', secondary: 'to-blue-700' },
  'Athletic': { primary: 'from-red-800', secondary: 'to-red-600' },
  
  // Default fallback
  'default': { primary: 'from-gray-800', secondary: 'to-gray-600' }
};

// Get team gradient colors
export function getTeamGradient(teamName: string, direction: 'to-r' | 'to-l' = 'to-r'): string {
  // For white and green logos, use green gradient
  if (
    teamName.toLowerCase().includes('celtic') ||
    teamName.toLowerCase().includes('betis') ||
    teamName.toLowerCase().includes('wolfsburg') ||
    teamName.toLowerCase().includes('sporting') ||
    teamName.toLowerCase().includes('werder')
  ) {
    return `bg-gradient-${direction} from-green-800 to-green-600`;
  }
  
  // For white and blue logos, use blue gradient
  if (
    teamName.toLowerCase().includes('chelsea') ||
    teamName.toLowerCase().includes('everton') ||
    teamName.toLowerCase().includes('leicester') ||
    teamName.toLowerCase().includes('brighton') ||
    teamName.toLowerCase().includes('napoli') ||
    teamName.toLowerCase().includes('lazio') ||
    teamName.toLowerCase().includes('real sociedad') ||
    teamName.toLowerCase().includes('marseille')
  ) {
    return `bg-gradient-${direction} from-blue-800 to-blue-600`;
  }
  
  // First try to find an exact match
  const exactMatch = Object.keys(teamColorMap).find(key => 
    teamName.toLowerCase() === key.toLowerCase()
  );
  
  if (exactMatch) {
    const colors = teamColorMap[exactMatch];
    return `bg-gradient-${direction} ${colors.primary} ${colors.secondary}`;
  }
  
  // Then try to find a partial match
  const partialMatch = Object.keys(teamColorMap).find(key => 
    teamName.toLowerCase().includes(key.toLowerCase())
  );
  
  if (partialMatch) {
    const colors = teamColorMap[partialMatch];
    return `bg-gradient-${direction} ${colors.primary} ${colors.secondary}`;
  }
  
  // Default fallback - check the team name for common colors
  if (teamName.toLowerCase().includes('green')) {
    return `bg-gradient-${direction} from-green-800 to-green-600`;
  } else if (teamName.toLowerCase().includes('blue')) {
    return `bg-gradient-${direction} from-blue-800 to-blue-600`;
  } else if (teamName.toLowerCase().includes('red')) {
    return `bg-gradient-${direction} from-red-800 to-red-600`;
  }
  
  // Fallback to default colors
  const colors = teamColorMap['default'];
  return `bg-gradient-${direction} ${colors.primary} ${colors.secondary}`;
}
