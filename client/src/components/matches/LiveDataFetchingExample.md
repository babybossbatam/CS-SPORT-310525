
# How LiveMatchForAllCountry Handles Live Data Fetching

## 1. Live Fixtures Query Setup

```typescript
// LiveMatchForAllCountry.tsx - Live data fetching with auto-refresh
const { data: fixtures = [], isLoading } = useQuery({
  queryKey: ["live-fixtures"],
  queryFn: async () => {
    console.log("🔴 [LiveMatchForAllCountry] Fetching live fixtures");
    const response = await apiRequest("GET", "/api/fixtures/live");
    const data = await response.json();
    console.log(`🔴 [LiveMatchForAllCountry] Received ${data.length} live fixtures`);
    return data;
  },
  staleTime: 20000, // 20 seconds - data is fresh for 20 seconds
  gcTime: 2 * 60 * 1000, // 2 minutes garbage collection time
  enabled: enableFetching, // Can be toggled on/off
  refetchOnWindowFocus: true, // Refetch when user returns to tab
  refetchOnMount: true, // Refetch when component mounts
  refetchOnReconnect: true, // Refetch when internet reconnects
  refetchInterval: refreshInterval || 30000, // Auto-refresh every 30 seconds
});
```

## 2. Live Match Filtering Logic

```typescript
// Filter to show only currently live matches or recently finished
const filteredFixtures = fixtures.filter((fixture: any) => {
  // Basic validation
  if (!fixture || !fixture.league || !fixture.fixture || !fixture.teams) {
    return false;
  }

  const status = fixture.fixture.status?.short;
  
  // Always include currently live matches
  const isCurrentlyLive = [
    "LIVE", "LIV", "1H", "HT", "2H", "ET", "BT", "P", "INT"
  ].includes(status);

  if (isCurrentlyLive) {
    console.log(`✅ [LiveMatchForAllCountry] Including live match: ${fixture.teams.home.name} vs ${fixture.teams.away.name} (${status})`);
    return true;
  }

  // Include recently finished matches (within last 2 hours)
  const isRecentlyFinished = ["FT", "AET", "PEN"].includes(status);
  if (isRecentlyFinished) {
    const matchTime = new Date(fixture.fixture.date);
    const now = new Date();
    const hoursAgo = (now.getTime() - matchTime.getTime()) / (1000 * 60 * 60);
    
    if (hoursAgo <= 2) {
      console.log(`✅ [LiveMatchForAllCountry] Including recently finished match: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`);
      return true;
    }
  }

  return false;
});
```

## 3. Real-time Status Tracking for Flash Effects

```typescript
// Track status changes for halftime/fulltime flash effects
useEffect(() => {
  if (!fixtures?.length) return;

  const newHalftimeMatches = new Set<number>();
  const newFulltimeMatches = new Set<number>();
  const currentStatuses = new Map<number, string>();

  fixtures.forEach((fixture) => {
    const matchId = fixture.fixture.id;
    const currentStatus = fixture.fixture.status.short;
    const previousStatus = previousMatchStatuses.get(matchId);

    currentStatuses.set(matchId, currentStatus);

    // Check if status just changed to halftime
    if (currentStatus === 'HT' && previousStatus && previousStatus !== 'HT') {
      console.log(`🟠 [HALFTIME FLASH] Match ${matchId} just went to halftime!`);
      newHalftimeMatches.add(matchId);
    }

    // Check if status just changed to fulltime
    if (currentStatus === 'FT' && previousStatus && previousStatus !== 'FT') {
      console.log(`🔵 [FULLTIME FLASH] Match ${matchId} just finished!`);
      newFulltimeMatches.add(matchId);
    }
  });

  // Update previous statuses for next comparison
  setPreviousMatchStatuses(currentStatuses);

  // Trigger flash effects
  if (newHalftimeMatches.size > 0) {
    setHalftimeFlashMatches(newHalftimeMatches);
    setTimeout(() => setHalftimeFlashMatches(new Set()), 2000);
  }

  if (newFulltimeMatches.size > 0) {
    setFulltimeFlashMatches(newFulltimeMatches);
    setTimeout(() => setFulltimeFlashMatches(new Set()), 2000);
  }
}, [fixtures, previousMatchStatuses]);
```

## 4. API Endpoint Details

The `/api/fixtures/live` endpoint:
- Fetches only currently live matches from RapidAPI
- Includes real-time score updates
- Provides elapsed time for live matches
- Auto-refreshes every 30 seconds via React Query
- Caches data for 20 seconds to reduce API calls

## 5. Key Differences from Date-based Components

LiveMatchForAllCountry:
- ✅ Fetches from `/api/fixtures/live` endpoint
- ✅ Auto-refreshes every 30 seconds
- ✅ Shows only live/recently finished matches
- ✅ Real-time status change detection
- ✅ Flash effects for halftime/fulltime

TodaysMatchesByCountryNew & TodayPopularFootballLeaguesNew (after cleanup):
- ✅ Fetch from `/api/fixtures/date/{date}` endpoint
- ✅ Show all matches for selected date
- ✅ No auto-refresh (data is more static)
- ✅ Date-based filtering only
- ❌ No live data mixing
