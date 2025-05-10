import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isToday, isYesterday, isTomorrow, parseISO } from "date-fns";

// Combine classes with Tailwind's merge
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format match date for display
export function formatMatchDate(dateString: string | Date | number | null | undefined): string {
  if (!dateString) {
    return 'TBD';
  }
  
  try {
    let date: Date;
    
    // Handle different input types
    if (typeof dateString === 'string') {
      date = parseISO(dateString);
    } else if (dateString instanceof Date) {
      date = dateString;
    } else if (typeof dateString === 'number') {
      date = new Date(dateString);
    } else {
      return 'TBD';
    }
    
    // Check for invalid date
    if (isNaN(date.getTime())) {
      return 'TBD';
    }
    
    if (isToday(date)) {
      return 'Today';
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else if (isTomorrow(date)) {
      return 'Tomorrow';
    } else {
      return format(date, 'EEE, do MMM');
    }
  } catch (error) {
    console.error('Error formatting match date:', error);
    return 'TBD';
  }
}

// Format exact date and time for upcoming matches
export function formatExactDateTime(dateString: string | Date | number | null | undefined): string {
  if (!dateString) {
    return 'TBD';
  }
  
  try {
    let date: Date;
    
    // Handle different input types
    if (typeof dateString === 'string') {
      date = parseISO(dateString);
    } else if (dateString instanceof Date) {
      date = dateString;
    } else if (typeof dateString === 'number') {
      date = new Date(dateString);
    } else {
      return 'TBD';
    }
    
    // Check for invalid date
    if (isNaN(date.getTime())) {
      return 'TBD';
    }
    
    return format(date, 'EEE, MMM d, yyyy • h:mm a');
  } catch (error) {
    console.error('Error formatting exact date time:', error);
    return 'TBD';
  }
}

// Function to get formatted match date for display in cards
export function formatMatchDateFn(dateString: string | Date | number | null | undefined): string {
  if (!dateString) {
    return 'TBD';
  }
  
  try {
    let date: Date;
    
    // Handle different input types
    if (typeof dateString === 'string') {
      date = parseISO(dateString);
    } else if (dateString instanceof Date) {
      date = dateString;
    } else if (typeof dateString === 'number') {
      date = new Date(dateString);
    } else {
      return 'TBD';
    }
    
    // Check for invalid date
    if (isNaN(date.getTime())) {
      return 'TBD';
    }
    
    if (isToday(date)) {
      return `Today • ${format(date, 'h:mm a')}`;
    } else if (isTomorrow(date)) {
      return `Tomorrow • ${format(date, 'h:mm a')}`;
    } else if (isYesterday(date)) {
      return `Yesterday • ${format(date, 'h:mm a')}`;
    }
    
    return format(date, 'EEE, MMM d • h:mm a');
  } catch (error) {
    console.error('Error formatting match date function:', error);
    return 'TBD';
  }
}

// Function to calculate countdown timer
export function getCountdownTimer(dateString: string | Date | number): string {
  // Handle missing or invalid input
  if (!dateString) {
    return "TBD";
  }
  
  let matchDate: Date;
  
  try {
    // Handle different input types
    if (typeof dateString === 'string') {
      matchDate = parseISO(dateString);
    } else if (dateString instanceof Date) {
      matchDate = dateString;
    } else if (typeof dateString === 'number') {
      matchDate = new Date(dateString);
    } else {
      return "TBD";
    }
    
    // Check for invalid date
    if (isNaN(matchDate.getTime())) {
      return "TBD";
    }
    
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
  } catch (error) {
    console.error("Error calculating countdown:", error);
    return "TBD";
  }
}

// Format match time for display
export function formatMatchTime(dateString: string | Date | number | null | undefined): string {
  if (!dateString) {
    return 'TBD';
  }
  
  try {
    let date: Date;
    
    // Handle different input types
    if (typeof dateString === 'string') {
      date = parseISO(dateString);
    } else if (dateString instanceof Date) {
      date = dateString;
    } else if (typeof dateString === 'number') {
      date = new Date(dateString);
    } else {
      return 'TBD';
    }
    
    // Check for invalid date
    if (isNaN(date.getTime())) {
      return 'TBD';
    }
    
    return format(date, 'HH:mm');
  } catch (error) {
    console.error('Error formatting match time:', error);
    return 'TBD';
  }
}

// Format date and time for display
export function formatDateTime(dateString: string | Date | number | null | undefined): string {
  if (!dateString) {
    return 'TBD';
  }
  
  try {
    let date: Date;
    
    // Handle different input types
    if (typeof dateString === 'string') {
      date = parseISO(dateString);
    } else if (dateString instanceof Date) {
      date = dateString;
    } else if (typeof dateString === 'number') {
      date = new Date(dateString);
    } else {
      return 'TBD';
    }
    
    // Check for invalid date
    if (isNaN(date.getTime())) {
      return 'TBD';
    }
    
    return `${format(date, 'EEE, do MMM')} | ${format(date, 'HH:mm')}`;
  } catch (error) {
    console.error('Error formatting date time:', error);
    return 'TBD';
  }
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

// Get team gradient colors with enhanced vibrancy
export function getTeamGradient(teamName: string, direction: 'to-r' | 'to-l' = 'to-r'): string {
  // Avoid black and white colors - use more vibrant colors
  
  // Special case for Juventus (black and white stripes)
  if (teamName.toLowerCase().includes('juventus')) {
    return `bg-gradient-${direction} from-purple-700 to-purple-500`;
  }
  
  // Special case for Real Madrid (known for white)
  if (
    teamName.toLowerCase().includes('real madrid') || 
    (teamName.toLowerCase().includes('real') && !teamName.toLowerCase().includes('sociedad'))
  ) {
    return `bg-gradient-${direction} from-blue-600 to-blue-400`;
  }
  
  // For white kit teams, use vibrant colors
  if (
    teamName.toLowerCase().includes('tottenham') ||
    teamName.toLowerCase().includes('fulham') ||
    teamName.toLowerCase().includes('swansea')
  ) {
    return `bg-gradient-${direction} from-indigo-600 to-blue-400`;
  }
  
  // For black kit teams, use vibrant colors
  if (
    teamName.toLowerCase().includes('newcastle') ||
    teamName.toLowerCase().includes('watford')
  ) {
    return `bg-gradient-${direction} from-amber-600 to-amber-400`;
  }
  
  // For green teams
  if (
    teamName.toLowerCase().includes('celtic') ||
    teamName.toLowerCase().includes('betis') ||
    teamName.toLowerCase().includes('wolfsburg') ||
    teamName.toLowerCase().includes('sporting') ||
    teamName.toLowerCase().includes('werder')
  ) {
    return `bg-gradient-${direction} from-green-700 to-green-500`;
  }
  
  // For blue teams
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
    return `bg-gradient-${direction} from-blue-700 to-blue-500`;
  }
  
  // For red teams
  if (
    teamName.toLowerCase().includes('manchester united') ||
    teamName.toLowerCase().includes('liverpool') ||
    teamName.toLowerCase().includes('arsenal') ||
    teamName.toLowerCase().includes('atletico') ||
    teamName.toLowerCase().includes('milan') ||
    teamName.toLowerCase().includes('bayern')
  ) {
    return `bg-gradient-${direction} from-red-700 to-red-500`;
  }
  
  // Try to find an exact match
  const exactMatch = Object.keys(teamColorMap).find(key => 
    teamName.toLowerCase() === key.toLowerCase()
  );
  
  if (exactMatch) {
    const colors = teamColorMap[exactMatch];
    return `bg-gradient-${direction} ${colors.primary} ${colors.secondary}`;
  }
  
  // Try to find a partial match
  const partialMatch = Object.keys(teamColorMap).find(key => 
    teamName.toLowerCase().includes(key.toLowerCase())
  );
  
  if (partialMatch) {
    const colors = teamColorMap[partialMatch];
    return `bg-gradient-${direction} ${colors.primary} ${colors.secondary}`;
  }
  
  // Default fallback - check the team name for common colors
  if (teamName.toLowerCase().includes('green')) {
    return `bg-gradient-${direction} from-green-700 to-green-500`;
  } else if (teamName.toLowerCase().includes('blue')) {
    return `bg-gradient-${direction} from-blue-700 to-blue-500`;
  } else if (teamName.toLowerCase().includes('red')) {
    return `bg-gradient-${direction} from-red-700 to-red-500`;
  }
  
  // Fallback to default colors - vibrant blue or red
  return `bg-gradient-${direction} from-blue-700 to-blue-500`;
}

// Get team accent colors for background elements
export function getTeamBackgroundColor(teamName: string): string {
  // Special team-specific colors
  if (teamName && teamName.toLowerCase().includes('juventus')) {
    return 'bg-gray-100';
  }
  
  if (teamName && teamName.toLowerCase().includes('real madrid')) {
    return 'bg-blue-50';
  }
  
  // Color themes based on team kits
  if (
    teamName && (
    teamName.toLowerCase().includes('chelsea') ||
    teamName.toLowerCase().includes('everton') ||
    teamName.toLowerCase().includes('leicester') ||
    teamName.toLowerCase().includes('brighton') ||
    teamName.toLowerCase().includes('napoli') ||
    teamName.toLowerCase().includes('lazio') ||
    teamName.toLowerCase().includes('marseille')
    )
  ) {
    return 'bg-blue-50';
  }
  
  if (
    teamName && (
    teamName.toLowerCase().includes('manchester united') ||
    teamName.toLowerCase().includes('liverpool') ||
    teamName.toLowerCase().includes('arsenal') ||
    teamName.toLowerCase().includes('atletico') ||
    teamName.toLowerCase().includes('milan') ||
    teamName.toLowerCase().includes('bayern')
    )
  ) {
    return 'bg-red-50';
  }
  
  if (
    teamName && (
    teamName.toLowerCase().includes('celtic') ||
    teamName.toLowerCase().includes('betis') ||
    teamName.toLowerCase().includes('wolfsburg') ||
    teamName.toLowerCase().includes('sporting')
    )
  ) {
    return 'bg-green-50';
  }
  
  // Default light background
  return 'bg-gray-50';
}

// Get team primary color for text and borders
export function getTeamColor(teamName: string): string {
  if (!teamName) return 'text-gray-800';
  
  // Special team-specific colors
  if (teamName.toLowerCase().includes('juventus')) {
    return 'text-gray-800';
  }
  
  if (teamName.toLowerCase().includes('real madrid')) {
    return 'text-blue-600';
  }
  
  // Color themes based on team kits
  if (
    teamName.toLowerCase().includes('chelsea') ||
    teamName.toLowerCase().includes('everton') ||
    teamName.toLowerCase().includes('leicester') ||
    teamName.toLowerCase().includes('brighton') ||
    teamName.toLowerCase().includes('napoli') ||
    teamName.toLowerCase().includes('lazio') ||
    teamName.toLowerCase().includes('marseille')
  ) {
    return 'text-blue-600';
  }
  
  if (
    teamName.toLowerCase().includes('manchester united') ||
    teamName.toLowerCase().includes('liverpool') ||
    teamName.toLowerCase().includes('arsenal') ||
    teamName.toLowerCase().includes('atletico') ||
    teamName.toLowerCase().includes('milan') ||
    teamName.toLowerCase().includes('bayern')
  ) {
    return 'text-red-600';
  }
  
  if (
    teamName.toLowerCase().includes('celtic') ||
    teamName.toLowerCase().includes('betis') ||
    teamName.toLowerCase().includes('wolfsburg') ||
    teamName.toLowerCase().includes('sporting')
  ) {
    return 'text-green-600';
  }
  
  // Default text color
  return 'text-gray-800';
}

// Get opposing team color for visual contrast
export function getOpposingTeamColor(teamName: string): string {
  if (!teamName) return 'from-gray-800 to-gray-600';
  
  // For red teams, use blue
  if (
    teamName.toLowerCase().includes('manchester united') ||
    teamName.toLowerCase().includes('liverpool') ||
    teamName.toLowerCase().includes('arsenal') ||
    teamName.toLowerCase().includes('atletico') ||
    teamName.toLowerCase().includes('milan') ||
    teamName.toLowerCase().includes('bayern')
  ) {
    return 'from-blue-700 to-blue-500';
  }
  
  // For blue teams, use red
  if (
    teamName.toLowerCase().includes('chelsea') ||
    teamName.toLowerCase().includes('everton') ||
    teamName.toLowerCase().includes('leicester') ||
    teamName.toLowerCase().includes('brighton') ||
    teamName.toLowerCase().includes('napoli') ||
    teamName.toLowerCase().includes('lazio') ||
    teamName.toLowerCase().includes('marseille')
  ) {
    return 'from-red-700 to-red-500';
  }
  
  // For green teams, use purple
  if (
    teamName.toLowerCase().includes('celtic') ||
    teamName.toLowerCase().includes('betis') ||
    teamName.toLowerCase().includes('wolfsburg') ||
    teamName.toLowerCase().includes('sporting')
  ) {
    return 'from-purple-700 to-purple-500';
  }
  
  // Default opposing gradient
  return 'from-gray-800 to-gray-600';
}
