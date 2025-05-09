/**
 * Utility functions for handling accessibility features in the application
 */
import { store } from './store';

/**
 * Get a high-contrast version of a color based on its luminance
 * @param color The original color in rgb format (e.g., 'rgb(255, 0, 0)')
 * @returns A high-contrast color that's easier to see
 */
export function getHighContrastColor(color: string): string {
  // Parse RGB values
  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!rgbMatch) return color;
  
  const r = parseInt(rgbMatch[1], 10);
  const g = parseInt(rgbMatch[2], 10);
  const b = parseInt(rgbMatch[3], 10);
  
  // Calculate luminance using the formula for perceived brightness
  // (0.299*R + 0.587*G + 0.114*B)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // For high contrast, make dark colors darker and light colors lighter
  if (luminance < 0.5) {
    // For dark colors, make them even darker but not completely black
    return `rgb(${Math.max(0, r - 50)}, ${Math.max(0, g - 50)}, ${Math.max(0, b - 50)})`;
  } else {
    // For light colors, make them even lighter but not completely white
    return `rgb(${Math.min(255, r + 50)}, ${Math.min(255, g + 50)}, ${Math.min(255, b + 50)})`;
  }
}

/**
 * Generate a high-contrast team color for accessibility mode
 * @param teamName The name of the team
 * @param isHighContrast Whether high contrast mode is enabled
 * @returns A color string suitable for use in the application
 */
export function getAccessibleTeamColor(teamName: string, enhance = false): string {
  // First check if high contrast mode is enabled in Redux
  const { highContrast } = store.getState().ui.accessibility;
  
  // Import dynamically to avoid circular dependencies
  const { getTeamColor } = require('./colorExtractor');
  
  // Get the regular team color
  const baseColor = getTeamColor(teamName, enhance);
  
  // Apply high contrast if enabled
  return highContrast ? getHighContrastColor(baseColor) : baseColor;
}

/**
 * Get contrasting colors for teams in accessibility mode
 * @param homeTeam Home team name
 * @param awayTeam Away team name
 * @returns An array of colors with increased contrast between them
 */
export function getAccessibleTeamColors(homeTeam: string, awayTeam: string): [string, string] {
  const { highContrast } = store.getState().ui.accessibility;
  
  // Import dynamically to avoid circular dependencies
  const { getTeamColor, getOpposingTeamColor } = require('./colorExtractor');
  
  // Get base colors
  const homeColor = getTeamColor(homeTeam, true); // enhanced for home
  const awayColor = getOpposingTeamColor(homeTeam, awayTeam);
  
  if (!highContrast) {
    return [homeColor, awayColor];
  }
  
  // In high contrast mode, make one color very dark and one very light
  // to maximize the difference between them
  
  // Parse the home RGB values
  const homeRgbMatch = homeColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!homeRgbMatch) return [homeColor, awayColor];
  
  const homeR = parseInt(homeRgbMatch[1], 10);
  const homeG = parseInt(homeRgbMatch[2], 10);
  const homeB = parseInt(homeRgbMatch[3], 10);
  
  // Calculate home luminance
  const homeLuminance = (0.299 * homeR + 0.587 * homeG + 0.114 * homeB) / 255;
  
  // If home is already dark, make it darker and away lighter
  // If home is light, make it lighter and away darker
  if (homeLuminance < 0.5) {
    // Home team gets even darker
    const enhancedHomeColor = `rgb(${Math.max(0, homeR - 70)}, ${Math.max(0, homeG - 70)}, ${Math.max(0, homeB - 70)})`;
    
    // Away team gets much lighter for contrast
    return [enhancedHomeColor, 'rgb(255, 255, 255)'];
  } else {
    // Home team gets even lighter
    const enhancedHomeColor = `rgb(${Math.min(255, homeR + 70)}, ${Math.min(255, homeG + 70)}, ${Math.min(255, homeB + 70)})`;
    
    // Away team gets much darker for contrast
    return [enhancedHomeColor, 'rgb(10, 10, 10)'];
  }
}