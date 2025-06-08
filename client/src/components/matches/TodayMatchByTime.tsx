import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp, Calendar, Star } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { useDispatch, useSelector } from "react-redux";
import { RootState, userActions } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { safeSubstring } from "@/lib/dateUtilsUpdated";
import { shortenTeamName } from "./TodayPopularFootballLeaguesNew";
import { getCountryFlagWithFallbackSync } from "../../lib/flagUtils";
import { isNationalTeam } from "../../lib/teamLogoSources";
import "../../styles/MyLogoPositioning.css";
import LazyMatchItem from "./LazyMatchItem";
import LazyImage from "../common/LazyImage";

interface TodayMatchByTimeProps {
  selectedDate: string;
  timeFilterActive?: boolean;
  liveFilterActive?: boolean;
  todayPopularFixtures?: any[]; // Accept TodayPopularFootballLeaguesNew fixtures as props
}

const TodayMatchByTime: React.FC<TodayMatchByTimeProps> = ({
  selectedDate,
  timeFilterActive = false,
  liveFilterActive = false,
  todayPopularFixtures = [],
}) => {
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(
    new Set(),
  );
  const [starredMatches, setStarredMatches] = useState<Set<number>>(new Set());

  const dispatch = useDispatch();
  const { toast } = useToast();
  const favoriteTeams = useSelector(
    (state: RootState) => state.user.favoriteTeams,
  );

  // Use only the passed fixtures from TodayPopularFootballLeaguesNew
  const fixtures = todayPopularFixtures;

  console.log(`📋 [TodayMatchByTime] Using cached fixtures:`, {
    selectedDate,
    fixturesCount: fixtures.length,
    source: 'TodayPopularFootballLeaguesNew (cached)',
    timeFilterActive,
    liveFilterActive
  });

  // Group fixtures by country and league - no additional filtering since data is already filtered
  const fixturesByCountry = fixtures.reduce(
    (acc: any, fixture: any) => {
      // Basic null checks only
      if (!fixture || !fixture.league || !fixture.fixture || !fixture.teams) {
        return acc;
      }

      const league = fixture.league;
      const country = league.country || "World";
      const leagueId = league.id;

      if (!acc[country]) {
        acc[country] = {
          country,
          flag: getCountryFlagWithFallbackSync(country, league.flag),
          leagues: {},
          hasPopularLeague: true,
        };
      }

      if (!acc[country].leagues[leagueId]) {
        acc[country].leagues[leagueId] = {
          league: {
            ...league,
            logo: league.logo || "https://media.api-sports.io/football/leagues/1.png",
          },
          matches: [],
          isPopular: true,
          isPopularForCountry: true,
          isFriendlies: league.name?.toLowerCase().includes("friendlies") || false,
        };
      }

      // Add fixture with fallback logos
      if (fixture.teams.home && fixture.teams.away) {
        acc[country].leagues[leagueId].matches.push({
          ...fixture,
          teams: {
            home: {
              ...fixture.teams.home,
              logo: fixture.teams.home.logo || "/assets/fallback-logo.svg",
            },
            away: {
              ...fixture.teams.away,
              logo: fixture.teams.away.logo || "/assets/fallback-logo.svg",
            },
          },
        });
      }

      return acc;
    },
    {},
  );

  // All countries are already filtered by TodayPopularFootballLeaguesNew
  const filteredCountries = Object.values(fixturesByCountry);

  // Simple sorting by country name since filtering is already done
  const sortedCountries = useMemo(() => {
    return filteredCountries.sort((a: any, b: any) => {
      const countryA = a.country || "";
      const countryB = b.country || "";
      return countryA.localeCompare(countryB);
    });
  }, [filteredCountries]);

  // Apply live filters if needed
  const liveFilteredCountries = useMemo(() => {
    if (!liveFilterActive) return sortedCountries;

    return sortedCountries
      .map((countryData) => {
        const updatedLeagues = Object.entries(countryData.leagues).reduce(
          (acc: any, [leagueId, leagueData]: any) => {
            const updatedMatches = leagueData.matches.filter((match: any) => {
              return (
                match.fixture.status.short === "LIVE" ||
                match.fixture.status.short === "1H" ||
                match.fixture.status.short === "HT" ||
                match.fixture.status.short === "2H" ||
                match.fixture.status.short === "ET" ||
                match.fixture.status.short === "BT" ||
                match.fixture.status.short === "P" ||
                match.fixture.status.short === "INT"
              );
            });

            if (updatedMatches.length > 0) {
              acc[leagueId] = {
                ...leagueData,
                matches: updatedMatches,
              };
            }
            return acc;
          },
          {},
        );

        return {
          ...countryData,
          leagues: updatedLeagues,
        };
      })
      .filter((countryData) => Object.keys(countryData.leagues).length > 0);
  }, [sortedCountries, liveFilterActive]);

  // Use all filtered countries
  const finalCountries = liveFilteredCountries;

  const toggleStarMatch = (fixtureId: number) => {
    const newStarred = new Set(starredMatches);
    if (newStarred.has(fixtureId)) {
      newStarred.delete(fixtureId);
    } else {
      newStarred.add(fixtureId);
    }
    setStarredMatches(newStarred);
  };

  const getHeaderTitle = () => {
    if (liveFilterActive && timeFilterActive) {
      return "Popular Football Live Score";
    } else if (!liveFilterActive && timeFilterActive) {
      return "Popular Leagues by Time";
    }

    const selectedDateObj = new Date(selectedDate);

    if (isToday(selectedDateObj)) {
      return "Today's Popular Leagues by Time";
    } else if (isYesterday(selectedDateObj)) {
      return "Yesterday's Popular Leagues by Time";
    } else if (isTomorrow(selectedDateObj)) {
      return "Tomorrow's Popular Leagues by Time";
    } else {
      return `Popular Leagues - ${format(selectedDateObj, "MMM d, yyyy")}`;
    }
  };
  // No loading state needed since we're using cached data from parent

  if (!fixtures.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-500">No matches available for this date</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Single consolidated card with ALL matches sorted by league A-Z, then by status priority */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <span>{getHeaderTitle()}</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-0">
            {finalCountries.flatMap((countryData: any) => {
              return Object.entries(countryData.leagues).map(
                ([leagueId, leagueData]: any) => {
                  return leagueData.matches.map((match: any) => (
                    <LazyMatchItem
                      key={match.fixture.id}
                      match={match}
                      toggleStarMatch={toggleStarMatch}
                      starredMatches={starredMatches}
                    />
                  ));
                },
              );
            })}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default TodayMatchByTime;