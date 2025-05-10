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
export function getCountdownTimer(dateString: string | Date | number | null | undefined): string {
  // Handle missing or invalid input
  if (dateString === null || dateString === undefined) {
    return "TBD";
  }
  
  let matchDate: Date;
  
  try {
    // Handle different input types
    if (typeof dateString === 'string') {
      try {
        matchDate = parseISO(dateString);
      } catch (err) {
        console.error("Error parsing date string:", err);
        return "TBD";
      }
    } else if (dateString instanceof Date) {
      matchDate = dateString;
    } else if (typeof dateString === 'number') {
      // If it's a UNIX timestamp in seconds (10 digits), convert to milliseconds
      if (dateString.toString().length <= 10) {
        matchDate = new Date(dateString * 1000);
      } else {
        // Already in milliseconds
        matchDate = new Date(dateString);
      }
    } else {
      console.error("Unsupported date format:", typeof dateString);
      return "TBD";
    }
    
    // Check for invalid date
    if (isNaN(matchDate.getTime())) {
      console.error("Invalid date:", matchDate);
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

/**
 * Get team color as a Tailwind class
 * @param teamName The name of the team
 * @returns A Tailwind background color class (e.g., 'bg-blue-700')
 */
export function getTeamColor(teamName: string): string {
  // Map common team names to Tailwind colors
  const teamColorMap: Record<string, string> = {
    // Premier League teams
    'Manchester City': 'bg-sky-600',
    'Manchester United': 'bg-red-700',
    'Liverpool': 'bg-red-700',
    'Chelsea': 'bg-blue-700',
    'Arsenal': 'bg-red-700',
    'Tottenham': 'bg-blue-900',
    'Newcastle': 'bg-black',
    'Aston Villa': 'bg-indigo-900',
    'West Ham': 'bg-purple-800',
    'Brighton': 'bg-blue-600',
    'Everton': 'bg-blue-800',
    'Leicester': 'bg-blue-700',
    
    // LaLiga teams
    'Real Madrid': 'bg-indigo-900',
    'Barcelona': 'bg-blue-800',
    'Atletico Madrid': 'bg-red-700',
    'Sevilla': 'bg-red-800',
    'Valencia': 'bg-orange-600',
    'Real Betis': 'bg-green-800',
    'Athletic Bilbao': 'bg-red-700',
   
    // Serie A teams
    'Juventus': 'bg-black',
    'AC Milan': 'bg-red-900',
    'Inter': 'bg-blue-900',
    'Napoli': 'bg-blue-700',
    'Roma': 'bg-amber-700',
    'Lazio': 'bg-sky-600',
    
    // Bundesliga teams
    'Bayern Munich': 'bg-red-800',
    'Borussia Dortmund': 'bg-yellow-500',
    'RB Leipzig': 'bg-red-600',
    'Bayer Leverkusen': 'bg-red-700',
    
    // Ligue 1 teams
    'Paris Saint Germain': 'bg-blue-900',
    'PSG': 'bg-blue-900',
    'Marseille': 'bg-sky-600',
    'Lyon': 'bg-blue-700',
    'Monaco': 'bg-red-700',
  };

  // Try to find an exact match
  if (teamColorMap[teamName]) {
    return teamColorMap[teamName];
  }
  
  // Try to find a partial match
  const partialMatch = Object.keys(teamColorMap).find(key => 
    teamName.toLowerCase().includes(key.toLowerCase())
  );
  
  if (partialMatch) {
    return teamColorMap[partialMatch];
  }
  
  // For teams not in our map, generate a color based on the team name
  let hash = 0;
  for (let i = 0; i < teamName.length; i++) {
    hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Get a hue between 0-360 based on the name
  const hue = Math.abs(hash) % 360;
  
  // Map the hue to a tailwind color family
  if (hue < 30) return 'bg-red-700';
  if (hue < 60) return 'bg-orange-600';
  if (hue < 90) return 'bg-amber-600';
  if (hue < 120) return 'bg-yellow-500';
  if (hue < 150) return 'bg-lime-600';
  if (hue < 180) return 'bg-green-700';
  if (hue < 210) return 'bg-cyan-700';
  if (hue < 240) return 'bg-blue-700';
  if (hue < 270) return 'bg-indigo-800';
  if (hue < 300) return 'bg-purple-700';
  if (hue < 330) return 'bg-pink-700';
  
  // Default fallback
  return 'bg-blue-700';
}

/**
 * Get an opposing team color that contrasts with the home team color
 * @param homeTeamName The name of the home team
 * @param awayTeamName The name of the away team
 * @returns A Tailwind background color class (e.g., 'bg-blue-700')
 */
export function getOpposingTeamColor(homeTeamName: string, awayTeamName: string): string {
  const homeTeamColor = getTeamColor(homeTeamName);
  let awayTeamColor = getTeamColor(awayTeamName);
  
  // If the colors are the same, choose a contrasting color
  if (homeTeamColor === awayTeamColor) {
    // Extract the color family and intensity from the format "bg-{color}-{intensity}"
    const match = homeTeamColor.match(/bg-([a-z]+)-(\d+)/);
    if (match) {
      const [, color, intensity] = match;
      
      // Choose a contrasting color family
      const contrastColors: Record<string, string> = {
        'red': 'blue',
        'orange': 'indigo',
        'amber': 'purple',
        'yellow': 'blue',
        'lime': 'pink',
        'green': 'red',
        'emerald': 'rose',
        'teal': 'amber',
        'cyan': 'orange',
        'sky': 'red',
        'blue': 'yellow',
        'indigo': 'orange',
        'violet': 'lime',
        'purple': 'green',
        'fuchsia': 'emerald',
        'pink': 'teal',
        'rose': 'cyan',
        'black': 'white',
        'white': 'black',
        'gray': 'red'
      };
      
      const contrastColor = contrastColors[color] || 'blue';
      awayTeamColor = `bg-${contrastColor}-${intensity}`;
    }
  }
  
  return awayTeamColor;
}

/**
 * Get a gradient for a team using their colors
 * @param teamName The name of the team
 * @param direction Direction of the gradient ('to-r' or 'to-l')
 * @returns A Tailwind gradient class string
 */
export function getTeamGradient(teamName: string, direction: 'to-r' | 'to-l' = 'to-r'): string {
  const baseColor = getTeamColor(teamName).replace('bg-', '');
  
  // Extract color and intensity
  const match = baseColor.match(/([a-z]+)-(\d+)/);
  if (!match) return `bg-gradient-${direction} from-blue-700 to-blue-500`;
  
  const [, color, intensity] = match;
  const intensityNum = parseInt(intensity);
  
  // Create a gradient with a lighter shade of the same color
  const lighterIntensity = Math.max(300, intensityNum - 200);
  
  if (direction === 'to-r') {
    return `bg-gradient-to-r from-${color}-${intensityNum} to-${color}-${lighterIntensity}`;
  } else {
    return `bg-gradient-to-l from-${color}-${lighterIntensity} to-${color}-${intensityNum}`;
  }
}