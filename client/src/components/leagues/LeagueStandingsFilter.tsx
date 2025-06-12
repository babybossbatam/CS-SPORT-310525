import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { getPopularLeagues, LeagueData } from "@/lib/leagueDataCache";
import { format, parseISO } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import MyCircularFlag from "@/components/common/MyCircularFlag";

interface Standing {
  rank: number;
  team: {
    id: number;
    name: string;
    logo: string;
  };
  points: number;
  goalsDiff: number;
  group?: string;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
  form: string;
  description?: string; // Added description property
}

// Helper function to check if this is a national team competition
const isNationalTeamCompetition = (leagueName: string): boolean => {
  const nationalTeamKeywords = [
    "world cup",
    "uefa nations",
    "euro",
    "copa america",
    "african cup",
    "asian cup",
    "gold cup",
    "confederations cup",
    "qualification",
    "qualifying",
    "international",
    "nations league",
    "wc qual",
    "uefa wc qualification",
    "fifa world cup",
  ];
  return nationalTeamKeywords.some((keyword) =>
    leagueName.toLowerCase().includes(keyword.toLowerCase()),
  );
};

const LeagueStandingsFilter = () => {
  const [popularLeagues, setPopularLeagues] = useState<LeagueData[]>([]);
  const [selectedLeague, setSelectedLeague] = useState("");
  const [selectedLeagueName, setSelectedLeagueName] = useState("");
  const [leaguesLoading, setLeaguesLoading] = useState(true);

  useEffect(() => {
    const loadLeagues = async () => {
      try {
        setLeaguesLoading(true);
        const leagues = await getPopularLeagues();

        // Filter to show only current/active leagues (exclude historical tournaments)
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed

        const currentLeagues = leagues.filter((league) => {
          const leagueName = league.name?.toLowerCase() || "";
          const country = league.country?.toLowerCase() || "";

          // Always exclude clearly historical tournaments that are not running now
          const isHistoricalTournament =
            // Past major tournaments (these run on specific cycles)
            (leagueName.includes("euro championship") &&
              currentYear !== 2024) ||
            (leagueName.includes("copa america") && currentYear !== 2024) ||
            (leagueName.includes("world cup") &&
              !leagueName.includes("qualification") &&
              currentYear !== 2026) ||
            (leagueName.includes("fifa club world cup") &&
              currentYear < 2025) ||
            // Friendlies are usually not league standings
            leagueName.includes("friendlies") ||
            // Completed tournaments
            (leagueName.includes("african cup of nations") &&
              currentYear !== 2025) ||
            (leagueName.includes("asian cup") && currentYear !== 2025) ||
            // Old qualification rounds that are completed
            (leagueName.includes("qualification") &&
              !leagueName.includes("champions league") &&
              !leagueName.includes("europa") &&
              currentMonth > 11) || // Most qualifications end by November
            // Women's leagues if specifically excluded
            leagueName.includes("women") ||
            // Youth leagues
            leagueName.includes("u21") ||
            leagueName.includes("under 21") ||
            leagueName.includes("u19") ||
            leagueName.includes("under 19") ||
            leagueName.includes("u17") ||
            leagueName.includes("under 17");

          // Keep current ongoing leagues
          const isCurrentLeague =
            // Major European leagues (run most of the year)
            leagueName.includes("premier league") ||
            leagueName.includes("la liga") ||
            leagueName.includes("serie a") ||
            leagueName.includes("bundesliga") ||
            leagueName.includes("ligue 1") ||
            // Continental competitions (ongoing)
            leagueName.includes("champions league") ||
            leagueName.includes("europa league") ||
            leagueName.includes("conference league") ||
            leagueName.includes("nations league") ||
            // Major leagues from other regions
            country.includes("brazil") ||
            country.includes("argentina") ||
            country.includes("saudi arabia") ||
            country.includes("united arab emirates") ||
            country.includes("egypt") ||
            country.includes("colombia") ||
            country.includes("united states") ||
            // Current ongoing competitions
            (leagueName.includes("qualification") && currentMonth <= 11) ||
            // Current cup competitions
            (leagueName.includes("cup") &&
              !leagueName.includes("world cup") &&
              !leagueName.includes("euro")) ||
            (leagueName.includes("copa") &&
              !leagueName.includes("copa america"));

          return !isHistoricalTournament && isCurrentLeague;
        });

        // Process leagues to ensure we have proper names and logos
        const processedLeagues = currentLeagues.map((league) => ({
          ...league,
          // Ensure we have a proper name, fallback to a meaningful default
          name: league.name || `${league.country} League`,
        }));

        setPopularLeagues(processedLeagues);

        // Set default selection to first league with valid ID
        if (processedLeagues.length > 0) {
          const firstValidLeague = processedLeagues.find(
            (league) => league && league.id && league.name,
          );
          if (firstValidLeague) {
            setSelectedLeague(firstValidLeague.id.toString());
            setSelectedLeagueName(firstValidLeague.name);
          }
        }
      } catch (error) {
        console.error("Failed to load league data:", error);

        // Fallback to popular leagues including recent international competitions
        const fallbackLeagues = [
          { id: 2, name: "UEFA Champions League", logo: "", country: "Europe" },
          { id: 3, name: "UEFA Europa League", logo: "", country: "Europe" },
          {
            id: 848,
            name: "UEFA Conference League",
            logo: "",
            country: "Europe",
          },
          { id: 5, name: "UEFA Nations League", logo: "", country: "Europe" },
          { id: 4, name: "Euro Championship", logo: "", country: "Europe" },
          { id: 15, name: "FIFA World Cup", logo: "", country: "World" },
          {
            id: 32,
            name: "UEFA WC Qualification - Group A",
            logo: "",
            country: "Europe",
          },
          {
            id: 33,
            name: "UEFA WC Qualification - Group B",
            logo: "",
            country: "Europe",
          },
          {
            id: 34,
            name: "UEFA WC Qualification - Group C",
            logo: "",
            country: "Europe",
          },
          {
            id: 35,
            name: "UEFA WC Qualification - Group D",
            logo: "",
            country: "Europe",
          },
          {
            id: 36,
            name: "UEFA WC Qualification - Group E",
            logo: "",
            country: "Europe",
          },
          {
            id: 37,
            name: "UEFA WC Qualification - Group F",
            logo: "",
            country: "Europe",
          },
          {
            id: 38,
            name: "UEFA WC Qualification - Group G",
            logo: "",
            country: "Europe",
          },
          { id: 39, name: "Premier League", logo: "", country: "England" },
          { id: 140, name: "La Liga", logo: "", country: "Spain" },
          { id: 135, name: "Serie A", logo: "", country: "Italy" },
          { id: 78, name: "Bundesliga", logo: "", country: "Germany" },
          { id: 61, name: "Ligue 1", logo: "", country: "France" },
          { id: 9, name: "Copa America", logo: "", country: "South America" },
          {
            id: 10,
            name: "African Cup of Nations",
            logo: "",
            country: "Africa",
          },
          { id: 11, name: "Asian Cup", logo: "", country: "Asia" },
        ];

        setPopularLeagues(fallbackLeagues);

        // Set default to Premier League
        setSelectedLeague("39");
        setSelectedLeagueName("Premier League");
      } finally {
        setLeaguesLoading(false);
      }
    };

    loadLeagues();
  }, []);

  // Get today's date string for daily caching
  const todayDateKey = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format

  const { data: standings, isLoading: standingsLoading } = useQuery({
    queryKey: ["standings", selectedLeague, todayDateKey],
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        `/api/leagues/${selectedLeague}/standings`,
      );
      return response.json();
    },
    enabled: !!selectedLeague && selectedLeague !== "",
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 24 * 60 * 60 * 1000, // 24 hours garbage collection
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const { data: fixtures, isLoading: fixturesLoading } = useQuery({
    queryKey: ["fixtures", selectedLeague, todayDateKey],
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        `/api/leagues/${selectedLeague}/fixtures`,
      );
      return response.json();
    },
    enabled: !!selectedLeague && selectedLeague !== "", // Only run when we have a valid league ID
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - keeps data fresh for the whole day
    gcTime: 24 * 60 * 60 * 1000, // 24 hours garbage collection
    refetchOnMount: false, // Don't refetch on mount if data exists for today
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
  });

  const isLoading = standingsLoading || fixturesLoading || leaguesLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>League Standings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className=" flex-row items-center justify-between h-10 column">
        <Select
          value={selectedLeague}
          onValueChange={(value) => {
            setSelectedLeague(value);
            const league = popularLeagues.find(
              (l) => l && l.id && l.name && l.id.toString() === value,
            );
            if (league && league.name) {
              setSelectedLeagueName(league.name);
            }
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue>
              <div className="flex items-center gap-2">
                <img
                  src={
                    popularLeagues.find(
                      (l) => l && l.id && l.id.toString() === selectedLeague,
                    )?.logo || "/assets/fallback-logo.svg"
                  }
                  alt={selectedLeagueName}
                  className="h-5 w-5 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "/assets/fallback-logo.svg";
                  }}
                />
                {selectedLeagueName}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent
            side="bottom"
            align="start"
            sideOffset={4}
            position="popper"
            className="z-[9999] min-w-[var(--radix-select-trigger-width)] max-w-[400px] max-h-60 overflow-auto"
            avoidCollisions={true}
            collisionPadding={8}
          >
            {popularLeagues
              .filter((league) => league && league.id && league.name)
              .map((league) => (
                <SelectItem key={league.id} value={league.id.toString()}>
                  <div className="flex items-center gap-2">
                    <img
                      src={league.logo || "/assets/fallback-logo.svg"}
                      alt={league.name}
                      className="h-5 w-5 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "/assets/fallback-logo.svg";
                      }}
                    />
                    {league.name}
                  </div>
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {standings?.league?.standings?.length > 0 ? (
            // Check if this is a group-based competition
            standings.league.standings.length > 1 ? (
              // Group-based standings (like World Cup Qualifications)
              <div className="space-y-6">
                {standings.league.standings.map(
                  (group: Standing[], groupIndex: number) => (
                    <div key={groupIndex}>
                      <h3 className="text-lg font-semibold mb-3 text-gray-700">
                        Group {String.fromCharCode(65 + groupIndex)}
                      </h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[40px] text-center">
                              #
                            </TableHead>
                            <TableHead className="pl-2 min-w-[200px]">
                              Team
                            </TableHead>
                            <TableHead className="text-center">P</TableHead>
                            <TableHead className="text-center">F:A</TableHead>
                            <TableHead className="text-center">+/-</TableHead>
                            <TableHead className="text-center">PTS</TableHead>
                            <TableHead className="text-center">W</TableHead>
                            <TableHead className="text-center">D</TableHead>
                            <TableHead className="text-center">L</TableHead>
                            <TableHead className="text-center">Next</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.map((standing: Standing) => {
                            const stats = standing.all;
                            const isNationalTeam =
                              isNationalTeamCompetition(selectedLeagueName);

                            return (
                              <TableRow
                                key={standing.team.id}
                                className="border-b border-gray-100"
                              >
                                <TableCell className="font-medium text-[0.9em] text-center pl-0">
                                  {standing.rank}
                                </TableCell>
                                <TableCell className="flex flex-col font-normal pl-2 ">
                                  <div className="flex items-center">
                                    {isNationalTeam ? (
                                      <MyCircularFlag
                                        teamName={standing.team.name}
                                        size="20px"
                                        className="mr-2"
                                        fallbackUrl={standing.team.logo}
                                      />
                                    ) : (
                                      <img
                                        src={standing.team.logo}
                                        alt={standing.team.name}
                                        className="mr-2 h-5 w-5 rounded-full"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src =
                                            "/assets/fallback-logo.svg";
                                          <span className="text-[0.9em]">
                                            {standing.team.name}
                                          </span>;
                                        }}
                                      />
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-center text-[0.9em]">
                                  {stats.played}
                                </TableCell>
                                <TableCell className="text-center text-[0.9em]">
                                  {stats.goals.for}:{stats.goals.against}
                                </TableCell>
                                <TableCell className="text-center text-[0.9em]">
                                  {standing.goalsDiff}
                                </TableCell>
                                <TableCell className="text-center font-bold text-[0.9em]">
                                  {standing.points}
                                </TableCell>
                                <TableCell className="text-center text-[0.9em]">
                                  {stats.win}
                                </TableCell>
                                <TableCell className="text-center text-[0.9em]">
                                  {stats.draw}
                                </TableCell>
                                <TableCell className="text-center text-[0.9em]">
                                  {stats.lose}
                                </TableCell>
                                <TableCell className="px-2 py-2">
                                  <div className="flex items-center justify-center">
                                    {group.find(
                                      (opponent) =>
                                        opponent.team.id !== standing.team.id &&
                                        opponent.rank > standing.rank,
                                    ) &&
                                      (isNationalTeam ? (
                                        <MyCircularFlag
                                          teamName={
                                            group.find(
                                              (opponent) =>
                                                opponent.team.id !==
                                                  standing.team.id &&
                                                opponent.rank > standing.rank,
                                            )?.team.name || ""
                                          }
                                          size="16px"
                                          className="hover:scale-110 transition-transform"
                                          fallbackUrl={
                                            group.find(
                                              (opponent) =>
                                                opponent.team.id !==
                                                  standing.team.id &&
                                                opponent.rank > standing.rank,
                                            )?.team.logo
                                          }
                                        />
                                      ) : (
                                        <img
                                          src={
                                            group.find(
                                              (opponent) =>
                                                opponent.team.id !==
                                                  standing.team.id &&
                                                opponent.rank > standing.rank,
                                            )?.team.logo
                                          }
                                          alt={`Next opponent`}
                                          className="w-4 h-4 hover:scale-110 transition-transform"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).src =
                                              "/assets/fallback-logo.svg";
                                          }}
                                        />
                                      ))}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ),
                )}
              </div>
            ) : (
              // Single league table
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px] text-center">#</TableHead>
                    <TableHead className="pl-4 min-w-[200px]">Team</TableHead>
                    <TableHead className="text-center">P</TableHead>
                    <TableHead className="text-center">F:A</TableHead>
                    <TableHead className="text-center">+/-</TableHead>
                    <TableHead className="text-center">PTS</TableHead>
                    <TableHead className="text-center">W</TableHead>
                    <TableHead className="text-center">D</TableHead>
                    <TableHead className="text-center">L</TableHead>
                    <TableHead className="text-center">Form</TableHead>
                    <TableHead className="text-center">Next</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {standings.league.standings[0]
                    ?.slice(0, 7)
                    .map((standing: Standing) => {
                      const stats = standing.all;
                      const isNationalTeam =
                        isNationalTeamCompetition(selectedLeagueName);

                      return (
                        <TableRow
                          key={standing.team.id}
                          className="border-b border-gray-100"
                        >
                          <TableCell className="font-medium text-[0.9em] text-center pl-0">
                            {standing.rank}
                          </TableCell>
                          <TableCell className="flex flex-col font-normal pl-4">
                            <div className="flex items-center">
                              {isNationalTeam ? (
                                <MyCircularFlag
                                  teamName={standing.team.name}
                                  size="20px"
                                  className="mr-2"
                                  fallbackUrl={standing.team.logo}
                                />
                              ) : (
                                <img
                                  src={standing.team.logo}
                                  alt={standing.team.name}
                                  className="mr-2 h-5 w-5 rounded-full"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                      "/assets/fallback-logo.svg";
                                  }}
                                />
                              )}
                              <div className="flex flex-col">
                                <div className="flex items-center">
                                  <span className="text-[0.9em] font-medium">
                                    {standing.team.name}
                                  </span>
                                  {standing.rank === 1 && (
                                    <span className="ml-2">👑</span>
                                  )}
                                </div>
                                {standing.description && (
                                  <span className="text-[0.75em] text-blue-500 font-medium">
                                    {standing.description}
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-[0.9em]">
                            {stats.played}
                          </TableCell>
                          <TableCell className="text-center text-[0.9em]">
                            {stats.goals.for}:{stats.goals.against}
                          </TableCell>
                          <TableCell className="text-center text-[0.9em]">
                            {standing.goalsDiff > 0 ? "+" : ""}
                            {standing.goalsDiff}
                          </TableCell>
                          <TableCell className="text-center font-bold text-[0.9em]">
                            {standing.points}
                          </TableCell>
                          <TableCell className="text-center text-[0.9em]">
                            {stats.win}
                          </TableCell>
                          <TableCell className="text-center text-[0.9em]">
                            {stats.draw}
                          </TableCell>
                          <TableCell className="text-center text-[0.9em]">
                            {stats.lose}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex gap-1 justify-center">
                              {standing.form
                                ?.split("")
                                .slice(-5)
                                .map((result, i) => (
                                  <span
                                    key={i}
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white ${
                                      result === "W"
                                        ? "bg-green-500"
                                        : result === "D"
                                          ? "bg-yellow-500"
                                          : "bg-red-500"
                                    }`}
                                  >
                                    {result}
                                  </span>
                                ))}
                            </div>
                          </TableCell>
                          <TableCell className="px-2 py-2 relative group">
                            <div className="flex items-center justify-center gap-2">
                              {standings?.league?.standings?.[0]?.find(
                                (opponent) =>
                                  opponent.team.id !== standing.team.id &&
                                  opponent.rank > standing.rank,
                              ) && (
                                <>
                                  {isNationalTeam ? (
                                    <MyCircularFlag
                                      teamName={
                                        standings?.league?.standings?.[0]?.find(
                                          (opponent) =>
                                            opponent.team.id !==
                                              standing.team.id &&
                                            opponent.rank > standing.rank,
                                        )?.team.name || ""
                                      }
                                      size="16px"
                                      className="hover:scale-110 transition-transform"
                                      fallbackUrl={
                                        standings?.league?.standings?.[0]?.find(
                                          (opponent) =>
                                            opponent.team.id !==
                                              standing.team.id &&
                                            opponent.rank > standing.rank,
                                        )?.team.logo
                                      }
                                    />
                                  ) : (
                                    <img
                                      src={
                                        standings?.league?.standings?.[0]?.find(
                                          (opponent) =>
                                            opponent.team.id !==
                                              standing.team.id &&
                                            opponent.rank > standing.rank,
                                        )?.team.logo
                                      }
                                      alt={`Next opponent: ${
                                        standings?.league?.standings?.[0]?.find(
                                          (opponent) =>
                                            opponent.team.id !==
                                              standing.team.id &&
                                            opponent.rank > standing.rank,
                                        )?.team.name
                                      }`}
                                      className="w-4 h-4 hover:scale-110 transition-transform"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src =
                                          "/assets/fallback-logo.svg";
                                      }}
                                    />
                                  )}
                                  <div className="absolute opacity-0 group-hover:opacity-100 bg-white shadow-lg rounded-md p-2 z-50 right-8 top-1/2 transform -translate-y-1/2 whitespace-nowrap transition-opacity duration-200">
                                    <div className="text-xs">
                                      <span className="font-medium">
                                        {standing.team.name}
                                      </span>
                                      <span className="mx-2">vs</span>
                                      <span className="font-medium">
                                        {
                                          standings?.league?.standings?.[0]?.find(
                                            (opponent) =>
                                              opponent.team.id !==
                                                standing.team.id &&
                                              opponent.rank > standing.rank,
                                          )?.team.name
                                        }
                                      </span>
                                      <div className="text-gray-500 mt-1">
                                        {(() => {
                                          const nextMatch = fixtures?.find(
                                            (f) =>
                                              (f.teams.home.id ===
                                                standing.team.id ||
                                                f.teams.away.id ===
                                                  standing.team.id) &&
                                              new Date(f.fixture.date) >
                                                new Date(),
                                          );
                                          return nextMatch
                                            ? format(
                                                parseISO(
                                                  nextMatch.fixture.date,
                                                ),
                                                "dd/MM/yyyy",
                                              )
                                            : "No upcoming matches";
                                        })()}
                                      </div>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  {standings.league.standings[0]
                    ?.slice(0, 7)
                    .map((standing: Standing) => {
                      return standing.description ? (
                        <TableRow
                          key={`${standing.team.id}-description`}
                          className="border-b border-gray-100"
                        >
                          <TableCell
                            colSpan={11}
                            className="text-[0.75em] text-gray-500 italic"
                          >
                            {standing.description}
                          </TableCell>
                        </TableRow>
                      ) : null;
                    })}
                </TableBody>
              </Table>
            )
          ) : (
            <div className="text-center py-8 text-gray-500">
              No standings data available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LeagueStandingsFilter;