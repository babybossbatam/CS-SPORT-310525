
import axios from 'axios';

// BetsAPI configuration
const BETS_API_BASE_URL = 'https://api.betsapi.com/v1';
const BETS_API_KEY = process.env.BETS_API_KEY || 'YOUR_BETS_API_KEY';

// Create axios instance for BetsAPI
const betsApiClient = axios.create({
  baseURL: BETS_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

export interface BetsApiNewsArticle {
  id: string;
  title: string;
  content?: string;
  summary?: string;
  image?: string;
  source?: string;
  url?: string;
  published_at?: string;
  sport_id?: number;
  league_id?: number;
}

export interface BetsApiNewsResponse {
  success: boolean;
  results: BetsApiNewsArticle[];
  pagination?: {
    page: number;
    per_page: number;
    total: number;
  };
  message?: string;
}

export const betsApiService = {
  /**
   * Get sports news from BetsAPI
   */
  async getSportsNews(sportId: number = 1, page: number = 1, perPage: number = 10): Promise<BetsApiNewsArticle[]> {
    try {
      console.log(`Fetching sports news from BetsAPI - Sport ID: ${sportId}, Page: ${page}, Per Page: ${perPage}`);
      
      const response = await betsApiClient.get('/news', {
        params: {
          token: BETS_API_KEY,
          sport_id: sportId, // 1 = Football/Soccer
          page: page,
          per_page: perPage
        }
      });

      const data: BetsApiNewsResponse = response.data;

      if (!data.success) {
        throw new Error(`BetsAPI Error: ${data.message || 'Unknown error'}`);
      }

      console.log(`Successfully fetched ${data.results?.length || 0} news articles from BetsAPI`);
      return data.results || [];
    } catch (error) {
      console.error('Error fetching news from BetsAPI:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('BetsAPI: Invalid API key');
        } else if (error.response?.status === 429) {
          throw new Error('BetsAPI: Rate limit exceeded');
        } else if (error.response?.status === 403) {
          throw new Error('BetsAPI: Access denied - check subscription');
        }
      }
      throw new Error(`Failed to fetch news from BetsAPI: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Get football/soccer specific news
   */
  async getFootballNews(page: number = 1, perPage: number = 10): Promise<BetsApiNewsArticle[]> {
    return this.getSportsNews(1, page, perPage); // Sport ID 1 = Football/Soccer
  },

  /**
   * Get basketball news
   */
  async getBasketballNews(page: number = 1, perPage: number = 10): Promise<BetsApiNewsArticle[]> {
    return this.getSportsNews(18, page, perPage); // Sport ID 18 = Basketball
  },

  /**
   * Get tennis news
   */
  async getTennisNews(page: number = 1, perPage: number = 10): Promise<BetsApiNewsArticle[]> {
    return this.getSportsNews(13, page, perPage); // Sport ID 13 = Tennis
  },

  /**
   * Get news by league
   */
  async getLeagueNews(leagueId: number, page: number = 1, perPage: number = 10): Promise<BetsApiNewsArticle[]> {
    try {
      console.log(`Fetching league news from BetsAPI - League ID: ${leagueId}`);
      
      const response = await betsApiClient.get('/news', {
        params: {
          token: BETS_API_KEY,
          league_id: leagueId,
          page: page,
          per_page: perPage
        }
      });

      const data: BetsApiNewsResponse = response.data;

      if (!data.success) {
        throw new Error(`BetsAPI Error: ${data.message || 'Unknown error'}`);
      }

      console.log(`Successfully fetched ${data.results?.length || 0} league news articles from BetsAPI`);
      return data.results || [];
    } catch (error) {
      console.error('Error fetching league news from BetsAPI:', error);
      throw new Error(`Failed to fetch league news from BetsAPI: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Convert BetsAPI news article to our standard format
   */
  convertToStandardFormat(article: BetsApiNewsArticle, index: number = 0) {
    return {
      id: index + 1,
      title: article.title || 'Sports News Update',
      content: article.content || article.summary || 'Latest sports news update',
      imageUrl: article.image || 'https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg',
      source: article.source || "BetsAPI Sports News",
      url: article.url || `/news/${index + 1}`,
      publishedAt: article.published_at || new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
};
