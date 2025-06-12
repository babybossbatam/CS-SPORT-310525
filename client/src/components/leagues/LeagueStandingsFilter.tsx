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
import { teamColorMap } from "@/lib/colorExtractor";

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

  // Function to get team color from logo or team name
  const getTeamColor = (teamName: string, rank: number): string => {
    // Use CS SPORT header gradient colors for top 2 positions
    if (rank === 1) return "#F59E0B"; // Amber-500 (from CS SPORT gradient)
    if (rank === 2) return "#EA580C"; // Orange-600 (from CS SPORT gradient)
    if (rank === 3) return "#93C5FD"; // Lighter blue for 3rd place

    const normalizedName = teamName.toLowerCase();

    // Check if team exists in our color map for rank 4+
    for (const [key, colors] of Object.entries(teamColorMap)) {
      if (normalizedName.includes(key)) {
        return colors.accent;
      }
    }

    // Fallback colors for rank 4+
    return "#6B7280"; // Gray for other positions
  };

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

  const getChampionshipTitle = (rank: number, description?: string): string => {
    if (!description) return "";

    // For rank 1, generate an actual championship title instead of promotion description
    if (rank === 1) {
      // Don't show promotion/qualification descriptions for champions
      if (
        description.toLowerCase().includes("promotion") ||
        description.toLowerCase().includes("play offs") ||
        description.toLowerCase().includes("qualification")
      ) {
        // Generate a proper championship title based on league name
        if (selectedLeagueName.toLowerCase().includes("premier league")) {
          return "Won the Premier League";
        } else if (selectedLeagueName.toLowerCase().includes("la liga")) {
          return "Won La Liga";
        } else if (selectedLeagueName.toLowerCase().includes("serie a")) {
          return "Won Serie A";
        } else if (selectedLeagueName.toLowerCase().includes("bundesliga")) {
          return "Won the Bundesliga";
        } else if (selectedLeagueName.toLowerCase().includes("ligue 1")) {
          return "Won Ligue 1";
        } else if (
          selectedLeagueName.toLowerCase().includes("champions league")
        ) {
          return "UEFA Champions League Winners";
        } else if (selectedLeagueName.toLowerCase().includes("europa league")) {
          return "UEFA Europa League Winners";
        } else if (
          selectedLeagueName.toLowerCase().includes("conference league")
        ) {
          return "UEFA Conference League Winners";
        } else if (selectedLeagueName.toLowerCase().includes("world cup")) {
          return "World Cup Winners";
        } else if (
          selectedLeagueName.toLowerCase().includes("nations league")
        ) {
          return "Nations League Winners";
        } else {
          // Generic championship title
          return `${selectedLeagueName} Champions`;
        }
      }

      // If it's already a proper title (not promotion), show it
      return description;
    }

    // For ranks 2 and 3, generate runner-up titles
    if (rank === 2) {
      if (
        description?.toLowerCase().includes("promotion") ||
        description?.toLowerCase().includes("play offs") ||
        description?.toLowerCase().includes("qualification")
      ) {
        if (selectedLeagueName.toLowerCase().includes("premier league")) {
          return "Premier League Runner-up";
        } else if (selectedLeagueName.toLowerCase().includes("la liga")) {
          return "La Liga Runner-up";
        } else if (selectedLeagueName.toLowerCase().includes("serie a")) {
          return "Serie A Runner-up";
        } else if (selectedLeagueName.toLowerCase().includes("bundesliga")) {
          return "Bundesliga Runner-up";
        } else if (selectedLeagueName.toLowerCase().includes("ligue 1")) {
          return "Ligue 1 Runner-up";
        } else if (
          selectedLeagueName.toLowerCase().includes("champions league")
        ) {
          return "UEFA Champions League Runner-up";
        } else if (selectedLeagueName.toLowerCase().includes("europa league")) {
          return "UEFA Europa League Runner-up";
        } else if (
          selectedLeagueName.toLowerCase().includes("conference league")
        ) {
          return "UEFA Conference League Runner-up";
        } else {
          return `${selectedLeagueName} Runner-up`;
        }
      }
      return description;
    }

    if (rank === 3) {
      if (
        description?.toLowerCase().includes("promotion") ||
        description?.toLowerCase().includes("play offs") ||
        description?.toLowerCase().includes("qualification")
      ) {
        if (selectedLeagueName.toLowerCase().includes("premier league")) {
          return "Premier League 3rd Place";
        } else if (selectedLeagueName.toLowerCase().includes("la liga")) {
          return "La Liga 3rd Place";
        } else if (selectedLeagueName.toLowerCase().includes("serie a")) {
          return "Serie A 3rd Place";
        } else if (selectedLeagueName.toLowerCase().includes("bundesliga")) {
          return "Bundesliga 3rd Place";
        } else if (selectedLeagueName.toLowerCase().includes("ligue 1")) {
          return "Ligue 1 3rd Place";
        } else if (
          selectedLeagueName.toLowerCase().includes("champions league")
        ) {
          return "UEFA Champions League 3rd Place";
        } else if (selectedLeagueName.toLowerCase().includes("europa league")) {
          return "UEFA Europa League 3rd Place";
        } else if (
          selectedLeagueName.toLowerCase().includes("conference league")
        ) {
          return "UEFA Conference League 3rd Place";
        } else {
          return `${selectedLeagueName} 3rd Place`;
        }
      }
      return description;
    }

    // For other ranks, return the description as is (qualification/relegation info)
    return description;
  };

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
                                className="border-b  border-gray-100"
                              >
                                <TableCell className="font-medium text-[0.9dem] text-center px-4 py-0">
                                  {standing.rank}
                                </TableCell>
                                <TableCell className="flex flex-col font-normal pl-2 ">
                                  <div className="flex items-center">
                                    {isNationalTeam ? (
                                      <div className="mr-2">
                                        <MyCircularFlag
                                          teamName={standing.team.name}
                                          fallbackUrl={standing.team.logo}
                                          alt={standing.team.name}
                                          size="28px"
                                          className="popular-leagues-size"
                                        />
                                      </div>
                                    ) : (
                                      <img
                                        src={standing.team.logo}
                                        alt={standing.team.name}
                                        className=" h-5 w-5 rounded-md object-cover"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src =
                                            "/assets/fallback-logo.svg";
                                        }}
                                      />
                                    )}
                                    <span className="text-[0.9em] px-1">
                                      {standing.team.name}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center text-[0.9em] px-1">
                                  {stats.played}
                                </TableCell>
                                <TableCell className="text-center text-[0.9em] px-1">
                                  {stats.goals.for}:{stats.goals.against}
                                </TableCell>
                                <TableCell className="text-center text-[0.9em] px-1">
                                  {standing.goalsDiff}
                                </TableCell>
                                <TableCell className="text-center font-bold text-[0.9em] px-1">
                                  {standing.points}
                                </TableCell>
                                <TableCell className="text-center text-[0.9em] px-1">
                                  {stats.win}
                                </TableCell>
                                <TableCell className="text-center text-[0.9em] px-1">
                                  {stats.draw}
                                </TableCell>
                                <TableCell className="text-center text-[0.9em] px-1">
                                  {stats.lose}
                                </TableCell>
                                <TableCell className="px-1 py-1">
                                  <div className="flex items-center justify-center">
                                    {group.find(
                                      (opponent) =>
                                        opponent.team.id !== standing.team.id &&
                                        opponent.rank > standing.rank,
                                    ) && (
                                      <>
                                        {isNationalTeam ? (
                                          <div className="hover:scale-110 transition-transform">
                                            <MyCircularFlag
                                              teamName={
                                                group.find(
                                                  (opponent) =>
                                                    opponent.team.id !==
                                                      standing.team.id &&
                                                    opponent.rank > standing.rank,
                                                )?.team.name || ""
                                              }
                                              fallbackUrl={
                                                group.find(
                                                  (opponent) =>
                                                    opponent.team.id !==
                                                      standing.team.id &&
                                                    opponent.rank > standing.rank,
                                                )?.team.logo
                                              }
                                              alt={`Next opponent`}
                                              size="20px"
                                              className="popular-leagues-size"
                                            />
                                          </div>
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
                                            className="w-5 h-5 rounded-full object-contain hover:scale-110 transition-transform"
                                            onError={(e) => {
                                              (e.target as HTMLImageElement).src =
                                                "/assets/fallback-logo.svg";
                                            }}
                                          />
                                        )}
                                      </>
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
                      <TableHead className="text-center text-xs font-semi-bold text-gray-600 mt-0 mb-0 py-0 px-1 w-[100px]">
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
                                {standing.rank <= 3 && (
                                  <div
                                    className="w-1 h-8 rounded-r-sm mr-2"
                                    style={{
                                      backgroundColor:
                                        standing.rank <= 3
                                          ? getTeamColor(
                                              standing.team.name,
                                              standing.rank,
                                            )
                                          : standing.rank <= 4 &&
                                              standing.description
                                                ?.toLowerCase()
                                                .includes("champions")
                                            ? "#4A90E2"
                                            : standing.description
                                                  ?.toLowerCase()
                                                  .includes("europa")
                                              ? "#4A90E2"
                                              : standing.description
                                                    ?.toLowerCase()
                                                    .includes("conference")
                                                ? "#4A90E2"
                                                : "#6B7280",
                                    }}
                                  />
                                )}
                                <span
                                  className={`text-sm font-medium text-gray-900 ${standing.rank <= 3 ? "" : "ml-3"}`}
                                >
                                  {standing.rank}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="py-0 px-2">
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
                                  <span className="text-xs font-medium text-gray-900 truncate hover:underline cursor-pointer">
                                    {standing.team.name}
                                  </span>
                                  {standing.rank <= 3 && (
                                    <span
                                      className="text-[0.65rem] font-medium truncate"
                                      style={{
                                        color:
                                          standing.rank <= 3
                                            ? getTeamColor(
                                                standing.team.name,
                                                standing.rank,
                                              )
                                            : standing.description
                                                  ?.toLowerCase()
                                                  .includes(
                                                    "champions league elite",
                                                  )
                                              ? "#4A90E2"
                                              : standing.description
                                                    ?.toLowerCase()
                                                    .includes(
                                                      "champions league",
                                                    )
                                                ? "#4A90E2"
                                                : standing.description
                                                      ?.toLowerCase()
                                                      .includes("europa")
                                                  ? "#17A2B8"
                                                  : standing.description
                                                        ?.toLowerCase()
                                                        .includes("conference")
                                                    ? "#6F42C1"
                                                    : standing.description
                                                          ?.toLowerCase()
                                                          .includes("promotion")
                                                      ? "#28A745"
                                                      : standing.description
                                                            ?.toLowerCase()
                                                            .includes(
                                                              "relegation",
                                                            )
                                                        ? "#DC3545"
                                                        : "#6B7280",
                                      }}
                                    >
                                      {getChampionshipTitle(
                                        standing.rank,
                                        standing.description,
                                      )}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center py-2 px-1 text-xs text-gray-600">
                              {stats.played}
                            </TableCell>
                            <TableCell className="text-center py-2 px-1 text-xs text-gray-600">
                              <span className="font-medium">
                                {stats.goals.for}
                              </span>
                              <span className="text-gray-400 mx-0.5">:</span>
                              <span>{stats.goals.against}</span>
                            </TableCell>
                            <TableCell className="text-center py-2 px-1 text-xs">
                              <span
                                className={`font-regular ${
                                  standing.goalsDiff > 0
                                    ? "text-gray-500"
                                    : standing.goalsDiff < 0
                                      ? "text-red-600"
                                      : "text-gray-700"
                                }`}
                              >
                                {standing.goalsDiff > 0 ? "" : ""}
                                {standing.goalsDiff}
                              </span>
                            </TableCell>
                            <TableCell className="text-center py-2 px-1 text-xs font-semi-bold text-gray-900">
                              {standing.points}
                            </TableCell>
                            <TableCell className="text-center py-2 px-1 text-xs text-gray-600">
                              {stats.win}
                            </TableCell>
                            <TableCell className="text-center py-2 px-1 text-xs text-gray-600">
                              {stats.draw}
                            </TableCell>
                            <TableCell className="text-center py-2 px-1 text-xs text-gray-600">
                              {stats.lose}
                            </TableCell>
                            <TableCell className="text-center py-2 px-1">
                              <div className="flex gap-1 justify-center">
                                {standing.form
                                  ?.split("")
                                  .slice(-5)
                                  .map((result, i) => (
                                    <span
                                      key={i}
                                      className={`w-6 h-6 rounded-sm flex items-center justify-center text-xs font-semi-bold  ${
                                        result === "W"
                                          ? "border border-gray-500 text-green-800"
                                          : result === "D"
                                            ? "border border-gray-500 text-yellow-600"
                                            : result === "L"
                                              ? "border border-gray-500 text-red-600"
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
