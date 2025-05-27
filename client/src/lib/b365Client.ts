
import { apiRequest } from './queryClient';

export interface B365LiveMatch {
  id: string;
  time: string;
  time_status: number;
  league: {
    id: string;
    name: string;
    cc: string;
  };
  home: {
    id: string;
    name: string;
    image_id: string;
  };
  away: {
    id: string;
    name: string;
    image_id: string;
  };
  ss: string;
  extra: {
    stadium: string;
    minute: string;
  };
}

export const b365Client = {
  /**
   * Get live matches from B365API
   */
  async getLiveMatches(): Promise<B365LiveMatch[]> {
    try {
      const response = await apiRequest('GET', '/api/b365/live');
      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('Error fetching B365 live matches:', error);
      return [];
    }
  },

  /**
   * Get events by date from B365API
   */
  async getEventsByDate(date: string): Promise<any[]> {
    try {
      // Convert YYYY-MM-DD to YYYYMMDD format for B365API
      const formattedDate = date.replace(/-/g, '');
      const response = await apiRequest('GET', `/api/b365/events/${formattedDate}`);
      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error(`Error fetching B365 events for ${date}:`, error);
      return [];
    }
  }
};
