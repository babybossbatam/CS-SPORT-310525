import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Calendar, Star } from "lucide-react";
import { format, parseISO } from "date-fns";
import MyCircularFlag from "../common/MyCircularFlag";
import LazyImage from "../common/LazyImage";
import "../../styles/MyLogoPositioning.css";
import "../../styles/TodaysMatchByCountryNew.css";

// Helper function to shorten team names
export const shortenTeamName = (teamName: string): string => {
  if (!teamName) return teamName;

  // Remove common suffixes that make names too long
  const suffixesToRemove = [
    "-sc",
    "-SC",
    " SC",
    " FC",
    " CF",
    " United",
    " City",
    " Islands",
    " Republic",
    " National Team",
    " U23",
    " U21",
    " U20",
    " U19",
  ];

  let shortened = teamName;
  for (const suffix of suffixesToRemove) {
    if (shortened.endsWith(suffix)) {
      shortened = shortened.replace(suffix, "");
      break;
    }
  }

  // Handle specific country name shortenings
  const countryMappings: { [key: string]: string } = {
    "Cape Verde Islands": "Cape Verde",
    "Central African Republic": "CAR",
    "Dominican Republic": "Dominican Rep",
    "Bosnia and Herzegovina": "Bosnia",
    "Trinidad and Tobago": "Trinidad",
    "Papua New Guinea": "Papua NG",
    "United Arab Emirates": "UAE",
    "Saudi Arabia": "Saudi",
    "South Africa": "S. Africa",
    "New Zealand": "New Zealand",
    "Costa Rica": "Costa Rica",
    "Puerto Rico": "Puerto Rico",
  };

  // Check if the team name matches any country mappings
  if (countryMappings[shortened]) {
    shortened = countryMappings[shortened];
  }

  // If still too long (more than 12 characters), intelligently shorten multi-word names
  if (shortened.length > 12) {
    const words = shortened.split(" ");

    if (words.length > 1) {
      // For multi-word names, shorten the last word progressively
      const lastWordIndex = words.length - 1;
      const lastWord = words[lastWordIndex];

      if (lastWord.length > 4) {
        // First try 3 characters
        words[lastWordIndex] = lastWord.substring(0, 3);
        shortened = words.join(" ");

        // If still too long, try 2 characters for the last word
        if (shortened.length > 12) {
          words[lastWordIndex] = lastWord.substring(0, 2);
          shortened = words.join(" ");
        }
      }
    } else {
      // For single long words, truncate to 10 characters
      shortened = shortened.substring(0, 10);
    }
  }

  return shortened.trim();
};

interface MyUpdatedMatchbyCountryProps {
  selectedDate: string;
  liveFilterActive?: boolean;
  timeFilterActive?: boolean;
  onMatchCardClick?: (fixture: any) => void;
}

// Mock data for static display
const mockCountriesData = [
  {
    country: "Brazil",
    flag: "https://hatscripts.github.io/circle-flags/flags/br.svg",
    leagues: {
      71: {
        league: {
          id: 71,
          name: "Serie A",
          logo: "https://media.api-sports.io/football/leagues/71.png",
          country: "Brazil"
        },
        matches: [
          {
            fixture: {
              id: 1001,
              date: "2025-06-19T20:00:00+00:00",
              status: { short: "NS", long: "Not Started", elapsed: null }
            },
            teams: {
              home: { id: 124, name: "Flamengo", logo: "/assets/fallback-logo.svg" },
              away: { id: 125, name: "Palmeiras", logo: "/assets/fallback-logo.svg" }
            },
            goals: { home: null, away: null },
            league: { id: 71, name: "Serie A", country: "Brazil" }
          },
          {
            fixture: {
              id: 1002,
              date: "2025-06-19T22:30:00+00:00",
              status: { short: "1H", long: "First Half", elapsed: 35 }
            },
            teams: {
              home: { id: 126, name: "Corinthians", logo: "/assets/fallback-logo.svg" },
              away: { id: 127, name: "São Paulo", logo: "/assets/fallback-logo.svg" }
            },
            goals: { home: 1, away: 0 },
            league: { id: 71, name: "Serie A", country: "Brazil" }
          }
        ],
        isPopular: true
      }
    },
    hasPopularLeague: true
  },
  {
    country: "England",
    flag: "https://flagcdn.com/w40/gb-eng.png",
    leagues: {
      39: {
        league: {
          id: 39,
          name: "Premier League",
          logo: "https://media.api-sports.io/football/leagues/39.png",
          country: "England"
        },
        matches: [
          {
            fixture: {
              id: 1003,
              date: "2025-06-19T15:00:00+00:00",
              status: { short: "FT", long: "Match Finished", elapsed: 90 }
            },
            teams: {
              home: { id: 33, name: "Manchester United", logo: "/assets/fallback-logo.svg" },
              away: { id: 40, name: "Liverpool", logo: "/assets/fallback-logo.svg" }
            },
            goals: { home: 2, away: 1 },
            league: { id: 39, name: "Premier League", country: "England" }
          }
        ],
        isPopular: true
      }
    },
    hasPopularLeague: true
  },
  {
    country: "World",
    flag: "/assets/world flag_new.png",
    leagues: {
      15: {
        league: {
          id: 15,
          name: "FIFA Club World Cup",
          logo: "https://media.api-sports.io/football/leagues/15.png",
          country: "World"
        },
        matches: [
          {
            fixture: {
              id: 1004,
              date: "2025-06-19T18:00:00+00:00",
              status: { short: "HT", long: "Halftime", elapsed: 45 }
            },
            teams: {
              home: { id: 541, name: "Al Ain", logo: "/assets/fallback-logo.svg" },
              away: { id: 496, name: "Juventus", logo: "/assets/fallback-logo.svg" }
            },
            goals: { home: 0, away: 2 },
            league: { id: 15, name: "FIFA Club World Cup", country: "World" }
          }
        ],
        isPopular: true
      }
    },
    hasPopularLeague: true
  }
];

const MyUpdatedMatchbyCountry: React.FC<MyUpdatedMatchbyCountryProps> = ({
  selectedDate,
  liveFilterActive = false,
  timeFilterActive = false,
  onMatchCardClick,
}) => {
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());
  const [expandedLeagues, setExpandedLeagues] = useState<Set<string>>(new Set(["Brazil-71", "England-39", "World-15"]));
  const [starredMatches, setStarredMatches] = useState<Set<number>>(new Set());

  const toggleCountry = (country: string) => {
    setExpandedCountries((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(country)) {
        newExpanded.delete(country);
      } else {
        newExpanded.add(country);
      }
      return newExpanded;
    });
  };

  const toggleLeague = (country: string, leagueId: number) => {
    const leagueKey = `${country}-${leagueId}`;
    const newExpanded = new Set(expandedLeagues);
    if (newExpanded.has(leagueKey)) {
      newExpanded.delete(leagueKey);
    } else {
      newExpanded.add(leagueKey);
    }
    setExpandedLeagues(newExpanded);
  };

  const toggleStarMatch = (matchId: number) => {
    setStarredMatches((prev) => {
      const newStarred = new Set(prev);
      if (newStarred.has(matchId)) {
        newStarred.delete(matchId);
      } else {
        newStarred.add(matchId);
      }
      return newStarred;
    });
  };

  // Get header title based on button states and selected date
  const getHeaderTitle = () => {
    if (liveFilterActive && timeFilterActive) {
      return "Popular Football Live Score";
    } else if (liveFilterActive && !timeFilterActive) {
      return "Live Football Scores";
    } else if (!liveFilterActive && timeFilterActive) {
      return "All Matches by Time";
    }
    return "Today's Football Matches by Country";
  };

  // Format the time for display in user's local timezone
  const formatMatchTime = (dateString: string) => {
    try {
      const utcDate = parseISO(dateString);
      return format(utcDate, "HH:mm");
    } catch (error) {
      return "--:--";
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row justify-between items-center space-y-0 p-2 border-b border-stone-200">
        <h3
          className="font-semibold"
          style={{
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            fontSize: "13.3px",
          }}
        >
          {getHeaderTitle()}
        </h3>
      </CardHeader>
      <CardContent className="p-0">
        <div className="country-matches-container todays-matches-by-country-container">
          {mockCountriesData.map((countryData) => {
            const isExpanded = expandedCountries.has(countryData.country);
            const totalMatches = Object.values(countryData.leagues).reduce(
              (sum: number, league: any) => sum + league.matches.length,
              0,
            );

            // Count live matches for badge
            const liveMatches = Object.values(countryData.leagues).reduce(
              (count: number, league: any) => {
                return (
                  count +
                  league.matches.filter((match: any) =>
                    ["LIVE", "1H", "HT", "2H", "ET"].includes(match.fixture.status.short),
                  ).length
                );
              },
              0,
            );

            return (
              <div
                key={countryData.country}
                className={`border-b border-gray-100 last:border-b-0 country-section ${
                  isExpanded ? "expanded" : "collapsed"
                }`}
              >
                <button
                  onClick={() => toggleCountry(countryData.country)}
                  className={`w-full p-4 flex items-center justify-between transition-colors pt-[12px] pb-[12px] font-normal text-[14.7px] country-header-button border-b border-stone-200 ${
                    isExpanded ? "expanded" : ""
                  }`}
                >
                  <div className="flex items-center gap-3 font-normal text-[14px]">
                    <img
                      src={countryData.flag}
                      alt={countryData.country}
                      className="w-5 h-3 object-cover rounded-sm shadow-sm"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/assets/fallback.svg";
                      }}
                    />
                    <span
                      className="font-medium text-gray-900"
                      style={{
                        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                        fontSize: "13.3px",
                      }}
                    >
                      {countryData.country}
                    </span>
                    <span
                      className="text-gray-500"
                      style={{
                        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                        fontSize: "13.3px",
                      }}
                    >
                      ({totalMatches})
                    </span>

                    {/* Live badges */}
                    {liveMatches > 0 && (
                      <span
                        className="bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium animate-pulse"
                        style={{
                          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                          fontSize: "13.3px",
                        }}
                      >
                        {liveMatches} LIVE
                      </span>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronUp className={`h-4 w-4 text-gray-500 chevron-icon rotated`} />
                  ) : (
                    <ChevronDown className={`h-4 w-4 text-gray-500 chevron-icon`} />
                  )}
                </button>
                {isExpanded && (
                  <div className={`bg-gray-50 border-t border-stone-200 league-content ${isExpanded ? "expanded" : "collapsed"}`}>
                    {Object.values(countryData.leagues).map((leagueData: any, leagueIndex: number) => {
                      const leagueKey = `${countryData.country}-${leagueData.league.id}`;
                      const isLeagueExpanded = expandedLeagues.has(leagueKey);

                      return (
                        <div key={leagueData.league.id} className="border-b border-stone-200 last:border-b-0">
                          {/* League Header */}
                          <button
                            onClick={() => toggleLeague(countryData.country, leagueData.league.id)}
                            className={`w-full flex items-center gap-2 p-2 bg-white border-b border-stone-200 transition-colors cursor-pointer group`}
                          >
                            <img
                              src={leagueData.league.logo || "/assets/fallback-logo.svg"}
                              alt={leagueData.league.name || "Unknown League"}
                              className="w-6 h-6 object-contain rounded-full"
                              style={{ backgroundColor: "transparent" }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/assets/fallback-logo.svg";
                              }}
                            />
                            <div className="flex flex-col flex-1 text-left">
                              <div className="flex items-center gap-2">
                                <span
                                  className="font-semibold text-gray-800 group-hover:underline transition-all duration-200"
                                  style={{
                                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                                    fontSize: "13.3px",
                                  }}
                                >
                                  {leagueData.league.name || "Unknown League"}
                                </span>
                                <span
                                  className="text-gray-500"
                                  style={{
                                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                                    fontSize: "13.3px",
                                  }}
                                >
                                  ({leagueData.matches.length})
                                </span>
                                {(() => {
                                  const liveMatchesInLeague = leagueData.matches.filter((match: any) =>
                                    ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(match.fixture.status.short),
                                  ).length;

                                  if (liveMatchesInLeague > 0) {
                                    return (
                                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold animate-pulse">
                                        {liveMatchesInLeague} LIVE
                                      </span>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                              <span className="text-xs text-gray-600">
                                {leagueData.league.country || "Unknown Country"}
                              </span>
                            </div>
                            <div className="flex gap-2 items-center">
                              {leagueData.isPopular && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                  Popular
                                </span>
                              )}
                            </div>
                          </button>

                          {/* Matches */}
                          {isLeagueExpanded && (
                            <div
                              className="space-y-0 league-matches-container"
                              style={{
                                animation: isLeagueExpanded ? "slideDown 0.3s ease-out" : "slideUp 0.3s ease-out",
                              }}
                            >
                              {leagueData.matches.map((match: any, matchIndex: number) => (
                                <div
                                  key={`${match.fixture.id}-${countryData.country}-${leagueData.league.id}-${matchIndex}`}
                                  className="match-card-container group"
                                  onClick={() => onMatchCardClick?.(match)}
                                  style={{
                                    cursor: onMatchCardClick ? "pointer" : "default",
                                  }}
                                >
                                  {/* Star Button */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleStarMatch(match.fixture.id);
                                    }}
                                    className="match-star-button"
                                    title="Add to favorites"
                                  >
                                    <Star
                                      className={`match-star-icon ${
                                        starredMatches.has(match.fixture.id) ? "starred" : ""
                                      }`}
                                    />
                                  </button>

                                  {/* Three-grid layout container */}
                                  <div className="match-three-grid-container">
                                    {/* Top Grid: Match Status */}
                                    <div className="match-status-top">
                                      {(() => {
                                        const status = match.fixture.status.short;

                                        // Live matches status
                                        if (["LIVE", "LIV", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(status)) {
                                          return (
                                            <div className="match-status-label status-live">
                                              {status === "HT" ? "Halftime" : `${match.fixture.status.elapsed || 0}'`}
                                            </div>
                                          );
                                        }

                                        // Finished matches status
                                        if (["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"].includes(status)) {
                                          return (
                                            <div className="match-status-label status-ended">
                                              {status === "FT" ? "Ended" : status}
                                            </div>
                                          );
                                        }

                                        return null;
                                      })()}
                                    </div>

                                    {/* Middle Grid: Main match content */}
                                    <div className="match-content-container">
                                      {/* Home Team Name */}
                                      <div
                                        className={`home-team-name ${
                                          match.goals.home !== null &&
                                          match.goals.away !== null &&
                                          match.goals.home > match.goals.away
                                            ? "winner"
                                            : ""
                                        }`}
                                      >
                                        {shortenTeamName(match.teams.home.name) || "Unknown Team"}
                                      </div>

                                      {/* Home team logo */}
                                      <div className="home-team-logo-container">
                                        <LazyImage
                                          src={match.teams.home.logo || "/assets/fallback-logo.svg"}
                                          alt={match.teams.home.name}
                                          title={match.teams.home.name}
                                          className="team-logo"
                                          style={{
                                            filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))",
                                          }}
                                          fallbackSrc="/assets/fallback-logo.svg"
                                        />
                                      </div>

                                      {/* Score/Time Center */}
                                      <div className="match-score-container">
                                        {(() => {
                                          const status = match.fixture.status.short;
                                          const fixtureDate = parseISO(match.fixture.date);

                                          // Live matches - show score only
                                          if (["LIVE", "LIV", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(status)) {
                                            return (
                                              <div className="match-score-display">
                                                <span className="score-number">{match.goals.home ?? 0}</span>
                                                <span className="score-separator">-</span>
                                                <span className="score-number">{match.goals.away ?? 0}</span>
                                              </div>
                                            );
                                          }

                                          // Finished matches - show score only
                                          if (["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"].includes(status)) {
                                            if (match.goals.home !== null && match.goals.away !== null) {
                                              return (
                                                <div className="match-score-display">
                                                  <span className="score-number">{match.goals.home}</span>
                                                  <span className="score-separator">-</span>
                                                  <span className="score-number">{match.goals.away}</span>
                                                </div>
                                              );
                                            }
                                          }

                                          // Upcoming matches - show time
                                          return (
                                            <div className="match-time-display" style={{ fontSize: "0.882em" }}>
                                              {formatMatchTime(match.fixture.date)}
                                            </div>
                                          );
                                        })()}
                                      </div>

                                      {/* Away team logo */}
                                      <div className="away-team-logo-container">
                                        <LazyImage
                                          src={match.teams.away.logo || "/assets/fallback-logo.svg"}
                                          alt={match.teams.away.name}
                                          title={match.teams.away.name}
                                          className="team-logo"
                                          style={{
                                            filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))",
                                          }}
                                          fallbackSrc="/assets/fallback-logo.svg"
                                        />
                                      </div>

                                      {/* Away Team Name */}
                                      <div
                                        className={`away-team-name ${
                                          match.goals.home !== null &&
                                          match.goals.away !== null &&
                                          match.goals.away > match.goals.home
                                            ? "winner"
                                            : ""
                                        }`}
                                      >
                                        {shortenTeamName(match.teams.away.name) || "Unknown Team"}
                                      </div>
                                    </div>

                                    {/* Bottom Grid: Penalty Result Status */}
                                    <div className="match-penalty-bottom">
                                      {/* Empty for now, can be used for penalty scores */}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default MyUpdatedMatchbyCountry;