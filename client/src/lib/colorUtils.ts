/**
 * Team color utility functions
 * This module contains functions for team color management
 */

/**
 * Map Tailwind color classes to hex values
 */
const tailwindColors: Record<string, Record<string | number, string>> = {
  red: {
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  blue: {
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  sky: {
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  indigo: {
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
  },
  amber: {
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
  },
  yellow: {
    500: '#eab308',
    600: '#ca8a04',
  },
  orange: {
    500: '#f97316',
    600: '#ea580c',
  },
  green: {
    700: '#15803d',
    800: '#166534',
  },
  purple: {
    800: '#6b21a8',
  },
  black: { 500: '#000000' },
};

/**
 * Convert a Tailwind color class to a hex color
 * @param tailwindClass - Tailwind color class (e.g., 'bg-red-700')
 * @returns Hex color code (e.g., '#b91c1c')
 */
export function getTailwindToHex(tailwindClass: string): string {
  if (!tailwindClass || typeof tailwindClass !== 'string') {
    return '#3b82f6'; // Default blue
  }
  
  // Strip the 'bg-' prefix
  const colorName = tailwindClass.replace('bg-', '');
  
  // Handle 'black' specially
  if (colorName === 'black') {
    return '#000000';
  }
  
  // Split by hyphen to get color and intensity
  const parts = colorName.split('-');
  if (parts.length !== 2) {
    return '#3b82f6'; // Default blue
  }
  
  const [color, intensity] = parts;
  
  // Check if color exists in our map
  if (!tailwindColors[color]) {
    return '#3b82f6'; // Default blue
  }
  
  // Return the hex value or default
  return tailwindColors[color][intensity] || '#3b82f6';
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

/**
 * Get an enhanced gradient for the home team with a darker appearance
 * @param teamName The name of the team
 * @returns Enhanced gradient string for CSS background property
 */
export function getEnhancedHomeTeamGradient(teamName: string): string {
  const regularGradient = getTeamGradient(teamName, 'to-r');
  
  // Make it more dramatic by adding a darkening effect
  return regularGradient.replace('bg-gradient-to-r', 'bg-gradient-to-br');
}

/**
 * Get a contrasting text color (white or black) based on background color
 * @param colorClass A Tailwind color class (e.g., 'bg-blue-700')
 * @returns Text color class ('text-white' or 'text-black')
 */
export function getContrastTextColor(colorClass: string): string {
  // Dark colors that need white text
  const darkColors = [
    'black',
    'slate-700', 'slate-800', 'slate-900',
    'gray-700', 'gray-800', 'gray-900',
    'zinc-700', 'zinc-800', 'zinc-900',
    'neutral-700', 'neutral-800', 'neutral-900',
    'stone-700', 'stone-800', 'stone-900',
    'red-700', 'red-800', 'red-900',
    'orange-700', 'orange-800', 'orange-900',
    'amber-800', 'amber-900',
    'yellow-900',
    'lime-900',
    'green-700', 'green-800', 'green-900',
    'emerald-700', 'emerald-800', 'emerald-900',
    'teal-700', 'teal-800', 'teal-900',
    'cyan-800', 'cyan-900',
    'sky-800', 'sky-900',
    'blue-600', 'blue-700', 'blue-800', 'blue-900',
    'indigo-600', 'indigo-700', 'indigo-800', 'indigo-900',
    'violet-700', 'violet-800', 'violet-900',
    'purple-600', 'purple-700', 'purple-800', 'purple-900',
    'fuchsia-700', 'fuchsia-800', 'fuchsia-900',
    'pink-700', 'pink-800', 'pink-900',
    'rose-700', 'rose-800', 'rose-900'
  ];
  
  // Check if the color is in our list of dark colors
  for (const darkColor of darkColors) {
    if (colorClass.includes(darkColor)) {
      return 'text-white';
    }
  }
  
  // Default to black text for lighter colors
  return 'text-black';
}