import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp, Calendar, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format, parseISO, isValid, differenceInHours } from "date-fns";
import { safeSubstring } from "@/lib/dateUtilsUpdated";
import { shouldExcludeMatchByCountry } from "@/lib/MyMatchByCountryNewExclusion";
import { isToday, isYesterday, isTomorrow } from "@/lib/dateUtilsUpdated";
import { useDispatch, useSelector } from "react-redux";
import { RootState, fixturesActions, selectFixturesByDate } from "@/lib/store";
import {
  formatYYYYMMDD,
  getCurrentUTCDateString,
  getCurrentClientDateString,
  isDateStringToday,
  isDateStringYesterday,
  isDateStringTomorrow,
  isFixtureOnClientDate,
  getFixtureClientDate,
  isFixtureDateTimeStringToday,
  isFixtureDateTimeStringYesterday,
  isFixtureDateTimeStringTomorrow,
  getDateTimeRange,
} from "@/lib/dateUtilsUpdated";
import {
  getCachedFlag,
  getCountryFlagWithFallbackSync,
  clearFallbackFlagCache,
  countryCodeMap,
  flagCache,
  getCountryCode,
} from "@/lib/flagUtils";
import {
  getCachedFixturesForDate,
  cacheFixturesForDate,
} from "@/lib/fixtureCache";
import { getCachedCountryName, setCachedCountryName } from "@/lib/countryCache";

import { getCachedTeamLogo } from "../../lib/MyAPIFallback";
import { isNationalTeam } from "../../lib/teamLogoSources";
import { MySmartDateLabeling } from "../../lib/MySmartDateLabeling";
import LazyImage from "../common/LazyImage";
import MyCircularFlag from "../common/MyCircularFlag";
import LazyMatchItem from './LazyMatchItem';
import { MySmartTimeFilter } from "@/lib/MySmartTimeFilter";
import "../../styles/MyLogoPositioning.css";

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

interface TodaysMatchesByCountryNewProps {
  selectedDate: string;
  liveFilterActive?: boolean;
  timeFilterActive?: boolean;
}

const TodaysMatchesByCountryNew: React.FC<TodaysMatchesByCountryNewProps> = ({
  selectedDate,
  liveFilterActive = false,
  timeFilterActive = false,
}) => {
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(
    new Set(),
  );
  const [expandedLeagues, setExpandedLeagues] = useState<Set<string>>(
    new Set(),
  );
  const [enableFetching, setEnableFetching] = useState(true);
  const [starredMatches, setStarredMatches] = useState<Set<number>>(new Set());
  // Initialize flagMap with immediate synchronous values for better rendering
  const [flagMap, setFlagMap] = useState<{ [country: string]: string }>(() => {
    // Pre-populate with synchronous flag URLs to prevent initial undefined state
    const initialMap: { [country: string]: string } = {};
    // Let World flag be fetched through the normal caching system
    return initialMap;
  });

  // Popular leagues for prioritization
  const POPULAR_LEAGUES = [2, 3, 15, 39, 140, 135, 78, 848]; // Champions League, Europa League, FIFA Club World Cup, Premier League, La Liga, Serie A, Bundesliga, Conference League

  // World league IDs to force international competitions into World country group
  const WORLD_LEAGUE_IDS = [
    1359, 1360, 1363, 1364, 1365, 1366, 1367, 1368, 1369, 1370, 1371, 1372,
    1373, 1374, 1375, 1376, 1377, 1378, 1379, 1380, 1381, 1382, 1383, 1384,
    1385, 1386, 1387, 1388, 1389, 1390, 1391, 1392, 1393, 1394, 1395, 1396,
    1397, 1398, 1399, 1400, 1401, 1402, 1403, 1404, 1405, 1406, 1407, 1408,
    1409, 1410, 1411, 1412, 1413, 1414, 1415, 1416, 1417, 1418, 1419, 1420,
    1421, 1422, 1423, 1424, 1425, 1426, 1427, 1428, 1429, 1430, 1431, 1432,
    1433, 1434, 1442, 1443, 1444, 1445, 1446, 1447, 1448, 1449, 1450, 1451,
    1452, 1453, 1454, 1455, 1456, 1457, 1458, 1459, 1460, 1461, 1462, 1463,
    1464, 1465, 1466, 1467, 1468, 1469, 1470, 1471, 1472, 1473, 1474, 1475,
    1476, 1477, 1478, 1479, 1480, 1481, 1482, 1483, 1484, 1485, 1486, 1487,
    1488, 1489, 1490, 1491, 1492, 1493, 1494, 1495, 1496, 1497, 1498, 1499,
    1500, 1501, 1502, 1503, 1504, 1505, 1506, 1507, 1508, 1509, 1510, 1511,
    1512, 1513, 1514, 1515, 1516, 1517, 1518, 1519, 1520, 1521, 1522, 1523,
    1524, 1525, 1526, 1527, 1528, 1529, 1530, 1531, 1532, 1533, 1534, 1535,
    1536, 1537, 1538, 1539, 1540, 1541, 1542, 1543, 1544, 1545, 1546, 1547,
    1548, 1549, 1550, 1551, 1552, 1553, 1554, 1555, 1556, 1557, 1558, 1559,
    1560, 1561, 1562, 1563, 1564, 1565, 1566, 1567, 1568, 1569, 1570, 1571,
    1572, 1573, 1574, 1575, 1576, 1577, 1578, 1579, 1580, 1581, 1582, 1583,
    1584, 1585, 1586, 1587, 1588, 1589, 1590, 1591, 1592, 1593, 1594, 1595,
    1596, 1597, 1598, 1599, 1600, 1601, 1602, 1603, 1604, 1605, 1606, 1607,
    1608, 1609, 1610, 1611, 1612, 1613, 1614, 1615, 1616, 1617, 1618, 1619,
    1620, 1621, 1622, 1623, 1624, 1625, 1626, 1627, 1628, 1629, 1630, 1631,
    1632, 1633, 1634, 1635, 1636, 1637, 1638, 1639, 1640, 1641, 1642, 1643,
    1644, 1645, 1646, 1647, 1648, 1649, 1650, 1651, 1652, 1653, 1654, 1655,
    1656, 1657, 1658, 1659, 1660, 1661, 1662, 1663, 1664, 1665, 1666, 1667,
    1668, 1669, 1670, 1671, 1672, 1673, 1674, 1675, 1676, 1677, 1678, 1679,
    1680, 1681, 1682, 1683, 1684, 1685, 1686, 1687, 1688, 1689, 1690, 1691,
    1692, 1693, 1694, 1695, 1696, 1697, 1698, 1699, 1700, 1701, 1702, 1703,
    1704, 1705, 1706, 1707, 1708, 1709, 1710, 1711, 1712, 1713, 1714, 1715,
    1716, 1717, 1718, 1719, 1720, 1721, 1722, 1723, 1724, 1725, 1726, 1727,
    1728, 1729, 1730, 1731, 1732, 1733, 1734, 1735, 1736, 1737, 1738, 1739,
    1740, 1741, 1742, 1743, 1744, 1745, 1746, 1747, 1748, 1749, 1750, 1751,
    1752, 1753, 1754, 1755, 1756, 1757, 1758, 1759, 1760, 1761, 1762, 1763,
    1764, 1765, 1766, 1767, 1768, 1769, 1770, 1771, 1772, 1773, 1774, 1775,
    1776, 1777, 1778, 1779, 1780, 1781, 1782, 1783, 1784, 1785, 1786, 1787,
    1788, 1789, 1790, 1791, 1792, 1793, 1794, 1795, 1796, 1797, 1798, 1799,
    1800, 1801, 1802, 1803, 1804, 1805, 1806, 1807, 1808, 1809, 1810, 1811,
    1812, 1813, 1814, 1815, 1816, 1817, 1818, 1819, 1820, 1821, 1822, 1823,
    1824, 1825, 1826, 1827, 1828, 1829, 1830, 1831, 1832, 1833, 1834, 1835,
    1836, 1837, 1838, 1839, 1840, 1841, 1842, 1843, 1844, 1845, 1846, 1847,
  ];

  // Always call hooks in the same order - validate after hooks
  // Fetch all fixtures for the selected date with comprehensive caching
  const { data: fixtures = [], isLoading } = useQuery({
    queryKey: ["all-fixtures-by-date", selectedDate],
    queryFn: async () => {
      console.log(
        `🔍 [TodaysMatchesByCountryNew] Checking cache for date: ${selectedDate}`,
      );

      // Check our custom cache first
      const cachedFixtures = getCachedFixturesForDate(selectedDate);
      if (cachedFixtures) {
        console.log(
          `✅ [TodaysMatchesByCountryNew] Using cached fixtures: ${cachedFixtures.length} matches`,
        );

        // Detailed API data analysis
        const apiAnalysis = {
          totalFixtures: cachedFixtures.length,
          countries: [
            ...new Set(
              cachedFixtures.map((f) => f.league?.country).filter(Boolean),
            ),
          ].length,
          leagues: [
            ...new Set(
              cachedFixtures.map((f) => f.league?.name).filter(Boolean),
            ),
          ].length,
          statuses: [
            ...new Set(
              cachedFixtures
                .map((f) => f.fixture?.status?.short)
                .filter(Boolean),
            ),
          ],
          dateRange: {
            earliest: cachedFixtures.reduce(
              (min, f) => (f.fixture?.date < min ? f.fixture.date : min),
              cachedFixtures[0]?.fixture?.date || "",
            ),
            latest: cachedFixtures.reduce(
              (max, f) => (f.fixture?.date > max ? f.fixture.date : max),
              cachedFixtures[0]?.fixture?.date || "",
            ),
          },
          sampleFixtures: cachedFixtures.slice(0, 5).map((f) => ({
            id: f.fixture?.id,
            date: f.fixture?.date,
            status: f.fixture?.status?.short,
            league: f.league?.name,
            country: f.league?.country,
            teams: `${f.teams?.home?.name} vs ${f.teams?.away?.name}`,
          })),
        };

        console.log(`📊 [DEBUG] API Data Analysis:`, apiAnalysis);
        return cachedFixtures;
      }

      console.log(
        `📡 [TodaysMatchesByCountryNew] Fetching fresh data for date: ${selectedDate}`,
      );
      const response = await apiRequest(
        "GET",
        `/api/fixtures/date/${selectedDate}?all=true`,
      );
      const data = await response.json();

      // Cache the fetched data
      if (data && Array.isArray(data)) {
        cacheFixturesForDate(selectedDate, data, "api");
        console.log(
          `💾 [TodaysMatchesByCountryNew] Cached ${data.length} fixtures for ${selectedDate}`,
        );

        // Detailed API data analysis for fresh data
        const apiAnalysis = {
          totalFixtures: data.length,
          countries: [
            ...new Set(data.map((f) => f.league?.country).filter(Boolean)),
          ].length,
          leagues: [...new Set(data.map((f) => f.league?.name).filter(Boolean))]
            .length,
          statuses: [
            ...new Set(
              data.map((f) => f.fixture?.status?.short).filter(Boolean),
            ),
          ],
          dateRange: {
            earliest: data.reduce(
              (min, f) => (f.fixture?.date < min ? f.fixture.date : min),
              data[0]?.fixture?.date || "",
            ),
            latest: data.reduce(
              (max, f) => (f.fixture?.date > max ? f.fixture.date : max),
              data[0]?.fixture?.date || "",
            ),
          },
          sampleFixtures: data.slice(0, 5).map((f) => ({
            id: f.fixture?.id,
            date: f.fixture?.date,
            status: f.fixture?.status?.short,
            league: f.league?.name,
            country: f.league?.country,
            teams: `${f.teams?.home?.name} vs ${f.teams?.away?.name}`,
          })),
        };

        console.log(`📊 [DEBUG] Fresh API Data Analysis:`, apiAnalysis);
      }

      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for live data
    gcTime: 30 * 60 * 1000, // 30 minutes garbage collection time
    enabled: !!selectedDate && enableFetching,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // Now validate after all hooks are called
  if (!selectedDate) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-500">Please select a valid date</p>
        </CardContent>
      </Card>
    );
  }

  // Start with all countries collapsed by default
  useEffect(() => {
    // Reset to collapsed state when selected date changes
    setExpandedCountries(new Set());
    setExpandedLeagues(new Set());
  }, [selectedDate]);

  // Country code to full name mapping with caching
  const getCountryDisplayName = (
    country: string | null | undefined,
  ): string => {
    if (!country || typeof country !== "string" || country.trim() === "") {
      return "Unknown";
    }

    // Check cache first
    const cachedName = getCachedCountryName(country);
    if (cachedName) {
      return cachedName;
    }

    // Create reverse mapping from country code to country name using the centralized countryCodeMap
    const countryNameMap: { [key: string]: string } = {};
    Object.entries(countryCodeMap).forEach(([countryName, countryCode]) => {
      if (countryCode.length === 2) {
        countryNameMap[countryCode.toLowerCase()] = countryName;
      }
    });

    // Additional mappings for common variations and full country names from API
    const additionalMappings: { [key: string]: string } = {
      "czech republic": "Czech-Republic",
      india: "India",
      ae: "United Arab Emirates",
      "united arab emirates": "United Arab Emirates",
      "united arab emirates (the)": "United Arab Emirates",
      uae: "United Arab Emirates",
      ba: "Bosnia & Herzegovina",
      mk: "North Macedonia",
      sa: "Saudi Arabia",
      "saudi arabia": "Saudi Arabia",
      gb: "United Kingdom",
      gbr: "United Kingdom",
      "united kingdom": "United Kingdom",
      "united kingdom of great britain and northern ireland": "United Kingdom",
      "united kingdom of great britain and northern ireland (the)":
        "United Kingdom",
      us: "United States",
      usa: "United States",
      "united states": "United States",
      "united states of america": "United States",
      "united states minor outlying islands": "United States",
      "united states minor outlying islands (the)": "United States",
      um: "United States",
      umi: "United States",
      "korea republic": "South Korea",
      "korea (republic of)": "South Korea",
      "korea democratic people's republic": "North Korea",
      "korea (democratic people's republic of)": "North Korea",
      "iran islamic republic": "Iran",
      "iran (islamic republic of)": "Iran",
      "russian federation": "Russia",
      "russian federation (the)": "Russia",
      "venezuela bolivarian republic": "Venezuela",
      "venezuela (bolivarian republic of)": "Venezuela",
      "bolivia plurinational state": "Bolivia",
      "bolivia (plurinational state of)": "Bolivia",
      "tanzania united republic": "Tanzania",
      "tanzania (united republic of)": "Tanzania",
      "moldova republic": "Moldova",
      "moldova (republic of)": "Moldova",
      "macedonia former yugoslav republic": "North Macedonia",
      "macedonia (the former yugoslav republic of)": "North Macedonia",
      "palestinian territory occupied": "Palestine",
      "palestinian territory (occupied)": "Palestine",
      "palestine state": "Palestine",
      "palestine (state of)": "Palestine",
      "congo democratic republic": "Democratic Republic of Congo",
      "congo (the democratic republic of the)": "Democratic Republic of Congo",
      "lao people's democratic republic": "Laos",
      "lao people's democratic republic (the)": "Laos",
    };

    const cleanCountry = country.trim().toLowerCase();
    const displayName =
      countryNameMap[cleanCountry] ||
      additionalMappings[cleanCountry] ||
      country;

    // Cache the result for future use
    setCachedCountryName(country, displayName, "country-mapping");

    return displayName;
  };

  // Helper function to convert UTC date to user's local date
  const getFixtureLocalDate = (utcDateString: string): string => {
    const utcDate = parseISO(utcDateString);
    return format(utcDate, "yyyy-MM-dd");
  };

  // Apply smart time filtering directly
  const { validFixtures, rejectedFixtures, stats } = useMemo(() => {
    if (!fixtures?.length) {
      return {
        validFixtures: [],
        rejectedFixtures: [],
        stats: { total: 0, valid: 0, rejected: 0, methods: {} }
      };
    }

    // Use MySmartTimeFilter directly for consistent filtering
    const filtered = fixtures.filter(fixture => {
      if (!fixture?.fixture?.date || !fixture?.fixture?.status?.short) {
        return false;
      }

      const smartResult = MySmartTimeFilter.getSmartTimeLabel(
        fixture.fixture.date,
        fixture.fixture.status.short,
        selectedDate + 'T12:00:00Z'
      );

      // Determine what type of date is selected
      const today = new Date();
      const todayString = format(today, 'yyyy-MM-dd');
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowString = format(tomorrow, 'yyyy-MM-dd');
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = format(yesterday, 'yyyy-MM-dd');

      // Match based on selected date type
      if (selectedDate === tomorrowString && smartResult.label === 'tomorrow') return true;
      if (selectedDate === todayString && smartResult.label === 'today') return true;
      if (selectedDate === yesterdayString && smartResult.label === 'yesterday') return true;

      // Handle custom dates (dates that are not today/tomorrow/yesterday)
      if (selectedDate !== todayString && selectedDate !== tomorrowString && selectedDate !== yesterdayString) {
        if (smartResult.label === 'custom' && smartResult.isWithinTimeRange) return true;
      }

      return false;
    });

    const rejectedFixtures = fixtures.filter(f => !filtered.includes(f));
    const labelCounts = filtered.reduce((acc, fixture) => {
      const smartResult = MySmartTimeFilter.getSmartTimeLabel(
        fixture.fixture.date,
        fixture.fixture.status.short,
        selectedDate + 'T12:00:00Z'
      );
      acc[smartResult.label] = (acc[smartResult.label] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      validFixtures: filtered,
      rejectedFixtures: rejectedFixtures.map(f => ({ fixture: f, reason: 'Date mismatch' })),
      stats: {
        total: fixtures.length,
        valid: filtered.length,
        rejected: fixtures.length - filtered.length,
        methods: { 
          'smart-time-filter': filtered.length,
          ...labelCounts
        }
      }
    };
  }, [fixtures, selectedDate]);

  // Log filtering statistics
  console.log(`📊 [MyDateFilter] Filtering Results for ${selectedDate}:`, {
    total: stats.total,
    valid: stats.valid,
    rejected: stats.rejected,
    methods: stats.methods,
    selectedDate,
  });

  // Comprehensive filtering analysis
  const filterAnalysis = {
    selectedDate,
    originalCount: fixtures.length,
    filteredCount: validFixtures.length,
    removedCount: fixtures.length - validFixtures.length,
    removedFixtures: fixtures
      .filter((f) => !validFixtures.includes(f))
      .slice(0, 10)
      .map((f) => ({
        id: f.fixture?.id,
        date: f.fixture?.date,
        status: f.fixture?.status?.short,
        league: f.league?.country,
        country: f.league?.country,
        teams: `${f.teams?.home?.name} vs ${f.teams?.away?.name}`,
        reason: "Date mismatch",
      })),
    statusBreakdown: {
      original: [
        ...new Set(
          fixtures.map((f) => f.fixture?.status?.short).filter(Boolean),
        ),
      ],
      filtered: [
        ...new Set(
          validFixtures.map((f) => f.fixture?.status?.short).filter(Boolean),
        ),
      ],
    },
    dateBreakdown: {
      original: [
        ...new Set(
          fixtures.map((f) => f.fixture?.date?.split("T")[0]).filter(Boolean),
        ),
      ],
      filtered: [
        ...new Set(
          validFixtures
            .map((f) => f.fixture?.date?.split("T")[0])
            .filter(Boolean),
        ),
      ],
    },
  };

  console.log(`📊 [DEBUG] Comprehensive Filtering Analysis:`, filterAnalysis);

  // Group fixtures by country and league with comprehensive null checks
  const fixturesByCountry = validFixtures.reduce(
    (acc: any, fixture: any) => {
      // Validate fixture structure
      if (!fixture || !fixture.league || !fixture.fixture || !fixture.teams) {
        console.warn("❌ [DEBUG] Invalid fixture data structure:", fixture);
        return acc;
      }

      // Validate league data
      const league = fixture.league;
      if (!league.id || !league.name) {
        console.warn("❌ [DEBUG] Invalid league data:", league);
        return acc;
      }

      // Validate team data
      if (
        !fixture.teams.home ||
        !fixture.teams.away ||
        !fixture.teams.home.name ||
        !fixture.teams.away.name
      ) {
        console.warn("❌ [DEBUG] Invalid team data:", fixture.teams);
        return acc;
      }

      // Apply universal exclusion filters for unknown and regional leagues
      const leagueName = league.name || "";
      const homeTeamName = fixture.teams?.home?.name || "";
      const awayTeamName = fixture.teams?.away?.name || "";
      const countryName = league.country || "";

      // Note: Unknown leagues and regional leagues are now allowed through
      // Only applying main exclusion filters (women's, esports, etc.)

      // Apply standard exclusion filters (women's, youth, etc.)
      const shouldExclude = shouldExcludeMatchByCountry(
        leagueName,
        homeTeamName,
        awayTeamName,
        false,
        countryName,
      );
      if (shouldExclude) {
        console.log(`🚫 [DEBUG] Excluding match by standard filters:`, {
          fixtureId: fixture.fixture.id,
          league: leagueName,
          homeTeam: homeTeamName,
          awayTeam: awayTeamName,
          country: countryName,
          reason: "Standard exclusion filters",
        });
        return acc;
      }

      const country = league.country;
      const displayCountry = getCountryDisplayName(country);

      // Skip fixtures without a valid country, but keep World and Europe competitions
      if (
        !country ||
        country === null ||
        country === undefined ||
        typeof country !== "string" ||
        country.trim() === "" ||
        country.toLowerCase() === "unknown"
      ) {
        console.warn(
          "❌ [DEBUG] Skipping fixture with invalid/unknown country:",
          country,
          fixture.fixture.id,
        );
        return acc;
      }

      // Allow valid country names, World, Europe, and various country name formats
      const validCountry = country.trim();
      if (validCountry.length === 0) {
        console.warn(
          "❌ [DEBUG] Skipping fixture with empty country name:",
          country,
          fixture.fixture.id,
        );
        return acc;
      }

      // Accept all non-empty country names (including long official names)
      // The getCountryDisplayName function will handle the mapping

      const leagueId = league.id;

      if (!acc[displayCountry]) {
        console.log(`🆕 [DEBUG] Creating new country group:`, {
          originalCountry: country,
          displayCountry,
          fixtureId: fixture.fixture.id,
          league: leagueName,
        });
        acc[displayCountry] = {
          country: displayCountry,
          flag: "",
          leagues: {},
          hasPopularLeague: POPULAR_LEAGUES.includes(leagueId),
        };
      }

      if (!acc[displayCountry].leagues[leagueId]) {
        console.log(`🆕 [DEBUG] Creating new league group:`, {
          country: displayCountry,
          leagueId,
          leagueName,
          fixtureId: fixture.fixture.id,
        });
        acc[displayCountry].leagues[leagueId] = {
          league: {
            ...league,
            logo:
              league.logo ||
              "https://media.api-sports.io/football/leagues/1.png",
          },
          matches: [],
          isPopular: POPULAR_LEAGUES.includes(leagueId),
        };
      }

      // Add fixture with safe team data
      acc[displayCountry].leagues[leagueId].matches.push({
        ...fixture,
        teams: {
          home: {
            ...fixture.teams.home,
            logo: fixture.teams.home.logo || "/assets/fallback-logo.png",
          },
          away: {
            ...fixture.teams.away,
            logo: fixture.teams.away.logo || "/assets/fallback-logo.png",
          },
        },
      });

      console.log(`✅ [DEBUG] Added match to country group:`, {
        country: displayCountry,
        league: leagueName,
        match: `${homeTeamName} vs ${awayTeamName}`,
        fixtureId: fixture.fixture.id,
        status: fixture.fixture.status?.short,
      });

      // Handle fixtures with country="World" or null/undefined country for international competitions
      // Also check if league ID is in our World league IDs list
      const isWorldLeague = WORLD_LEAGUE_IDS.includes(league.id);

      if (
        isWorldLeague ||
        !country ||
        country === null ||
        country === undefined ||
        typeof country !== "string" ||
        country.trim() === "" ||
        country.toLowerCase() === "unknown" ||
        country.toLowerCase() === "world"
      ) {
        // Allow World competitions, CONMEBOL, UEFA, and FIFA competitions to pass through
        if (
          isWorldLeague ||
          (league.name &&
            (league.name.toLowerCase().includes("world") ||
              league.name.toLowerCase().includes("europe") ||
              league.name.toLowerCase().includes("uefa") ||
              league.name.toLowerCase().includes("fifa") ||
              league.name.toLowerCase().includes("fifa club world cup") ||
              league.name.toLowerCase().includes("champions") ||
              league.name.toLowerCase().includes("conference") ||
              // Men's International Friendlies only (excludes women's)
              (league.name.toLowerCase().includes("friendlies") &&
                !league.name.toLowerCase().includes("women")) ||
              (league.name.toLowerCase().includes("international") &&
                !league.name.toLowerCase().includes("women")) ||
              league.name.toLowerCase().includes("conmebol") ||
              league.name.toLowerCase().includes("copa america") ||
              league.name.toLowerCase().includes("copa libertadores") ||
              league.name.toLowerCase().includes("copa sudamericana") ||
              country === "World"))
        ) {
          console.log(
            `🌍 [DEBUG] Found World competition: ${league.name} (${fixture.fixture.id})`,
          );
        }
      }

      return acc;
    },
    {},
  );

  // Final summary of grouped data with comprehensive analysis
  const countryStats = Object.entries(fixturesByCountry).map(
    ([country, data]: [string, any]) => ({
      country,
      totalMatches: Object.values(data.leagues).reduce(
        (sum: number, league: any) => sum + league.matches.length,
        0,
      ),
      leagues: Object.keys(data.leagues).length,
      leagueNames: Object.values(data.leagues).map((l: any) => l.league.name),
      sampleMatches: Object.values(data.leagues)
        .flatMap((l: any) => l.matches)
        .slice(0, 3)
        .map((m: any) => ({
          id: m.fixture?.id,
          date: m.fixture?.date,
          status: m.fixture?.status?.short,
          teams: `${m.teams?.home?.name} vs ${m.teams?.away?.name}`,
        })),
    }),
  );

  const groupingAnalysis = {
    selectedDate,
    totalCountries: Object.keys(fixturesByCountry).length,
    totalMatches: countryStats.reduce((sum, c) => sum + c.totalMatches, 0),
    totalLeagues: countryStats.reduce((sum, c) => sum + c.leagues, 0),
    countriesWithMatches: countryStats.filter((c) => c.totalMatches > 0).length,
    topCountries: countryStats
      .sort((a, b) => b.totalMatches - a.totalMatches)
      .slice(0, 5),
    pipeline: {
      step1_rawFixtures: fixtures.length,
      step2_dateFiltered: validFixtures.length,
      step3_countryGrouped: countryStats.reduce(
        (sum, c) => sum + c.totalMatches,
        0,
      ),
      step4_exclusionFiltered: countryStats.reduce(
        (sum, c) => sum + c.totalMatches,
        0,
      ),
    },
  };

  console.log(`📊 [DEBUG] Comprehensive Grouping Analysis:`, groupingAnalysis);

  // Sort countries alphabetically A-Z
  const sortedCountries = Object.values(fixturesByCountry).sort(
    (a: any, b: any) => {
      const countryA = a.country || "";
      const countryB = b.country || "";
      return countryA.localeCompare(countryB);
    },
  );

  // Single flag fetching effect with deduplication
  useEffect(() => {
    const countries = sortedCountries
      .map((c: any) => c.country)
      .filter(Boolean);
    const uniqueCountries = [...new Set(countries)];

    // Only process countries that aren't already in flagMap
    const missingCountries = uniqueCountries.filter(
      (country) => !flagMap[country],
    );

    if (missingCountries.length === 0) {
      return;
    }

    console.log(
      `🎯 Need flags for ${missingCountries.length} countries: ${missingCountries.join(", ")}`,
    );

    // Pre-populate flagMap with sync flags to prevent redundant calls
    const syncFlags: { [country: string]: string } = {};
    missingCountries.forEach((country) => {
      const syncFlag = getCountryFlagWithFallbackSync(country);
      if (syncFlag) {
        syncFlags[country] = syncFlag;
      }
    });

    if (Object.keys(syncFlags).length > 0) {
      setFlagMap((prev) => ({ ...prev, ...syncFlags }));
      console.log(
        `⚡ Pre-populated ${Object.keys(syncFlags).length} flags synchronously`,
      );
    }
  }, [sortedCountries.length]); // Only depend on count, not the specific countries

  const toggleCountry = useCallback((country: string) => {
    setExpandedCountries((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(country)) {
        newExpanded.delete(country);
      } else {
        newExpanded.add(country);
      }
      return newExpanded;
    });
  }, []);

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

  // Enhanced match status logic
  const getMatchStatus = (fixture: any) => {
    const status = fixture.fixture.status.short;
    const fixtureDate = new Date(fixture.fixture.date);
    const now = new Date();
    const hoursAgo = differenceInHours(now, fixtureDate);

    // Finished matches
    if (
      ["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"].includes(status)
    ) {
      if (hoursAgo <= 2) return "Just Finished";
      if (hoursAgo <= 24) return "Recent";
      return status;
    }

    // Live matches
    if (["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(status)) {
      return status === "HT" ? "Half Time" : "LIVE";
    }

    // Upcoming matches
    if (fixtureDate < now && status === "NS") {
      return "Delayed";
    }

    return "Scheduled";
  };

  const getStatusColor = (fixture: any) => {
    const status = fixture.fixture.status.short;
    const fixtureDate = new Date(fixture.fixture.date);
    const now = new Date();
    const hoursAgo = differenceInHours(now, fixtureDate);

    if (
      ["FT", "AET", "PEN", "AWD", "WO", "ABD", "CANC", "SUSP"].includes(status)
    ) {
      if (hoursAgo <= 2) return "bg-green-100 text-green-700 font-semibold";
      return "bg-gray-100 text-gray-700 font-semibold";
    }

    if (["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(status)) {
      return "bg-red-100 text-red-700 font-semibold animate-pulse";
    }

    if (fixtureDate < now && status === "NS") {
      return "bg-orange-100 text-orange-700";
    }

    return "bg-blue-100 text-blue-700";
  };

  // Get header title based on button states and selected date (client timezone aware)
  const getHeaderTitle = () => {
    // Check for different button states first
    if (liveFilterActive && timeFilterActive) {
      return "Popular Football Live Score";
    } else if (liveFilterActive && !timeFilterActive) {
      return "Live Football Scores";
    } else if (!liveFilterActive && timeFilterActive) {
      return "All Matches by Time";
    }

    // Default behavior based on selected date (client timezone)
    const selectedDateObj = new Date(selectedDate);

    if (isDateStringToday(selectedDate)) {
      return "Today's Football Matches by Country";
    } else if (isDateStringYesterday(selectedDate)) {
      return "Yesterday's Football Results by Country";
    } else if (isDateStringTomorrow(selectedDate)) {
      return "Tomorrow's Football Matches by Country";
    } else {
      // Custom date - format it nicely
      try {
        const customDate = parseISO(selectedDate);
          if (isValid(customDate)) {
            return `${format(customDate, 'EEEE, MMMM do')} Football Matches by Country`;
          } else {
            return "Football Matches by Country";
          }
        } catch {
          return "Football Matches by Country";
        }
      }
    };

  // Prefetch function for background loading
  const prefetchMatchData = useCallback(async (fixtureId: number) => {
    try {
      // Prefetch match details, lineups, and stats in background
      const promises = [
        apiRequest('GET', `/api/fixtures/${fixtureId}`),
        apiRequest('GET', `/api/fixtures/${fixtureId}/lineups`).catch(() => null),
        apiRequest('GET', `/api/fixtures/${fixtureId}/statistics`).catch(() => null)
      ];
      await Promise.allSettled(promises);
    } catch (error) {
      console.warn('Background prefetch failed for fixture:', fixtureId);
    }
  }, []);

  // Show loading only if we're actually loading and have no data
  if (isLoading && !fixtures.length) {
    return (      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-52" />
          </div>
          <Skeleton className="h-3 w-44" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-0">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="border-b border-gray-100 last:border-b-0">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-6 h-4 rounded-sm" />
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!validFixtures.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-500">No matches available for this date</p>
        </CardContent>
      </Card>
    );
  }

  // Format the time for display in user's local timezone
  const formatMatchTime = (dateString: string | null | undefined) => {
    if (!dateString || typeof dateString !== "string") return "--:--";

    try {
      // Parse UTC time and convert to user's local timezone automatically
      const utcDate = parseISO(dateString);
      if (!isValid(utcDate)) return "--:--";

      // format() automatically converts to user's local timezone
      return format(utcDate, "HH:mm");
    } catch (error) {
      console.error("Error formatting match time:", error);
      return "--:--";
    }
  };

  const isMatchLive = (
    status: string | null | undefined,
    dateString: string | null | undefined,
  ) => {
    if (!status || !dateString) return false;

    const liveStatuses = ["1H", "2H", "HT", "ET", "BT", "P", "LIVE", "INT"];

    // Check if status indicates live match
    if (liveStatuses.some((liveStatus) => status.includes(liveStatus))) {
      return true;
    }

    // For "NS" (Not Started) status, check if match time is within reasonable live window
    if (status === "NS") {
      try {
        const matchTime = new Date(dateString);
        const now = new Date();
        const diffInMinutes =
          (now.getTime() - matchTime.getTime()) / (1000 * 60);

        // Consider it live if it's within 15 minutes of start time
        return diffInMinutes >= 0 && diffInMinutes <= 15;
      } catch (error) {
        console.error("Error checking live match status:", error);
        return false;
      }
    }

    return false;
  };

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-col space-y-1.5 p-2 border-b border-stone-200">
        <h3 className="font-semibold" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: '13.3px' }}>{getHeaderTitle()}</h3>
      </CardHeader>
      <CardContent className="p-0">
        <div>
          {/* Use sortedCountries directly */}
          {sortedCountries.map((countryData: any) => {
            const isExpanded = expandedCountries.has(countryData.country);
            const totalMatches = Object.values(countryData.leagues).reduce(
              (sum: number, league: any) => sum + league.matches.length,
              0,
            );

            // Count live and recent matches for badge
            const liveMatches = Object.values(countryData.leagues).reduce(
              (count: number, league: any) => {
                return (
                  count +
                  league.matches.filter((match: any) =>
                    ["LIVE", "1H", "HT", "2H", "ET"].includes(
                      match.fixture.status.short,
                    ),
                  ).length
                );
              },
              0,
            );

            const recentMatches = Object.values(countryData.leagues).reduce(
              (count: number, league: any) => {
                return (
                  count +
                  league.matches.filter((match: any) => {
                    const status = match.fixture.status.short;
                    const hoursAgo = differenceInHours(
                      new Date(),
                      new Date(match.fixture.date),
                    );
                    return (
                      ["FT", "AET", "PEN"].includes(status) && hoursAgo <= 3
                    );
                  }).length
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
                  onClick={() => toggleCountry(typeof countryData.country === 'string' ? countryData.country : countryData.country?.name || 'Unknown')}
                  className={`w-full p-4 flex items-center justify-between transition-colors pt-[12px] pb-[12px] font-normal text-[14.7px] country-header-button border-b border-stone-200 ${
                    isExpanded ? "expanded" : ""
                  }`}
                >
                  <div className="flex items-center gap-3 font-normal text-[14px]">
                    <img
                      src={(() => {
                        const countryName = typeof countryData.country === 'string' ? countryData.country : countryData.country?.name || 'Unknown';

                        if (countryName === "World") {
                          return "/assets/world flag_new.png";
                        }

                        // For England specifically, always use the England flag
                        if (countryName === "England") {
                          return "https://flagcdn.com/w40/gb-eng.png";
                        }

                        // Check if we have a cached flag for other countries
                        const cachedFlag = flagMap[countryName];
                        if (cachedFlag) {
                          return cachedFlag;
                        }

                        // For other countries, use the fallback sync function
                        return (
                          getCountryFlagWithFallbackSync(countryName) ||
                          "/assets/fallback.svg"
                        );
                      })()}
                      alt={typeof countryData.country === 'string' ? countryData.country : countryData.country?.name || 'Unknown'}
                      className="w-5 h-3 object-cover rounded-sm shadow-sm"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        const countryName = typeof countryData.country === 'string' ? countryData.country : countryData.country?.name || 'Unknown';

                        // For World flag, use fallback
                        if (countryName === "World") {
                          target.src = "/assets/fallback.svg";
                          return;
                        }
                        // For England specifically, ensure we try the correct flag first
                        if (
                          countryName === "England" &&
                          !target.src.includes("fallback-logo.svg")
                        ) {
                          if (!target.src.includes("gb-eng")) {
                            // First try the England flag
                            target.src = "https://flagcdn.com/w40/gb-eng.png";
                            return;
                          } else {
                            // If England flag fails, use GB flag
                            target.src = "https://flagcdn.com/w40/gb.png";
                            return;
                          }
                        }
                        // For other GB subdivisions
                        if (
                          (countryName === "Scotland" ||
                            countryName === "Wales" ||
                            countryName === "Northern Ireland") &&
                          !target.src.includes("fallback-logo.svg")
                        ) {
                          if (
                            target.src.includes("gb-sct") ||
                            target.src.includes("gb-wls") ||
                            target.src.includes("gb-nir")
                          ) {
                            target.src = "https://flagcdn.com/w40/gb.png"; // Fallback to GB flag
                          } else if (target.src.includes("/gb.png")) {
                            target.src = "/assets/fallback.svg";
                          }
                          return;
                        }
                        if (!target.src.includes("/assets/fallback.svg")) {
                          target.src = "/assets/fallback.svg";
                        }
                      }}
                    />
                    <span className="font-medium text-gray-900" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: '13.3px' }}>
                      {typeof countryData.country === 'string' ? countryData.country : countryData.country?.name || 'Unknown'}
                    </span>
                    <span className="text-gray-500" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: '13.3px' }}>
                      ({totalMatches})
                    </span>

                    {/* Live/Recent badges */}
                    {liveMatches > 0 && (
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium animate-pulse" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: '13.3px' }}>
                        {liveMatches} LIVE
                      </span>
                    )}
                    {recentMatches > 0 && !liveMatches && (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: '13.3px' }}>
                        {recentMatches} Recent
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
                  <div className={`bg-gray-50 border-t border-stone-200 league-content ${
                    isExpanded ? "expanded" : "collapsed"
                  }`}>
                    {/* Sort leagues - popular first */}
                    {Object.values(countryData.leagues)
                      .sort((a: any, b: any) => {
                        if (a.isPopular && !b.isPopular) return -1;
                        if (!a.isPopular && b.isPopular) return 1;
                        return a.league.name.localeCompare(b.league.name);
                      })
                      .map((leagueData: any) => {
                        const isLeagueExpanded = expandedLeagues.has(`${countryData.country}-${leagueData.league.id}`);

                        return (
                        <div
                          key={leagueData.league.id}
                          className="border-b border-stone-200 last:border-b-0"
                        >
                          {/* League Header - Now clickable */}
                          <button
                            onClick={() => toggleLeague(countryData.country, leagueData.league.id)}
                            className={`w-full flex items-center gap-2 p-2 bg-white border-b border-stone-200 transition-colors cursor-pointer group`}
                          >
                            <img
                              src={
                                leagueData.league.logo ||
                                "/assets/fallback-logo.svg"
                              }
                              alt={leagueData.league.name || "Unknown League"}
                              className="w-6 h-6 object-contain rounded-full"
                              style={{ backgroundColor: "transparent" }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "/assets/fallback-logo.svg";
                              }}
                            />
                            <div className="flex flex-col flex-1 text-left">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-800 group-hover:underline transition-all duration-200" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: '13.3px' }}>
                                  {safeSubstring(leagueData.league.name, 0) ||
                                    "Unknown League"}
                                </span>
                                <span className="text-gray-500" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: '13.3px' }}>
                                  ({leagueData.matches.length})
                                </span>
                                {(() => {
                                  const liveMatchesInLeague = leagueData.matches.filter((match: any) =>
                                    ["LIVE", "1H", "HT", "2H", "ET", "BT", "P", "INT"].includes(
                                      match.fixture.status.short,
                                    ),
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

                          {/* Matches - Only show when league is expanded */}
                          {expandedLeagues.has(`${countryData.country}-${leagueData.league.id}`) && (
                            <div className="space-y-0 league-matches-container"
                              style={{
                                animation: expandedLeagues.has(`${countryData.country}-${leagueData.league.id}`) 
                                  ? 'slideDown 0.3s ease-out' 
                                  : 'slideUp 0.3s ease-out'
                              }}
                            >
                            {leagueData.matches
                              .sort((a: any, b: any) => {
                                // Priority order: Live > Upcoming > Ended
                                const aStatus = a.fixture.status.short;
                                const bStatus = b.fixture.status.short;
                                const aDate = new Date(
                                  a.fixture.date,
                                ).getTime();
                                const bDate = new Date(
                                  b.fixture.date,
                                ).getTime();

                                // Define status categories
                                const aLive = [
                                  "LIVE",
                                  "1H",
                                  "HT",
                                  "2H",
                                  "ET",
                                  "BT",
                                  "P",
                                  "INT",
                                ].includes(aStatus);
                                const bLive = [
                                  "LIVE",
                                  "1H",
                                  "HT",
                                  "2H",
                                  "ET",
                                  "BT",
                                  "P",
                                  "INT",
                                ].includes(bStatus);

                                const aUpcoming = aStatus === "NS" && !aLive;
                                const bUpcoming = bStatus === "NS" && !bLive;

                                const aEnded = [
                                  "FT",
                                  "AET",
                                  "PEN",
                                  "AWD",
                                  "WO",
                                  "ABD",
                                  "CANC",
                                  "SUSP",
                                ].includes(aStatus);
                                const bEnded = [
                                  "FT",
                                  "AET",
                                  "PEN",
                                  "AWD",
                                  "WO",
                                  "ABD",
                                  "CANC",
                                  "SUSP",
                                ].includes(bStatus);

                                // Assign priority scores (lower = higher priority)
                                let aPriority = 0;
                                let bPriority = 0;

                                if (aLive) aPriority = 1;
                                else if (aUpcoming) aPriority = 2;
                                else if (aEnded) aPriority = 3;
                                else aPriority = 4; // Other statuses

                                if (bLive) bPriority = 1;
                                else if (bUpcoming) bPriority = 2;
                                else if (bEnded) bPriority = 3;
                                else bPriority = 4; // Other statuses

                                // First sort by priority
                                if (aPriority !== bPriority) {
                                  return aPriority - bPriority;
                                }

                                // If same priority, sort by time within category
                                if (aLive && bLive) {
                                  // For live matches, show earliest start time first
                                  return aDate - bDate;
                                }

                                if (aUpcoming && bUpcoming) {
                                  // For upcoming matches, show earliest start time first
                                  return aDate - bDate;
                                }

                                if (aEnded && bEnded) {
                                  // For ended matches, show most recent first
                                  return bDate - aDate;
                                }

                                // Default time-based sorting
                                return aDate - bDate;
                              })
                              .map((match: any, matchIndex) => (

                                <LazyMatchItem
                                  key={match.fixture.id}
                                  priority={matchIndex < 3 ? 'high' : 'normal'}
                                  onPrefetch={() => prefetchMatchData(match.fixture.id)}
                                  rootMargin="150px"
                                  prefetchMargin="400px"
                                >
                                  <div
                                    className="match-card-container group"
                                  >
                                    {/* Star Button with true slide-in effect */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleStarMatch(match.fixture.id);
                                      }}
                                      className="match-star-button"
                                      title="Add to favorites"
                                      onMouseEnter={(e) => {
                                        e.currentTarget
                                          .closest(".group")
                                          ?.classList.add("disable-hover");
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget
                                          .closest(".group")
                                          ?.classList.remove("disable-hover");
                                      }}
                                    >
                                      <Star
                                        className={`match-star-icon ${
                                          starredMatches.has(match.fixture.id)
                                            ? "starred"
                                            : ""
                                        }`}
                                      />
                                    </button>

                                    <div className="match-content-container">
                                      {/* Home Team Name - positioned further left */}
                                      <div className={`home-team-name ${
                                        match.goals.home !== null && match.goals.away !== null && 
                                        match.goals.home > match.goals.away ? 'winner' : ''
                                      }`}>
                                        {shortenTeamName(match.teams.home.name) ||
                                          "Unknown Team"}
                                      </div>

                                      {/* Home team logo - closer to center */}
                                      <div className="team-logo-container">
                                        {isNationalTeam(match.teams.home, {
                                          name: leagueData.league.name,
                                          country: leagueData.league.country,
                                        }) || match.teams.home.name?.includes("U20") || match.teams.home.name?.includes("U21") ? (


                                            <MyCircularFlag
                                              teamName={match.teams.home.name || ""}
                                              fallbackUrl={
                                                match.teams.home.id
                                                  ? `/api/team-logo/square/${match.teams.home.id}?size=36`
                                                  : "/assets/fallback-logo.svg"
                                              }
                                              alt={match.teams.home.name}
                                              size="36px"
                                              className="popular-leagues-size"
                                            />

                                        ) : (
                                          <LazyImage
                                            src={
                                              match.teams.home.id
                                                ? `/api/team-logo/square/${match.teams.home.id}?size=36`
                                                : "/assets/fallback-logo.svg"
                                            }
                                            alt={match.teams.home.name}
                                            title={match.teams.home.name}
                                            className="team-logo"
                                            style={{
                                              filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))",
                                            }}
                                            fallbackSrc="/assets/fallback-logo.svg"
                                          />
                                        )}
                                      </div>

                                      {/* Score/Time Center - Fixed width and centered */}
                                      <div className="match-score-container">
                                        {(() => {
                                          const status =
                                            match.fixture.status.short;
                                          const fixtureDate = parseISO(
                                            match.fixture.date,
                                          );

                                          // Live matches
                                          if (
                                            [
                                              "LIVE",
                                              "1H",
                                              "HT",
                                              "2H",
                                              "ET",
                                              "BT",
                                              "P",
                                              "INT",
                                            ].includes(status)
                                          ) {
                                            return (
                                              <div className="relative">
                                                <div className="match-score-display">
                                                  <span className="score-number">
                                                    {match.goals.home ?? 0}
                                                  </span>
                                                  <span className="score-separator">
                                                    -
                                                  </span>
                                                  <span className="score-number">
                                                    {match.goals.away ?? 0}
                                                  </span>
                                                </div>
                                                <div className="match-status-label status-live">
                                                  {status === "HT"
                                                    ? "HT"
                                                    : `${match.fixture.status.elapsed || 0}'`}
                                                </div>
                                              </div>
                                            );
                                          }

                                          // All finished match statuses
                                          if (
                                            [
                                              "FT",
                                              "AET",
                                              "PEN",
                                              "AWD",
                                              "WO",
                                              "ABD",
                                              "CANC",
                                              "SUSP",
                                            ].includes(status)
                                          ) {
                                            // Check if we have actual numerical scores
                                            const homeScore = match.goals.home;
                                            const awayScore = match.goals.away;
                                            const hasValidScores =
                                              homeScore !== null &&
                                              homeScore !== undefined &&
                                              awayScore !== null &&
                                              awayScore !== undefined &&
                                              !isNaN(Number(homeScore)) &&
                                              !isNaN(Number(awayScore));

                                            if (hasValidScores) {
                                              return (
                                                <div className="relative">
                                                  <div className="match-score-display">
                                                    <span className="score-number">
                                                      {homeScore}
                                                    </span>
                                                    <span className="score-separator">
                                                      -
                                                    </span>
                                                    <span className="score-number">
                                                      {awayScore}
                                                    </span>
                                                  </div>
                                                  <div className="match-status-label status-ended">
                                                    {status === "FT"
                                                      ? "Ended"
                                                      : status === "AET"
                                                        ? "AET"
                                                        : status === "PEN"
                                                          ? "PEN"
                                                          : status === "AWD"
                                                            ? "Awarded"
                                                            : status === "WO"
                                                              ? "Walkover"
                                                              : status === "ABD"
                                                                ? "Abandoned"
                                                                : status ===
                                                                    "CANC"
                                                                  ? "Cancelled"
                                                                  : status ===
                                                                      "SUSP"
                                                                    ? "Suspended"
                                                                    : status}
                                                  </div>
                                                </div>
                                              );
                                            } else {
                                              // Match is finished but no valid score data
                                              const statusText =
                                                status === "FT"
                                                  ? "No Score"
                                                  : status === "AET"
                                                    ? "AET"
                                                    : status === "PEN"
                                                      ? "PEN"
                                                      : status === "AWD"
                                                        ? "Awarded"
                                                        : status === "WO"
                                                          ? "Walkover"
                                                          : status === "ABD"
                                                            ? "Abandoned"
                                                            : status === "CANC"
                                                              ? "Cancelled"
                                                              : status === "SUSP"
                                                                ? "Suspended"
                                                                : "No Score";

                                              return (
                                                <div className="relative">
                                                  <div className="text-sm font-medium text-gray-900">
                                                    {format(fixtureDate, "HH:mm")}
                                                  </div>
                                                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-xs font-semibold">
                                                    <span className="text-gray-600 bg-white px-1 rounded">
                                                      {statusText}
                                                    </span>
                                                  </div>
                                                </div>
                                              );
                                            }
                                          }

                                          // Postponed or delayed matches
                                          if (
                                            [
                                              "PST",
                                              "CANC",
                                              "ABD",
                                              "SUSP",
                                              "AWD",
                                              "WO",
                                            ].includes(status)
                                          ) {
                                            const statusText =
                                              status === "PST"
                                                ? "Postponed"
                                                : status === "CANC"
                                                  ? "Cancelled"
                                                  : status === "ABD"
                                                    ? "Abandoned"
                                                    : status === "SUSP"
                                                      ? "Suspended"
                                                      : status === "AWD"
                                                        ? "Awarded"
                                                        : status === "WO"
                                                          ? "Walkover"
                                                          : status;

                                            return (
                                              <div className="relative">
                                                <div className="text-sm font-medium text-gray-900">
                                                  {format(fixtureDate, "HH:mm")}
                                                </div>
                                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 text-xs font-semibold">
                                                  <span className="text-red-600 bg-white px-1 rounded">
                                                    {statusText}
                                                  </span>
                                                </div>
                                              </div>
                                            );
                                          }

                                          // Upcoming matches (NS = Not Started, TBD = To Be Determined)
                                          return (
                                            <div className="relative flex items-center justify-center h-full">
                                              <div className="match-time-display">
                                                {status === "TBD"
                                                  ? "TBD"
                                                  : format(fixtureDate, "HH:mm")}
                                              </div>
                                              {status === "TBD" && (
                                                <div className="match-status-label status-upcoming">
                                                  Time TBD
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })()}
                                      </div>

                                      {/* Away team logo - closer to center */}
                                      <div className="team-logo-container">
                                        {isNationalTeam(match.teams.away, {
                                          name: leagueData.league.name,
                                          country: leagueData.league.country,
                                        }) || match.teams.away.name?.includes("U20") || match.teams.away.name?.includes("U21") ? (


                                            <MyCircularFlag
                                              teamName={match.teams.away.name || ""}
                                              fallbackUrl={
                                                match.teams.away.id
                                                  ? `/api/team-logo/square/${match.teams.away.id}?size=36`
                                                  : "/assets/fallback-logo.svg"
                                              }
                                              alt={match.teams.away.name}
                                              size="36px"
                                              className="popular-leagues-size"
                                            />

                                        ) : (
                                          <LazyImage
                                            src={
                                              match.teams.away.id
                                                ? `/api/team-logo/square/${match.teams.away.id}?size=36`
                                                : "/assets/fallback-logo.svg"
                                            }
                                            alt={match.teams.away.name}
                                            title={match.teams.away.name}
                                            className="team-logo"
                                            style={{
                                              filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))",
                                            }}
                                            fallbackSrc="/assets/fallback-logo.svg"
                                          />
                                        )}
                                      </div>

                                      {/* Away Team Name - positioned further right */}
                                      <div className={`away-team-name ${
                                        match.goals.home !== null && match.goals.away !== null && 
                                        match.goals.away > match.goals.home ? 'winner' : ''
                                      }`}>
                                        {shortenTeamName(match.teams.away.name) ||
                                          "Unknown Team"}
                                      </div>
                                    </div>
                                  </div>
                                </LazyMatchItem>
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

export default TodaysMatchesByCountryNew;