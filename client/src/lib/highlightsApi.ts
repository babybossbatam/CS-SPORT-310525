import { apiRequest } from './queryClient';

export interface HighlightsResponse {
  fixtureId: string;
  highlights: {
    title: string;
    provider: string;
    videoId: string;
    embedUrl: string;
  };
}

/**
 * Fetches match highlights for a given fixture
 * @param fixtureId The ID of the fixture to get highlights for
 * @returns Promise with the highlights data
 */
export async function getMatchHighlights(fixtureId: number | string): Promise<HighlightsResponse> {
  const response = await apiRequest('GET', `/fixtures/${fixtureId}/highlights`);
  return response.json();
}