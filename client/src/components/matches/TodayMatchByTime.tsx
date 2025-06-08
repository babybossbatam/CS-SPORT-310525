
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Calendar, Clock, Trophy, Users } from "lucide-react";
import TodayPopularFootballLeaguesNew from "./TodayPopularFootballLeaguesNew";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format, parseISO } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface TodayMatchByTimeProps {
  selectedDate?: string;
  timeFilterActive?: boolean;
  liveFilterActive?: boolean;
  todayPopularFixtures?: any[];
}

const TodayMatchByTime: React.FC<TodayMatchByTimeProps> = ({
  selectedDate,
  timeFilterActive = false,
  liveFilterActive = false,
  todayPopularFixtures = [],
}) => {
  // Use current date if selectedDate is not provided
  const currentDate = selectedDate || new Date().toISOString().slice(0, 10);
  const [matchesData, setMatchesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch fixtures data for the selected date
  const { data: fixtures = [], isLoading } = useQuery({
    queryKey: ["fixtures-for-today-match-by-time", currentDate],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/fixtures/date/${currentDate}?all=true`);
      return await response.json();
    },
    enabled: !!currentDate,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Process fixtures data to extract summary statistics
  useEffect(() => {
    if (!fixtures || fixtures.length === 0) {
      setMatchesData([]);
      setLoading(false);
      return;
    }

    // Group matches by status and extract key statistics
    const processedData = {
      totalMatches: fixtures.length,
      liveMatches: fixtures.filter(f => 
        ['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'].includes(f.fixture?.status?.short)
      ).length,
      upcomingMatches: fixtures.filter(f => 
        f.fixture?.status?.short === 'NS' || f.fixture?.status?.short === 'TBD'
      ).length,
      finishedMatches: fixtures.filter(f => 
        ['FT', 'AET', 'PEN', 'AWD', 'WO'].includes(f.fixture?.status?.short)
      ).length,
      topLeagues: Array.from(new Set(fixtures.map(f => f.league?.name).filter(Boolean))).slice(0, 5),
      topCountries: Array.from(new Set(fixtures.map(f => f.league?.country).filter(Boolean))).slice(0, 5),
    };

    setMatchesData([processedData]);
    setLoading(false);
  }, [fixtures]);

  const formatDateDisplay = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      const today = new Date();
      const isToday = format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
      const isTomorrow = format(date, 'yyyy-MM-dd') === format(new Date(today.getTime() + 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
      
      if (isToday) return 'Today';
      if (isTomorrow) return 'Tomorrow';
      return format(date, 'MMM dd, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  return (
    <>
      {/* New Summary Card */}
      <Card className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">
              Today's Matches Overview - {formatDateDisplay(currentDate)}
            </h3>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading || loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="text-center">
                  <Skeleton className="h-8 w-8 mx-auto mb-2 rounded-full" />
                  <Skeleton className="h-6 w-16 mx-auto mb-1" />
                  <Skeleton className="h-4 w-20 mx-auto" />
                </div>
              ))}
            </div>
          ) : matchesData.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2">
                  <Trophy className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-800">{matchesData[0].totalMatches}</p>
                <p className="text-sm text-gray-600">Total Matches</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                </div>
                <p className="text-2xl font-bold text-gray-800">{matchesData[0].liveMatches}</p>
                <p className="text-sm text-gray-600">Live Now</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-800">{matchesData[0].upcomingMatches}</p>
                <p className="text-sm text-gray-600">Upcoming</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mx-auto mb-2">
                  <Users className="h-6 w-6 text-gray-600" />
                </div>
                <p className="text-2xl font-bold text-gray-800">{matchesData[0].finishedMatches}</p>
                <p className="text-sm text-gray-600">Finished</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">No matches available for this date</p>
            </div>
          )}
          
          {/* Quick Stats */}
          {matchesData.length > 0 && !loading && (
            <div className="mt-6 pt-4 border-t border-blue-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-700 mb-2">Top Leagues:</p>
                  <div className="space-y-1">
                    {matchesData[0].topLeagues.slice(0, 3).map((league: string, index: number) => (
                      <p key={index} className="text-gray-600 truncate">• {league}</p>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="font-medium text-gray-700 mb-2">Top Countries:</p>
                  <div className="space-y-1">
                    {matchesData[0].topCountries.slice(0, 3).map((country: string, index: number) => (
                      <p key={index} className="text-gray-600 truncate">• {country}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Header Section for Popular Leagues */}
      <CardHeader className="flex items-start gap-2 p-3 mt-4 bg-white border border-stone-200 font-semibold">
        Popular Leagues by Time
      </CardHeader>

      {/* Use TodayPopularFootballLeaguesNew component */}
      <TodayPopularFootballLeaguesNew
        selectedDate={currentDate}
        timeFilterActive={timeFilterActive}
        showTop20={timeFilterActive}
        liveFilterActive={liveFilterActive}
      />
    </>
  );
};

export default TodayMatchByTime;
