
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Globe, Calendar, Trophy, Users, BarChart3, RefreshCw } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface ComprehensiveAnalysisData {
  totalMatches: number;
  uniqueLeagues: number;
  countries: number;
  uniqueTeams: number;
  matchesByDate: Record<string, number>;
  topCountries: Array<{
    country: string;
    totalMatches: number;
    leagues: number;
    leagueNames: string[];
    sampleMatches: Array<{
      id: number;
      date: string;
      status: string;
      teams: string;
    }>;
  }>;
  searchResults: {
    alAhlyInterMiami: boolean;
    uefaU21: boolean;
    fifaClubWorldCup: boolean;
    internationalFriendlies: boolean;
  };
}

const ComprehensiveMatchAnalysis: React.FC = () => {
  const [analysisData, setAnalysisData] = useState<ComprehensiveAnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null);

  const fetchAnalysisData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // This would call your backend endpoint that runs the comprehensive analysis
      const response = await apiRequest('GET', '/api/fixtures/analysis/comprehensive');
      const data = await response.json();
      setAnalysisData(data);
    } catch (err) {
      console.error('Error fetching comprehensive analysis:', err);
      setError('Failed to load comprehensive match analysis');
      
      // Mock data for demonstration since the endpoint doesn't exist yet
      const mockData: ComprehensiveAnalysisData = {
        totalMatches: 4500,
        uniqueLeagues: 250,
        countries: 85,
        uniqueTeams: 1200,
        matchesByDate: {
          '2025-06-14': 1681,
          '2025-06-15': 1351,
          '2025-06-16': 669,
          '2025-06-17': 799
        },
        topCountries: [
          {
            country: 'Brazil',
            totalMatches: 53,
            leagues: 18,
            leagueNames: ['Serie B', 'Serie C', 'Serie D', 'Copa Paulista'],
            sampleMatches: [
              { id: 1353372, date: '2025-06-15T19:00:00+00:00', status: 'NS', teams: 'Atletico Goianiense vs Coritiba' },
              { id: 1353378, date: '2025-06-15T19:00:00+00:00', status: 'NS', teams: 'Novorizontino vs Cuiaba' }
            ]
          },
          {
            country: 'United States',
            totalMatches: 51,
            leagues: 6,
            leagueNames: ['USL League Two', 'USL League One', 'MLS Next Pro', 'WPSL'],
            sampleMatches: [
              { id: 1369371, date: '2025-06-15T20:00:00+00:00', status: 'NS', teams: 'Charlotte Independence vs Greenville Triumph' }
            ]
          },
          {
            country: 'England',
            totalMatches: 28,
            leagues: 4,
            leagueNames: ['Premier League', 'Championship', 'League One', 'FA Cup'],
            sampleMatches: [
              { id: 1234567, date: '2025-06-15T15:00:00+00:00', status: 'NS', teams: 'Manchester City vs Arsenal' }
            ]
          }
        ],
        searchResults: {
          alAhlyInterMiami: false,
          uefaU21: false,
          fifaClubWorldCup: true,
          internationalFriendlies: true
        }
      };
      
      setAnalysisData(mockData);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysisData();
  }, []);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Comprehensive Match Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error && !analysisData) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchAnalysisData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Analysis
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!analysisData) return null;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Comprehensive Match Analysis (No Filters)
          </CardTitle>
          <Button onClick={fetchAnalysisData} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Overall Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {analysisData.totalMatches.toLocaleString()}
            </div>
            <div className="text-sm text-blue-500 flex items-center justify-center gap-1">
              <Calendar className="h-4 w-4" />
              Total Matches
            </div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {analysisData.uniqueLeagues}
            </div>
            <div className="text-sm text-green-500 flex items-center justify-center gap-1">
              <Trophy className="h-4 w-4" />
              Unique Leagues
            </div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {analysisData.countries}
            </div>
            <div className="text-sm text-purple-500 flex items-center justify-center gap-1">
              <Globe className="h-4 w-4" />
              Countries
            </div>
          </div>
          
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {analysisData.uniqueTeams.toLocaleString()}
            </div>
            <div className="text-sm text-orange-500 flex items-center justify-center gap-1">
              <Users className="h-4 w-4" />
              Unique Teams
            </div>
          </div>
        </div>

        {/* Matches by Date */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Matches by Date</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(analysisData.matchesByDate).map(([date, count]) => (
              <div key={date} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-sm font-medium">{date}</span>
                <Badge variant="secondary">{count.toLocaleString()}</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Top Countries */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Top Countries by Match Count</h3>
          <div className="space-y-3">
            {analysisData.topCountries.map((country, index) => (
              <div key={country.country} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      #{index + 1}
                    </Badge>
                    <span className="font-semibold">{country.country}</span>
                    <Badge>{country.totalMatches} matches</Badge>
                    <Badge variant="secondary">{country.leagues} leagues</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedCountry(
                      expandedCountry === country.country ? null : country.country
                    )}
                  >
                    {expandedCountry === country.country ? 'Hide' : 'Show'} Details
                  </Button>
                </div>
                
                {expandedCountry === country.country && (
                  <div className="mt-3 space-y-2">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Leagues:</h4>
                      <div className="flex flex-wrap gap-1">
                        {country.leagueNames.slice(0, 6).map((league) => (
                          <Badge key={league} variant="outline" className="text-xs">
                            {league}
                          </Badge>
                        ))}
                        {country.leagueNames.length > 6 && (
                          <Badge variant="outline" className="text-xs">
                            +{country.leagueNames.length - 6} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-1">Sample Matches:</h4>
                      <div className="space-y-1">
                        {country.sampleMatches.slice(0, 3).map((match) => (
                          <div key={match.id} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                            {match.teams} ({match.status})
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Search Results */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Specific Match Search Results</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-sm">Al Ahly vs Inter Miami</span>
              <Badge variant={analysisData.searchResults.alAhlyInterMiami ? "default" : "destructive"}>
                {analysisData.searchResults.alAhlyInterMiami ? "Found" : "Not Found"}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-sm">UEFA U21 Matches</span>
              <Badge variant={analysisData.searchResults.uefaU21 ? "default" : "destructive"}>
                {analysisData.searchResults.uefaU21 ? "Found" : "Not Found"}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-sm">FIFA Club World Cup</span>
              <Badge variant={analysisData.searchResults.fifaClubWorldCup ? "default" : "destructive"}>
                {analysisData.searchResults.fifaClubWorldCup ? "Found" : "Not Found"}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="text-sm">International Friendlies</span>
              <Badge variant={analysisData.searchResults.internationalFriendlies ? "default" : "destructive"}>
                {analysisData.searchResults.internationalFriendlies ? "Found" : "Not Found"}
              </Badge>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> This is showing mock data. {error}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ComprehensiveMatchAnalysis;
