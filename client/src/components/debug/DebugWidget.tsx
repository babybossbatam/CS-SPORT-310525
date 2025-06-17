
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DebugWidgetProps {
  isVisible?: boolean;
}

export const DebugWidget: React.FC<DebugWidgetProps> = ({ isVisible = false }) => {
  const [showWidget, setShowWidget] = useState(isVisible);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    // Add global debug functions to window
    if (typeof window !== 'undefined') {
      (window as any).debugLive = {
        clear: () => {
          console.clear();
          setLogs([]);
          console.log('🧹 Debug logs cleared');
        },
        showWidget: () => setShowWidget(true),
        hideWidget: () => setShowWidget(false),
        compareLiveData: () => {
          console.group('🔍 LIVE MATCH COMPARISON DEBUG');
          console.log('Use these functions to debug:');
          console.log('debugLive.logLiveMatches() - Log current live matches');
          console.log('debugLive.logTodayMatches() - Log today matches');
          console.log('debugLive.compare() - Compare both pages data');
          console.groupEnd();
        },
        logLiveMatches: () => {
          console.group('🔴 LIVE MATCHES DEBUG (LiveMatchForAllCountry & LiveMatchByTime)');
          fetch('/api/fixtures/live')
            .then(res => res.json())
            .then(data => {
              console.log(`📊 Total Live Fixtures: ${data.length}`);
              data.forEach((fixture: any, index: number) => {
                console.group(`⚽ Live Match ${index + 1}`);
                console.log('🏆 League:', fixture.league?.name);
                console.log('🆚 Teams:', `${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`);
                console.log('📅 Original Date:', fixture.fixture?.date);
                console.log('⏱️ Status:', fixture.fixture?.status?.short);
                console.log('⏰ Elapsed:', fixture.fixture?.status?.elapsed, 'minutes');
                console.log('🌍 Timezone:', fixture.fixture?.timezone);
                console.groupEnd();
              });
            })
            .catch(err => console.error('❌ Error fetching live matches:', err));
          console.groupEnd();
        },
        logTodayMatches: () => {
          const today = new Date().toISOString().split('T')[0];
          console.group('📅 TODAY MATCHES DEBUG (TodaysMatchesByCountryNew)');
          fetch(`/api/fixtures/date/${today}`)
            .then(res => res.json())
            .then(data => {
              console.log(`📊 Total Today Fixtures: ${data.length}`);
              
              // Group by status
              const statusGroups = data.reduce((acc: any, fixture: any) => {
                const status = fixture.fixture?.status?.short || 'UNKNOWN';
                if (!acc[status]) acc[status] = [];
                acc[status].push(fixture);
                return acc;
              }, {});

              Object.keys(statusGroups).forEach(status => {
                console.group(`📊 Status: ${status} (${statusGroups[status].length} matches)`);
                statusGroups[status].forEach((fixture: any, index: number) => {
                  console.log(`${index + 1}. ${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`);
                  console.log('📅 Date:', fixture.fixture?.date);
                  console.log('⏰ Elapsed:', fixture.fixture?.status?.elapsed, 'minutes');
                });
                console.groupEnd();
              });
            })
            .catch(err => console.error('❌ Error fetching today matches:', err));
          console.groupEnd();
        },
        compare: () => {
          console.group('🔍 COMPARISON: Live vs Today Matches');
          
          Promise.all([
            fetch('/api/fixtures/live').then(res => res.json()),
            fetch(`/api/fixtures/date/${new Date().toISOString().split('T')[0]}`).then(res => res.json())
          ]).then(([liveData, todayData]) => {
            console.group('📊 SUMMARY COMPARISON');
            console.log('🔴 Live Fixtures Count:', liveData.length);
            console.log('📅 Today Fixtures Count:', todayData.length);
            
            // Find live matches in today's data
            const liveInToday = todayData.filter((fixture: any) => 
              ['LIVE', '1H', '2H', 'HT'].includes(fixture.fixture?.status?.short)
            );
            
            console.log('⚡ Live matches in Today data:', liveInToday.length);
            console.groupEnd();

            console.group('🔍 DETAILED COMPARISON');
            
            // Compare each live match
            liveData.forEach((liveFixture: any, index: number) => {
              console.group(`🔴 Live Match ${index + 1}: ${liveFixture.teams?.home?.name} vs ${liveFixture.teams?.away?.name}`);
              
              const matchInToday = todayData.find((todayFixture: any) => 
                todayFixture.fixture?.id === liveFixture.fixture?.id
              );
              
              if (matchInToday) {
                console.log('✅ Found in Today data');
                console.log('🔴 Live API - Status:', liveFixture.fixture?.status?.short, 'Elapsed:', liveFixture.fixture?.status?.elapsed);
                console.log('📅 Today API - Status:', matchInToday.fixture?.status?.short, 'Elapsed:', matchInToday.fixture?.status?.elapsed);
                console.log('📅 Date:', liveFixture.fixture?.date);
              } else {
                console.log('❌ NOT found in Today data');
                console.log('📅 Live match date:', liveFixture.fixture?.date);
              }
              
              console.groupEnd();
            });
            
            console.groupEnd();
          }).catch(err => {
            console.error('❌ Error in comparison:', err);
          });
          
          console.groupEnd();
        }
      };

      console.log('🎯 Debug widget loaded! Use these commands:');
      console.log('debugLive.logLiveMatches() - Log live matches');
      console.log('debugLive.logTodayMatches() - Log today matches');  
      console.log('debugLive.compare() - Compare both datasets');
      console.log('debugLive.clear() - Clear console');
    }
  }, []);

  if (!showWidget) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setShowWidget(true)}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2"
          title="Open Debug Widget"
        >
          🐛
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 max-h-96 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-sm">Debug Console</h3>
            <Button
              onClick={() => setShowWidget(false)}
              size="sm"
              variant="ghost"
              className="p-1 h-6 w-6"
            >
              ✕
            </Button>
          </div>
          
          <div className="space-y-2 text-xs">
            <div className="bg-gray-100 p-2 rounded">
              <p className="font-medium mb-1">Console Commands:</p>
              <div className="space-y-1">
                <Badge variant="outline" className="text-xs">debugLive.logLiveMatches()</Badge>
                <Badge variant="outline" className="text-xs">debugLive.logTodayMatches()</Badge>
                <Badge variant="outline" className="text-xs">debugLive.compare()</Badge>
                <Badge variant="outline" className="text-xs">debugLive.clear()</Badge>
              </div>
            </div>
            
            <Button
              onClick={() => (window as any).debugLive.compare()}
              size="sm"
              className="w-full"
            >
              🔍 Compare Data Now
            </Button>
            
            <Button
              onClick={() => (window as any).debugLive.clear()}
              size="sm"
              variant="outline"
              className="w-full"
            >
              🧹 Clear Console
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
