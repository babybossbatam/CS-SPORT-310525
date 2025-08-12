import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { getPopularLeagues, LeagueData } from "@/lib/leagueDataCache";
import { getCachedFixturesForDate } from "@/lib/fixtureCache";
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
import MyWorldTeamLogo from "@/components/common/MyWorldTeamLogo";
import { teamColorMap } from "@/lib/colorExtractor";
import { smartTeamTranslation } from "@/lib/smartTeamTranslation";
import { smartLeagueCountryTranslation } from "@/lib/smartLeagueCountryTranslation";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const { currentLanguage } = useLanguage(); // Get current language from context
  const [popularLeagues, setPopularLeagues] = useState<LeagueData[]>([]);
  const [selectedLeague, setSelectedLeague] = useState("");
  const [selectedLeagueName, setSelectedLeagueName] = useState("");
  const [leaguesLoading, setLeaguesLoading] = useState(true);

  // Function to get translated team name using smart translation system
  const getTranslatedTeamName = (teamName: string): string => {
    // Use smart team translation system with current language from context
    const effectiveLanguage = currentLanguage || 'en';
    console.log(`🔄 [LeagueStandings] Translating team "${teamName}" to language: ${effectiveLanguage}`);
    return smartTeamTranslation.translateTeamName(teamName, effectiveLanguage);
  };

  // Function to get translated group text
  const getTranslatedGroupText = (groupText: string): string => {
    const effectiveLanguage = currentLanguage || 'en';
    console.log(`🔄 [LeagueStandings] Translating group "${groupText}" to language: ${effectiveLanguage}`);
    return smartLeagueCountryTranslation.translateLeagueName(groupText, effectiveLanguage);
  };

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

          // Exclude low-tier and regional leagues
          const isLowTierLeague =
            // Second and third divisions
            leagueName.includes("second league") ||
            leagueName.includes("third league") ||
            leagueName.includes("division 2") ||
            leagueName.includes("division 3") ||
            leagueName.includes("liga 2") ||
            leagueName.includes("serie b") ||
            leagueName.includes("serie c") ||
            leagueName.includes("championship") ||
            leagueName.includes("league one") ||
            leagueName.includes("league two") ||
            // Regional competitions
            leagueName.includes("regional") ||
            leagueName.includes("amateur") ||
            leagueName.includes("youth") ||
            // Olympics qualifications (often youth teams)
            leagueName.includes("olympics") ||
            // Super Cup competitions (one-off matches, not league standings)
            (leagueName.includes("super cup") && !leagueName.includes("saudi")) ||
            leagueName.includes("supercup") ||
            leagueName.includes("community shield") ||
            // Campeones Cup and similar one-off competitions
            leagueName.includes("campeones cup") ||
            // Group stage qualifiers (not full leagues)
            leagueName.includes("group");

          // Keep current ongoing leagues - STRICT FILTERING
          const isCurrentLeague =
            // Major European leagues (run most of the year) - EXACT MATCHES
            leagueName === "premier league" ||
            leagueName === "la liga" ||
            leagueName === "serie a" ||
            leagueName === "bundesliga" ||
            leagueName === "ligue 1" ||
            // Continental competitions (ongoing) - EXACT MATCHES
            leagueName === "uefa champions league" ||
            leagueName === "uefa europa league" ||
            leagueName === "uefa europa conference league" ||
            leagueName === "uefa nations league" ||
            // World Cup qualifications - SPECIFIC MATCHES
            leagueName === "world cup qualification - europe" ||
            leagueName === "world cup qualification - south america" ||
            leagueName === "world cup qualification - africa" ||
            leagueName === "world cup qualification - asia" ||
            leagueName === "world cup qualification - oceania" ||
            leagueName === "world cup qualification - intercontinental play-offs" ||
            // Major tournaments
            leagueName === "fifa world cup" ||
            leagueName === "euro championship" ||
            leagueName === "copa america" ||
            leagueName === "african cup of nations" ||
            leagueName === "asian cup" ||
            // Specific major leagues from other regions - EXACT MATCHES
            leagueName === "saudi pro league" ||
            leagueName === "egyptian premier league" ||
            leagueName === "mls" ||
            leagueName === "brasileiro série a" ||
            leagueName === "liga profesional argentina" ||
            // Major cup competitions - EXACT MATCHES ONLY
            leagueName === "fa cup" ||
            leagueName === "copa del rey" ||
            leagueName === "coppa italia" ||
            leagueName === "dfl-supercup" ||
            leagueName === "coupe de france";

          return !isHistoricalTournament && !isLowTierLeague && isCurrentLeague;
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

        // Auto-learn all league names for better translations
        processedLeagues.forEach(league => {
          if (league && league.name) {
            smartLeagueCountryTranslation.autoLearnFromAnyLeagueName(league.name, {
              countryName: league.country,
              leagueId: league.id
            });
          }
        });

        // Set default selection to FIFA Club World Cup (ID 15) if available, otherwise fallback
        if (processedLeagues.length > 0) {
          const preferredLeague = processedLeagues.find(
            (league) => league && league.id === 15 && league.name,
          );
          const fallbackLeague = processedLeagues.find(
            (league) => league && league.id === 32 && league.name,
          );
          const defaultLeague =
            preferredLeague ||
            fallbackLeague ||
            processedLeagues.find(
              (league) => league && league.id && league.name,
            );
          if (defaultLeague) {
            setSelectedLeague(defaultLeague.id.toString());
            setSelectedLeagueName(defaultLeague.name);
          }
        }
      } catch (error) {
        console.error("Failed to load league data:", error);

        // Enhanced fallback to popular leagues including ALL World Youth Leagues
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
          // World Cup Qualifications
          {
            id: 32,
            name: "World Cup Qualification - Europe",
            logo: "",
            country: "World",
          },
          {
            id: 33,
            name: "World Cup Qualification - Oceania",
            logo: "",
            country: "World",
          },
          {
            id: 34,
            name: "World Cup Qualification - South America",
            logo: "",
            country: "World",
          },
          {
            id: 35,
            name: "Asian Cup - Qualification",
            logo: "",
            country: "World",
          },
          {
            id: 36,
            name: "Africa Cup of Nations - Qualification",
            logo: "",
            country: "World",
          },
          {
            id: 37,
            name: "World Cup Qualification - Intercontinental Play-offs",
            logo: "",
            country: "World",
          },
          // Youth and U-League Championships (32 World Country Leagues)
          { id: 38, name: "UEFA U21 Championship", logo: "", country: "World" },
          {
            id: 480,
            name: "Olympic Football Tournament",
            logo: "",
            country: "World",
          },
          {
            id: 875,
            name: "UEFA U19 Championship",
            logo: "",
            country: "World",
          },
          {
            id: 876,
            name: "UEFA U17 Championship",
            logo: "",
            country: "World",
          },
          { id: 877, name: "FIFA U20 World Cup", logo: "", country: "World" },
          { id: 878, name: "FIFA U17 World Cup", logo: "", country: "World" },
          {
            id: 879,
            name: "CONMEBOL Copa America U20",
            logo: "",
            country: "World",
          },
          { id: 880, name: "AFC U23 Championship", logo: "", country: "World" },
          {
            id: 881,
            name: "CAF U23 Cup of Nations",
            logo: "",
            country: "World",
          },
          {
            id: 882,
            name: "CONCACAF U20 Championship",
            logo: "",
            country: "World",
          },
          { id: 883, name: "OFC U20 Championship", logo: "", country: "World" },
          {
            id: 884,
            name: "FIFA U19 Women World Cup",
            logo: "",
            country: "World",
          },
          {
            id: 885,
            name: "FIFA U17 Women World Cup",
            logo: "",
            country: "World",
          },
          {
            id: 886,
            name: "UEFA Women U19 Championship",
            logo: "",
            country: "World",
          },
          {
            id: 887,
            name: "UEFA Women U17 Championship",
            logo: "",
            country: "World",
          },
          {
            id: 888,
            name: "CONMEBOL Copa America U17",
            logo: "",
            country: "World",
          },
          { id: 889, name: "AFC U19 Championship", logo: "", country: "World" },
          { id: 890, name: "AFC U16 Championship", logo: "", country: "World" },
          {
            id: 891,
            name: "CAF U20 Cup of Nations",
            logo: "",
            country: "World",
          },
          {
            id: 892,
            name: "CAF U17 Cup of Nations",
            logo: "",
            country: "World",
          },
          {
            id: 893,
            name: "CONCACAF U17 Championship",
            logo: "",
            country: "World",
          },
          { id: 894, name: "OFC U17 Championship", logo: "", country: "World" },
          {
            id: 895,
            name: "FIFA Beach Soccer World Cup",
            logo: "",
            country: "World",
          },
          {
            id: 896,
            name: "FIFA Futsal World Cup",
            logo: "",
            country: "World",
          },
          {
            id: 897,
            name: "FIFA Club World Cup U20",
            logo: "",
            country: "World",
          },
          {
            id: 898,
            name: "World Youth Championship",
            logo: "",
            country: "World",
          },
          {
            id: 899,
            name: "International Friendlies U21",
            logo: "",
            country: "World",
          },
          {
            id: 900,
            name: "International Friendlies U19",
            logo: "",
            country: "World",
          },
          {
            id: 901,
            name: "International Friendlies U18",
            logo: "",
            country: "World",
          },
          {
            id: 902,
            name: "International Friendlies U17",
            logo: "",
            country: "World",
          },
          {
            id: 903,
            name: "International Friendlies U16",
            logo: "",
            country: "World",
          },
          {
            id: 904,
            name: "FIFA Youth Olympic Tournament",
            logo: "",
            country: "World",
          },
          {
            id: 905,
            name: "World University Games Football",
            logo: "",
            country: "World",
          },
          // Major Domestic Leagues
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

        // Auto-learn fallback league names for better translations
        fallbackLeagues.forEach(league => {
          if (league && league.name) {
            smartLeagueCountryTranslation.autoLearnFromAnyLeagueName(league.name, {
              countryName: league.country,
              leagueId: league.id
            });
          }
        });

        // Set default to FIFA Club World Cup
        setSelectedLeague("15");
        setSelectedLeagueName("FIFA Club World Cup");
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
      // Try to get cached fixtures first
      const today = new Date().toISOString().slice(0, 10);
      const cachedTodayFixtures = getCachedFixturesForDate(today);

      const response = await apiRequest(
        "GET",
        `/api/leagues/${selectedLeague}/fixtures`,
      );
      const fixturesData = await response.json();

      // Merge with cached fixtures for better opponent data
      if (cachedTodayFixtures && fixturesData?.response) {
        const mergedFixtures = {
          ...fixturesData,
          response: [...fixturesData.response, ...cachedTodayFixtures]
            .filter((fixture, index, arr) =>
              index === arr.findIndex(f => f.fixture.id === fixture.fixture.id)
            ) // Remove duplicates
        };
        return mergedFixtures;
      }

      return fixturesData;
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

  const getNextMatchInfo = (teamId: number, teamName: string) => {
    if (!fixtures?.response) return undefined;

    const nextMatch = fixtures.response.find((fixture: any) => {
      return (
        (fixture.teams.home.id === teamId ||
          fixture.teams.away.id === teamId) &&
        new Date(fixture.fixture.date) > new Date()
      );
    });

    if (nextMatch) {
      const opponent =
        nextMatch.teams.home.id === teamId
          ? nextMatch.teams.away.name
          : nextMatch.teams.home.name;
      const date = nextMatch.fixture.date;
      const venue = nextMatch.fixture.venue.name;

      return {
        opponent,
        date,
        venue,
      };
    }

    return undefined;
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
                {(() => {
                  const effectiveLanguage = currentLanguage || 'en';
                  console.log(`🔄 [LeagueStandings] Translating selected league "${selectedLeagueName}" to: ${effectiveLanguage}`);
                  return smartLeagueCountryTranslation.translateLeagueName(selectedLeagueName, effectiveLanguage);
                })()}
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
                    {(() => {
                      const effectiveLanguage = currentLanguage || 'en';
                      return smartLeagueCountryTranslation.translateLeagueName(league.name, effectiveLanguage);
                    })()}
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
                {standings.league.standings.slice(0, 2).map(
                  (group: Standing[], groupIndex: number) => (
                    <div key={groupIndex}>
                      <h3 className="text-xs font-regular mx-2 pt-2 mt-4 border-t border-b border-gray-300 dark:border-white mb-2 text-gray-700 dark:text-white flex items-center pb-1">
                        {getTranslatedGroupText(`Group ${String.fromCharCode(65 + groupIndex)}`)}
                      </h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[40px] text-center px-0.5"></TableHead>
                            <TableHead className="pl-2 min-w-[200px]"></TableHead>
                            <TableHead className="text-center px-0.5">
                              P
                            </TableHead>
                            <TableHead className="text-center px-0.5">
                              F:A
                            </TableHead>
                            <TableHead className="text-center px-0.5">
                              +/-
                            </TableHead>
                            <TableHead className="text-center px-0.5">
                              PTS
                            </TableHead>
                            <TableHead className="text-center px-0.5">
                              W
                            </TableHead>
                            <TableHead className="text-center px-0.5">
                              D
                            </TableHead>
                            <TableHead className="text-center px-0.5">
                              L
                            </TableHead>
                            <TableHead className="text-center  px-1">
                              Next
                            </TableHead>
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
                                className="border-b border-gray-300"
                              >
                                <TableCell className="font-medium text-[0.8rem] text-center px-0.5 py-2 ">
                                  {standing.rank}
                                </TableCell>
                                <TableCell className="flex flex-col font-normal px-0.5 py-3">
                                  <div className="flex items-center">
                                    <div className="mr-3">
                                      <MyWorldTeamLogo
                                        teamName={standing.team.name}
                                        teamLogo={standing.team.logo}
                                        alt={standing.team.name}
                                        size="28px"
                                        className="popular-leagues-size"
                                        leagueContext={{
                                          name: selectedLeagueName,
                                          country: popularLeagues.find(
                                            (l) => l && l.id && l.id.toString() === selectedLeague,
                                          )?.country || "World",
                                        }}
                                        showNextMatchOverlay={true}
                                      />
                                    </div>
                                    <span className="text-[0.85rem] truncate">
                                      {getTranslatedTeamName(standing.team.name)}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center text-[0.8rem] px-1 py-1 mx-0">
                                  {stats.played}
                                </TableCell>
                                <TableCell className="text-center text-[0.8rem] px-1 py-1 mx-0 font-regular">
                                  {stats.goals.for}:{stats.goals.against}
                                </TableCell>
                                <TableCell className="text-center text-[0.8rem] px-1 py-1 mx-0 font-regular">
                                  {standing.goalsDiff}
                                </TableCell>
                                <TableCell className="text-center font-regular text-[0.8rem] px-1 py-1 mx-0">
                                  {standing.points}
                                </TableCell>
                                <TableCell className="text-center text-[0.8rem] px-1 py-1 mx-0">
                                  {stats.win}
                                </TableCell>
                                <TableCell className="text-center text-[0.8rem] font-regular px-1 py-1 mx-0">
                                  {stats.draw}
                                </TableCell>
                                <TableCell className="text-center text-[0.8rem] font-regular px-1 py-1 mx-0">
                                  {stats.lose}
                                </TableCell>
                                <TableCell className="px-1 py-1 mx-0 font-regular">
                                  <div className="flex items-center justify-center">
                                    {(() => {
                                      // Find next match for this team from fixtures
                                      if (!fixtures?.response) return null;

                                      // Get both upcoming and recent fixtures for better context
                                      const teamFixtures = fixtures.response.filter((fixture: any) => {
                                        return fixture.teams.home.id === standing.team.id ||
                                               fixture.teams.away.id === standing.team.id;
                                      });

                                      // Sort by date to get the most relevant match
                                      const sortedFixtures = teamFixtures.sort((a: any, b: any) => {
                                        return new Date(a.fixture.date).getTime() - new Date(b.fixture.date).getTime();
                                      });

                                      // Find next upcoming match
                                      const nextMatch = sortedFixtures.find((fixture: any) => {
                                        const isUpcoming = new Date(fixture.fixture.date) > new Date();
                                        return isUpcoming;
                                      });

                                      // If no upcoming match, show the most recent finished match
                                      const relevantMatch = nextMatch || sortedFixtures[sortedFixtures.length - 1];

                                      if (!relevantMatch) return null;

                                      // Determine if this team is home or away to get the correct opponent
                                      const isTeamHome = relevantMatch.teams.home.id === standing.team.id;
                                      const opponentTeam = isTeamHome
                                        ? relevantMatch.teams.away
                                        : relevantMatch.teams.home;

                                      // For display purposes, always show the away team logo when possible
                                      const displayTeam = relevantMatch.teams.away.id !== standing.team.id
                                        ? relevantMatch.teams.away
                                        : relevantMatch.teams.home;

                                      const nextMatchInfo = {
                                        opponent: opponentTeam.name,
                                        date: relevantMatch.fixture.date,
                                        venue: relevantMatch.fixture.venue?.name || "TBD",
                                        isUpcoming: nextMatch ? true : false,
                                        status: relevantMatch.fixture.status.short
                                      };

                                      // Use cached fixture data if available
                                      const teamLogoUrl = displayTeam.id
                                        ? `/api/team-logo/square/${displayTeam.id}?size=24`
                                        : displayTeam.logo || "/assets/fallback-logo.svg";

                                      return isNationalTeam ? (
                                        <MyCircularFlag
                                          showNextMatchOverlay={true}
                                          teamName={displayTeam.name}
                                          fallbackUrl={teamLogoUrl}
                                          alt={`${nextMatchInfo.isUpcoming ? 'Next opponent' : 'Last opponent'}: ${displayTeam.name}`}
                                          size="24px"
                                          className="popular-leagues-size"
                                          nextMatchInfo={nextMatchInfo}
                                        />
                                      ) : (
                                        <MyWorldTeamLogo
                                          teamName={displayTeam.name}
                                          teamLogo={teamLogoUrl}
                                          alt={`${nextMatchInfo.isUpcoming ? 'Next opponent' : 'Last opponent'}: ${displayTeam.name}`}
                                          size="20px"
                                          className="popular-leagues-size"
                                          leagueContext={{
                                            name: selectedLeagueName,
                                            country: popularLeagues.find(
                                              (l) => l && l.id && l.id.toString() === selectedLeague,
                                            )?.country || "World",
                                          }}
                                        />
                                      );
                                    })()}
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

                {/* Link to view full group standings if more than 2 groups exist */}
                {standings.league.standings.length > 2 && (
                  <div className="text-center mt-6 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => window.location.href = `/league/${selectedLeague}/standings`}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium transition-colors duration-200"
                    >
                      {(() => {
                        const effectiveLanguage = currentLanguage || 'en';
                        const translatedLeague = smartLeagueCountryTranslation.translateLeagueName(selectedLeagueName, effectiveLanguage);
                        const translatedStandings = smartLeagueCountryTranslation.translateLeagueName('Group Standings', effectiveLanguage);
                        return `${translatedLeague} ${translatedStandings} →`;
                      })()}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Single league table
              <div className="overflow-hidden border-t">
                <Table>
                  <TableHeader>
                    <TableRow className=" py-1 border-b border-gray-100">
                      <TableHead className="text-left text-xs font-regular text-gray-400  px-1 w-[40px]"></TableHead>
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
                      <TableHead className="text-center text-xs font-semi-bold text-gray-600 px-1 w-[100px]">
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
                            className="border-b border-gray-100 transition-colors"
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
                                <div className="mr-3 flex-shrink-0">
                                  <MyWorldTeamLogo
                                    teamName={standing.team.name}
                                    teamLogo={standing.team.logo}
                                    teamId={standing.team.id}
                                    alt={standing.team.name}
                                    size="24px"
                                    className="object-contain"
                                    leagueContext={{
                                      name: selectedLeagueName,
                                      country: popularLeagues.find(
                                        (l) => l && l.id && l.id.toString() === selectedLeague,
                                      )?.country || "World",
                                    }}
                                  />
                                </div>
                                <div className="flex flex-col min-w-0 flex-1">
                                  <span className="text-xs font-medium text-gray-900 truncate hover:underline cursor-pointer">
                                    {getTranslatedTeamName(standing.team.name)}
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
                            <TableCell className="text-center py-2 px-1 ">
                              <div className="flex gap-1 justify-center mr-12">
                                {standing.form
                                  ?.split("")
                                  .slice(-5)
                                  .map((result, i) => (
                                    <span
                                      key={i}
                                      className={`w-6 h-6 rounded-sm flex items-center justify-center text-xs font-semi-bold ${
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
            <div className="text-center py-8 text-gray-500 mr-4">
              No standings data available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LeagueStandingsFilter;