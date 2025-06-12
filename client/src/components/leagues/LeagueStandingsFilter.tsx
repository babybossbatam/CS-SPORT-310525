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
        console.log(
          "🔄 Loading leagues with World Cup qualification support...",
        );
        const leagues = await getPopularLeagues();

        // Filter to show only current/active leagues (exclude historical tournaments)
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed

        console.log(`📅 Current year: ${currentYear}, month: ${currentMonth}`);

        const currentLeagues = leagues.filter((league) => {
          const leagueName = league.name?.toLowerCase() || "";
          const country = league.country?.toLowerCase() || "";

          // Check if this is a World Cup qualification league - ALWAYS INCLUDE THESE
          const isWCQualification =
            leagueName.includes("world cup") ||
            leagueName.includes("wc qual") ||
            leagueName.includes("uefa wc qualification");

          // If it's a World Cup qualification, always include it
          if (isWCQualification) {
            console.log(`🌍 WC Qualification league INCLUDED: ${league.name}`);
            return true;
          }

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
              currentMonth > 11) ||
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
            // Specific major leagues from other regions
            leagueName.includes("saudi pro league") ||
            leagueName.includes("egyptian premier league") ||
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

        console.log(`✅ Loaded ${processedLeagues.length} leagues total`);
        const wcQualLeagues = processedLeagues.filter(
          (l) =>
            l.name?.toLowerCase().includes("world cup") ||
            l.name?.toLowerCase().includes("wc qual") ||
            l.name?.toLowerCase().includes("uefa wc qualification"),
        );
        console.log(
          `🌍 World Cup qualification leagues found: ${wcQualLeagues.length}`,
          wcQualLeagues.map((l) => l.name),
        );

        // If no WC qualification leagues found, force use of fallback
        if (wcQualLeagues.length === 0) {
          console.log(
            "⚠️ No WC qualification leagues found in API response, using fallback",
          );
          throw new Error("No WC qualification leagues found");
        }

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

        // Enhanced fallback to popular leagues including ALL World Cup qualification groups
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
          // ALL UEFA WC Qualification Groups
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
          {
            id: 40,
            name: "UEFA WC Qualification - Group H",
            logo: "",
            country: "Europe",
          },
          {
            id: 41,
            name: "UEFA WC Qualification - Group I",
            logo: "",
            country: "Europe",
          },
          {
            id: 42,
            name: "UEFA WC Qualification - Group J",
            logo: "",
            country: "Europe",
          },
          {
            id: 43,
            name: "UEFA WC Qualification - Group K",
            logo: "",
            country: "Europe",
          },
          {
            id: 44,
            name: "UEFA WC Qualification - Group L",
            logo: "",
            country: "Europe",
          },
          // Other popular leagues
          { id: 39, name: "Premier League", logo: "", country: "England" },
          { id: 140, name: "La Liga", logo: "", country: "Spain" },
          { id: 135, name: "Serie A", logo: "", country: "Italy" },
          { id: 78, name: "Bundesliga", logo: "", country: "Germany" },
          { id: 61, name: "Ligue 1", logo: "", country: "France" },
          {
            id: 307,
            name: "Saudi Pro League",
            logo: "",
            country: "Saudi Arabia",
          },
          {
            id: 233,
            name: "Egyptian Premier League",
            logo: "",
            country: "Egypt",
          },
          { id: 9, name: "Copa America", logo: "", country: "South America" },
          {
            id: 10,
            name: "African Cup of Nations",
            logo: "",
            country: "Africa",
          },
          { id: 11, name: "Asian Cup", logo: "", country: "Asia" },
        ];

        console.log(
          "🔄 Using fallback leagues with all WC qualification groups",
        );
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
      <CardHeader className=" flex-row items-center justify-between h-10 column px-0 pt-4">
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
          <SelectTrigger className=" w-full border-0 mt-2">
            <SelectValue>
              <div className="flex items-center gap-2">
                <img
                  src={
                    popularLeagues.find(
                      (l) => l && l.id && l.id.toString() === selectedLeague,
                    )?.logo || "/assets/fallback-logo.svg"
                  }
                  alt={selectedLeagueName}
                  className="h-6 w-6 object-contain"
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
            className="z-[9999] min-w-[var(--radix-select-trigger-width)] max-w-[400px] max-h-52 overflow-auto"
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
      <CardContent className="px-0">
        <div className="relative">
          {standings?.league?.standings?.length > 0 ? (
            // Check if this is a group-based competition
            standings.league.standings.length > 1 ? (
              // Group-based standings (like World Cup Qualifications)
              <div className="space-y-6">
                {standings.league.standings.map(
                  (group: Standing[], groupIndex: number) => (
                    <div key={groupIndex}>
                      <h3 className="text-xs font-regular mx-4 mt-2 mb-2 text-gray-700">
                        Group {String.fromCharCode(65 + groupIndex)}
                      </h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[40px] text-center"></TableHead>
                            <TableHead className="pl-2 min-w-[200px]"></TableHead>
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
                                    <img
                                      src={standing.team.logo}
                                      alt={standing.team.name}
                                      className="mr-2 h-5 w-5 rounded-md object-contain"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src =
                                          "/assets/fallback-logo.svg";
                                      }}
                                    />
                                    <span className="text-[0.9em]">
                                      {standing.team.name}
                                    </span>
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
                                    ) && (
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
                                        className="w-4 h-4 rounded-sm object-contain hover:scale-110 transition-transform"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src =
                                            "/assets/fallback-logo.svg";
                                        }}
                                      />
                                    )}
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
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 border-b border-gray-100">
                      <TableHead className="text-left text-xs font-regular text-gray-400  px-3 w-[40px]"></TableHead>
                      <TableHead className="text-left text-xs font-regular text-gray-400 py-1 px-3 min-w-[180px]"></TableHead>
                      <TableHead className="text-center text-xs font-regular text-gray-400  px-2 w-[40px]">
                        P
                      </TableHead>
                      <TableHead className="text-center text-xs font-regular text-gray-400  px-2 w-[60px]">
                        F:A
                      </TableHead>
                      <TableHead className="text-center text-xs font-regular text-gray-400 px-2 w-[50px]">
                        +/-
                      </TableHead>
                      <TableHead className="text-center text-xs font-regular text-gray-900  px-2 w-[50px]">
                        PTS
                      </TableHead>
                      <TableHead className="text-center text-xs font-semi-bold text-gray-400 py-3 px-2 w-[40px]">
                        W
                      </TableHead>
                      <TableHead className="text-center text-xs font-regular text-gray-400  px-2 w-[40px]">
                        D
                      </TableHead>
                      <TableHead className="text-center text-xs font-regular text-gray-400  px-2 w-[40px]">
                        L
                      </TableHead>
                      <TableHead className="text-center text-xs font-regular text-gray-400 mt-0 mb-0 py-0 px-2 w-[100px]">
                        Form
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {standings.league.standings[0]
                      ?.slice(0, 7)
                      .map((standing: Standing, index: number) => {
                        const stats = standing.all;
                        const isNationalTeam =
                          isNationalTeamCompetition(selectedLeagueName);

                        // Determine qualification status color
                        const getQualificationColor = (
                          rank: number,
                          description?: string,
                        ) => {
                          if (!description) return "bg-transparent";

                          const desc = description.toLowerCase();
                          if (
                            desc.includes("champions league") ||
                            desc.includes("promotion")
                          ) {
                            return "bg-green-500";
                          } else if (
                            desc.includes("europa") ||
                            desc.includes("conference")
                          ) {
                            return "bg-blue-500";
                          } else if (
                            desc.includes("relegation") ||
                            desc.includes("play-off")
                          ) {
                            return "bg-red-500";
                          }
                          return "bg-gray-400";
                        };

                        return (
                          <TableRow
                            key={standing.team.id}
                            className="border-b border-gray-100 hover:bg-gray-100 transition-colors"
                          >
                            <TableCell className="py-0 mt-0 mb-0 px-0 relative">
                              <div className="flex items-center">
                                <div
                                  className={`w-1 h-8 rounded-r-sm mr-2 ${getQualificationColor(standing.rank, standing.description)}`}
                                />
                                <span className="text-sm font-medium text-gray-900">
                                  {standing.rank}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="py-2 px-3">
                              <div className="flex items-center">
                                <img
                                  src={standing.team.logo}
                                  alt={standing.team.name}
                                  className="mr-3 h-6 w-6 rounded-md flex-shrink-0 object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                      "/assets/fallback-logo.svg";
                                  }}
                                />
                                <div className="flex flex-col min-w-0 flex-1">
                                  <span className="text-[0.85rem] font-semi-bold text-gray-900 truncate">
                                    {standing.team.name}
                                  </span>
                                  {standing.description && (
                                    <span className="text-[0.65rem] text-gray-500 truncate">
                                      {standing.description}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center py-2 px-2 text-sm text-gray-700">
                              {stats.played}
                            </TableCell>
                            <TableCell className="text-center py-2 px-2 text-sm text-gray-700">
                              <span className="font-medium">
                                {stats.goals.for}
                              </span>
                              <span className="text-gray-400 mx-0.5">:</span>
                              <span>{stats.goals.against}</span>
                            </TableCell>
                            <TableCell className="text-center py-2 px-2 text-sm">
                              <span
                                className={`font-medium ${
                                  standing.goalsDiff > 0
                                    ? "text-green-600"
                                    : standing.goalsDiff < 0
                                      ? "text-red-600"
                                      : "text-gray-700"
                                }`}
                              >
                                {standing.goalsDiff > 0 ? "+" : ""}
                                {standing.goalsDiff}
                              </span>
                            </TableCell>
                            <TableCell className="text-center py-2 px-2 text-sm font-bold text-gray-900">
                              {standing.points}
                            </TableCell>
                            <TableCell className="text-center py-2 px-2 text-sm text-gray-700">
                              {stats.win}
                            </TableCell>
                            <TableCell className="text-center py-2 px-2 text-sm text-gray-700">
                              {stats.draw}
                            </TableCell>
                            <TableCell className="text-center py-2 px-2 text-sm text-gray-700">
                              {stats.lose}
                            </TableCell>
                            <TableCell className="text-center py-2 px-2">
                              <div className="flex gap-1 justify-center">
                                {standing.form
                                  ?.split("")
                                  .slice(-5)
                                  .map((result, i) => (
                                    <span
                                      key={i}
                                      className={`w-4 h-4 rounded-sm flex items-center justify-center text-xs font-bold text-white ${
                                        result === "W"
                                          ? "bg-green-500"
                                          : result === "D"
                                            ? "bg-yellow-500"
                                            : result === "L"
                                              ? "bg-red-500"
                                              : "bg-gray-400"
                                      }`}
                                    >
                                      {result}
                                    </span>
                                  ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </div>
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
