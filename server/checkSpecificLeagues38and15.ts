
import { rapidApiService } from './services/rapidApi';
import { format, addDays, subDays, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

// MyUpdatedFixtureDateSelection class for timezone-aware filtering
class MyUpdatedFixtureDateSelection {
  private static clientTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  static convertFixtureToLocalTime(utcDateString: string): {
    convertedDate: string;
    localDateString: string;
  } {
    try {
      const utcDate = parseISO(utcDateString);
      const localDate = toZonedTime(utcDate, this.clientTimezone);
      const convertedDate = format(localDate, 'yyyy-MM-dd\'T\'HH:mm:ss');
      const localDateString = format(localDate, 'yyyy-MM-dd');
      
      return {
        convertedDate,
        localDateString
      };
    } catch (error) {
      console.error('Error converting fixture date to local time:', error);
      const fallbackDate = utcDateString.split('T')[0];
      return {
        convertedDate: utcDateString,
        localDateString: fallbackDate
      };
    }
  }

  static getLocalDateRanges(referenceDate?: string): {
    today: { start: string; end: string; dateString: string };
    yesterday: { start: string; end: string; dateString: string };
    tomorrow: { start: string; end: string; dateString: string };
  } {
    const now = referenceDate ? parseISO(referenceDate) : new Date();
    const localNow = toZonedTime(now, this.clientTimezone);
    
    const todayStart = startOfDay(localNow);
    const todayEnd = endOfDay(localNow);
    const todayDateString = format(localNow, 'yyyy-MM-dd');
    
    const yesterday = new Date(localNow);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStart = startOfDay(yesterday);
    const yesterdayEnd = endOfDay(yesterday);
    const yesterdayDateString = format(yesterday, 'yyyy-MM-dd');
    
    const tomorrow = new Date(localNow);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStart = startOfDay(tomorrow);
    const tomorrowEnd = endOfDay(tomorrow);
    const tomorrowDateString = format(tomorrow, 'yyyy-MM-dd');
    
    return {
      today: {
        start: format(todayStart, 'yyyy-MM-dd\'T\'00:00:00'),
        end: format(todayEnd, 'yyyy-MM-dd\'T\'23:59:59'),
        dateString: todayDateString
      },
      yesterday: {
        start: format(yesterdayStart, 'yyyy-MM-dd\'T\'00:00:00'),
        end: format(yesterdayEnd, 'yyyy-MM-dd\'T\'23:59:59'),
        dateString: yesterdayDateString
      },
      tomorrow: {
        start: format(tomorrowStart, 'yyyy-MM-dd\'T\'00:00:00'),
        end: format(tomorrowEnd, 'yyyy-MM-dd\'T\'23:59:59'),
        dateString: tomorrowDateString
      }
    };
  }

  static isFixtureInDateRange(
    convertedDate: string,
    rangeStart: string,
    rangeEnd: string
  ): boolean {
    try {
      const fixtureDate = parseISO(convertedDate);
      const startDate = parseISO(rangeStart);
      const endDate = parseISO(rangeEnd);
      
      return isWithinInterval(fixtureDate, {
        start: startDate,
        end: endDate
      });
    } catch (error) {
      console.error('Error checking fixture date range:', error);
      return false;
    }
  }

  static filterTodayFixtures(fixtures: any[]): any[] {
    if (!fixtures || fixtures.length === 0) {
      return [];
    }

    const dateRanges = this.getLocalDateRanges();
    const todayFixtures: any[] = [];

    fixtures.forEach((fixture) => {
      if (!fixture?.fixture?.date) {
        return;
      }

      const originalDate = fixture.fixture.date;
      const { convertedDate } = this.convertFixtureToLocalTime(originalDate);
      
      const isToday = this.isFixtureInDateRange(
        convertedDate, 
        dateRanges.today.start, 
        dateRanges.today.end
      );
      
      if (isToday) {
        todayFixtures.push(fixture);
      }
    });

    return todayFixtures;
  }
}

async function checkLeagues38and15() {
  console.log('🔍 Checking fixtures for League ID 38 and 15 with timezone-aware filtering...\n');
  console.log(`🌍 Server timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}\n`);
  
  const today = new Date();
  const dates = [
    subDays(today, 1).toISOString().split('T')[0],
    today.toISOString().split('T')[0],
    addDays(today, 1).toISOString().split('T')[0],
    addDays(today, 2).toISOString().split('T')[0],
  ];

  console.log(`📅 Checking dates: ${dates.join(', ')}\n`);

  // Get today's date ranges for comparison
  const dateRanges = MyUpdatedFixtureDateSelection.getLocalDateRanges();
  console.log(`📅 Today's date range (local timezone):`, {
    start: dateRanges.today.start,
    end: dateRanges.today.end,
    dateString: dateRanges.today.dateString
  });

  // League 38 - Premier League
  console.log('🏴󠁧󠁢󠁥󠁮󠁧󠁿 === LEAGUE 38 (Premier League) ===');
  let allFixtures38: any[] = [];
  
  for (const date of dates) {
    try {
      console.log(`\n📊 Checking League 38 for ${date}:`);
      const fixtures38 = await rapidApiService.getFixturesByDate(date, undefined, 38);
      
      if (fixtures38 && fixtures38.length > 0) {
        console.log(`✅ Found ${fixtures38.length} fixtures for League 38 on ${date}:`);
        allFixtures38.push(...fixtures38);
        
        fixtures38.forEach((fixture: any, index: number) => {
          console.log(`  ${index + 1}. ${fixture.teams?.home?.name || 'Unknown'} vs ${fixture.teams?.away?.name || 'Unknown'}`);
          console.log(`     Status: ${fixture.fixture?.status?.short} | Date: ${fixture.fixture?.date}`);
          console.log(`     League: ${fixture.league?.name} (${fixture.league?.country})`);
        });
      } else {
        console.log(`❌ No fixtures found for League 38 on ${date}`);
      }
    } catch (error) {
      console.error(`❌ Error fetching League 38 for ${date}:`, error);
    }
  }

  // Filter today's matches for League 38 using timezone-aware filtering
  const todayFixtures38 = MyUpdatedFixtureDateSelection.filterTodayFixtures(allFixtures38);
  console.log(`\n🎯 === TODAY'S LEAGUE 38 MATCHES (Timezone-aware) ===`);
  if (todayFixtures38.length > 0) {
    console.log(`✅ Found ${todayFixtures38.length} matches TODAY for League 38:`);
    todayFixtures38.forEach((fixture: any, index: number) => {
      const { convertedDate, localDateString } = MyUpdatedFixtureDateSelection.convertFixtureToLocalTime(fixture.fixture.date);
      console.log(`  ${index + 1}. ${fixture.teams?.home?.name || 'Unknown'} vs ${fixture.teams?.away?.name || 'Unknown'}`);
      console.log(`     Status: ${fixture.fixture?.status?.short}`);
      console.log(`     Original UTC: ${fixture.fixture?.date}`);
      console.log(`     Local Time: ${convertedDate}`);
      console.log(`     Local Date: ${localDateString}`);
    });
  } else {
    console.log(`❌ No matches found TODAY for League 38 (after timezone filtering)`);
  }

  // League 15 - FIFA Club World Cup
  console.log('\n\n🌍 === LEAGUE 15 (FIFA Club World Cup) ===');
  let allFixtures15: any[] = [];
  
  for (const date of dates) {
    try {
      console.log(`\n📊 Checking League 15 for ${date}:`);
      const fixtures15 = await rapidApiService.getFixturesByDate(date, undefined, 15);
      
      if (fixtures15 && fixtures15.length > 0) {
        console.log(`✅ Found ${fixtures15.length} fixtures for League 15 on ${date}:`);
        allFixtures15.push(...fixtures15);
        
        fixtures15.forEach((fixture: any, index: number) => {
          console.log(`  ${index + 1}. ${fixture.teams?.home?.name || 'Unknown'} vs ${fixture.teams?.away?.name || 'Unknown'}`);
          console.log(`     Status: ${fixture.fixture?.status?.short} | Date: ${fixture.fixture?.date}`);
          console.log(`     League: ${fixture.league?.name} (${fixture.league?.country})`);
          console.log(`     Venue: ${fixture.fixture?.venue?.name || 'Unknown'}`);
          console.log(`     Goals: ${fixture.goals?.home || 0} - ${fixture.goals?.away || 0}`);
        });
      } else {
        console.log(`❌ No fixtures found for League 15 on ${date}`);
      }
    } catch (error) {
      console.error(`❌ Error fetching League 15 for ${date}:`, error);
    }
  }

  // Filter today's matches for League 15 using timezone-aware filtering
  const todayFixtures15 = MyUpdatedFixtureDateSelection.filterTodayFixtures(allFixtures15);
  console.log(`\n🎯 === TODAY'S LEAGUE 15 MATCHES (Timezone-aware) ===`);
  if (todayFixtures15.length > 0) {
    console.log(`✅ Found ${todayFixtures15.length} matches TODAY for League 15:`);
    todayFixtures15.forEach((fixture: any, index: number) => {
      const { convertedDate, localDateString } = MyUpdatedFixtureDateSelection.convertFixtureToLocalTime(fixture.fixture.date);
      console.log(`  ${index + 1}. ${fixture.teams?.home?.name || 'Unknown'} vs ${fixture.teams?.away?.name || 'Unknown'}`);
      console.log(`     Status: ${fixture.fixture?.status?.short}`);
      console.log(`     Original UTC: ${fixture.fixture?.date}`);
      console.log(`     Local Time: ${convertedDate}`);
      console.log(`     Local Date: ${localDateString}`);
      console.log(`     Venue: ${fixture.fixture?.venue?.name || 'Unknown'}`);
      console.log(`     Goals: ${fixture.goals?.home || 0} - ${fixture.goals?.away || 0}`);
    });
  } else {
    console.log(`❌ No matches found TODAY for League 15 (after timezone filtering)`);
  }

  // Check current season for FIFA Club World Cup
  console.log('\n\n🔍 === CHECKING FIFA CLUB WORLD CUP SEASON INFO ===');
  try {
    const currentYear = new Date().getFullYear();
    console.log(`Current year: ${currentYear}`);
    
    // Check if there are any fixtures for the current season
    const seasonFixtures = await rapidApiService.getFixturesByLeague(15, currentYear);
    if (seasonFixtures && seasonFixtures.length > 0) {
      console.log(`\n✅ Found ${seasonFixtures.length} total fixtures for League 15 in ${currentYear} season:`);
      
      // Group by status
      const statusGroups = seasonFixtures.reduce((acc: any, fixture: any) => {
        const status = fixture.fixture?.status?.short || 'UNKNOWN';
        if (!acc[status]) acc[status] = [];
        acc[status].push(fixture);
        return acc;
      }, {});

      Object.entries(statusGroups).forEach(([status, fixtures]: [string, any]) => {
        console.log(`\n  📌 Status "${status}": ${fixtures.length} matches`);
        fixtures.slice(0, 3).forEach((fixture: any, index: number) => {
          console.log(`    ${index + 1}. ${fixture.teams?.home?.name || 'Unknown'} vs ${fixture.teams?.away?.name || 'Unknown'}`);
          console.log(`       Date: ${fixture.fixture?.date} | Venue: ${fixture.fixture?.venue?.name || 'Unknown'}`);
        });
        if (fixtures.length > 3) {
          console.log(`    ... and ${fixtures.length - 3} more matches`);
        }
      });

      // Check dates distribution
      console.log('\n📅 Date distribution:');
      const dateGroups = seasonFixtures.reduce((acc: any, fixture: any) => {
        const date = fixture.fixture?.date?.split('T')[0] || 'UNKNOWN';
        if (!acc[date]) acc[date] = 0;
        acc[date]++;
        return acc;
      }, {});

      Object.entries(dateGroups)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([date, count]: [string, any]) => {
          console.log(`  ${date}: ${count} matches`);
        });

    } else {
      console.log(`❌ No fixtures found for League 15 in ${currentYear} season`);
    }
  } catch (error) {
    console.error('❌ Error checking FIFA Club World Cup season:', error);
  }

  // Check live fixtures specifically
  console.log('\n\n🔴 === CHECKING LIVE FIXTURES ===');
  try {
    const liveFixtures = await rapidApiService.getLiveFixtures();
    const liveLeague15 = liveFixtures.filter((f: any) => f.league?.id === 15);
    const liveLeague38 = liveFixtures.filter((f: any) => f.league?.id === 38);

    console.log(`Live fixtures for League 15: ${liveLeague15.length}`);
    liveLeague15.forEach((fixture: any, index: number) => {
      console.log(`  ${index + 1}. ${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`);
      console.log(`     Status: ${fixture.fixture?.status?.short} | Elapsed: ${fixture.fixture?.status?.elapsed || 0}'`);
    });

    console.log(`\nLive fixtures for League 38: ${liveLeague38.length}`);
    liveLeague38.forEach((fixture: any, index: number) => {
      console.log(`  ${index + 1}. ${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`);
      console.log(`     Status: ${fixture.fixture?.status?.short} | Elapsed: ${fixture.fixture?.status?.elapsed || 0}'`);
    });

  } catch (error) {
    console.error('❌ Error checking live fixtures:', error);
  }

  // Summary of today's matches
  console.log('\n📊 === SUMMARY OF TODAY\'S MATCHES ===');
  console.log(`🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League (ID: 38): ${todayFixtures38.length} matches today`);
  console.log(`🌍 FIFA Club World Cup (ID: 15): ${todayFixtures15.length} matches today`);
  console.log(`📅 Total matches today: ${todayFixtures38.length + todayFixtures15.length}`);
  console.log(`🌍 Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
  console.log(`📅 Today's date: ${dateRanges.today.dateString}`);

  console.log('\n🏁 Analysis complete!');
}

// Run the check
checkLeagues38and15().catch(console.error);
