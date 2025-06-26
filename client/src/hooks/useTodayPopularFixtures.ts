
import { useMemo } from 'react';
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { MySmartTimeFilter } from "@/lib/MySmartTimeFilter";
import { shouldExcludeFromPopularLeagues, isRestrictedUSLeague } from "@/lib/MyPopularLeagueExclusion";
import { useCachedQuery } from "@/lib/cachingHelper";

export const useTodayPopularFixtures = (selectedDate: string) => {
  const today = new Date().toISOString().slice(0, 10);
  const isToday = selectedDate === today;
  const isFuture = selectedDate > today;
  
  const cacheMaxAge = isFuture ? 4 * 60 * 60 * 1000 : isToday ? 2 * 60 * 60 * 1000 : 30 * 60 * 1000;
  const fixturesQueryKey = ["all-fixtures-by-date", selectedDate];

  const {
    data: fixtures = [],
    isLoading,
    isFetching,
  } = useCachedQuery(
    fixturesQueryKey,
    async () => {
      console.log(`🔄 [useTodayPopularFixtures] Fetching data for date: ${selectedDate}`);
      const response = await apiRequest(
        `/api/fixtures/date/${selectedDate}?all=true`,
        "GET"
      );
      const data = await response.json();
      console.log(`✅ [useTodayPopularFixtures] Received ${data?.length || 0} fixtures for ${selectedDate}`);
      return data;
    },
    {
      enabled: !!selectedDate,
      maxAge: cacheMaxAge,
      backgroundRefresh: false,
      staleTime: cacheMaxAge,
      gcTime: cacheMaxAge * 2,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  );

  // Apply the same filtering logic as TodayPopularFootballLeaguesNew
  const filteredFixtures = useMemo(() => {
    if (!fixtures?.length) return [];

    const POPULAR_LEAGUES = [
      39, 45, 48, // England: Premier League, FA Cup, EFL Cup
      140, 143, // Spain: La Liga, Copa del Rey
      135, 137, // Italy: Serie A, Coppa Italia
      78, 81, // Germany: Bundesliga, DFB Pokal
      61, 66, // France: Ligue 1, Coupe de France
      301, // UAE Pro League
      233, // Egyptian Premier League
      15, // FIFA Club World Cup
      914, 848, // COSAFA Cup, UEFA Conference League
      2, 3, // Champions League, Europa League
    ];

    const POPULAR_COUNTRIES_ORDER = [
      "England",
      "Spain",
      "Italy",
      "Germany",
      "France",
      "World",
      "Europe",
      "South America",
      "Brazil",
      "Saudi Arabia",
      "Egypt",
      "Colombia",
      "United States",
      "USA",
      "US",
      "United Arab Emirates",
      "United-Arab-Emirates",
    ];

    const filtered = fixtures.filter((fixture) => {
      // Apply smart time filtering
      if (fixture.fixture.date && fixture.fixture.status?.short) {
        const smartResult = MySmartTimeFilter.getSmartTimeLabel(
          fixture.fixture.date,
          fixture.fixture.status.short,
          selectedDate + "T12:00:00Z",
        );

        const today = new Date();
        const todayString = today.toISOString().slice(0, 10);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowString = tomorrow.toISOString().slice(0, 10);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.toISOString().slice(0, 10);

        const shouldInclude = (() => {
          if (selectedDate === tomorrowString && smartResult.label === "tomorrow") return true;
          if (selectedDate === todayString && smartResult.label === "today") return true;
          if (selectedDate === yesterdayString && smartResult.label === "yesterday") return true;
          if (
            selectedDate !== todayString &&
            selectedDate !== tomorrowString &&
            selectedDate !== yesterdayString
          ) {
            if (smartResult.label === "custom" && smartResult.isWithinTimeRange) return true;
          }
          return false;
        })();

        if (!shouldInclude) {
          return false;
        }
      }

      // Apply exclusion filters
      if (shouldExcludeFromPopularLeagues(
        fixture.league.name,
        fixture.teams.home.name,
        fixture.teams.away.name,
        fixture.league.country,
      )) {
        return false;
      }

      if (isRestrictedUSLeague(fixture.league.id, fixture.league.country)) {
        return false;
      }

      if (!fixture.league.country) {
        return false;
      }

      const leagueId = fixture.league?.id;
      const country = fixture.league?.country?.toLowerCase() || "";
      const leagueName = fixture.league?.name?.toLowerCase() || "";

      // Check if it's a popular league
      const isPopularLeague = POPULAR_LEAGUES.includes(leagueId);

      // Check if it's from a popular country
      const isFromPopularCountry = POPULAR_COUNTRIES_ORDER.some(
        (popularCountry) => country.includes(popularCountry.toLowerCase()),
      );

      // Check if it's an international competition
      const isInternationalCompetition =
        leagueName.includes("champions league") ||
        leagueName.includes("europa league") ||
        leagueName.includes("conference league") ||
        leagueName.includes("uefa") ||
        leagueName.includes("world cup") ||
        leagueName.includes("fifa club world cup") ||
        leagueName.includes("fifa") ||
        leagueName.includes("conmebol") ||
        leagueName.includes("copa america") ||
        leagueName.includes("copa libertadores") ||
        leagueName.includes("copa sudamericana") ||
        leagueName.includes("libertadores") ||
        leagueName.includes("sudamericana") ||
        (leagueName.includes("friendlies") && !leagueName.includes("women")) ||
        (leagueName.includes("international") && !leagueName.includes("women")) ||
        country.includes("world") ||
        country.includes("europe") ||
        country.includes("international");

      return isPopularLeague || isFromPopularCountry || isInternationalCompetition;
    });

    console.log(`🔍 [useTodayPopularFixtures] Filtered ${fixtures.length} fixtures to ${filtered.length} for ${selectedDate}`);
    return filtered;
  }, [fixtures, selectedDate]);

  return {
    filteredFixtures,
    isLoading,
    isFetching,
  };
};
