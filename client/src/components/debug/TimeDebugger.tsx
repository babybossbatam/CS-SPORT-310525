
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { getUserTimezone, formatTimeInUserTimezone, formatYYYYMMDD } from '@/lib/dateUtils';

interface TimeDebuggerProps {
  sampleMatch?: any;
}

const TimeDebugger: React.FC<TimeDebuggerProps> = ({ sampleMatch }) => {
  const now = new Date();
  const userTimezone = getUserTimezone();
  
  // Sample API timestamps from your data
  const sampleApiDate = "2025-05-26T02:30:00+00:00"; // From the Bundesliga match
  const sampleFinishedMatch = "2025-05-18T14:00:00+00:00"; // From finished matches

  return (
    <Card className="mb-4 border-2 border-blue-200">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-blue-800">
          🕐 Time Debugging Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Current System Time */}
        <div className="p-3 bg-green-50 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">Current System Time</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div><strong>Local Time:</strong> {format(now, 'yyyy-MM-dd HH:mm:ss')}</div>
            <div><strong>UTC Time:</strong> {format(now, 'yyyy-MM-dd HH:mm:ss')} UTC</div>
            <div><strong>User Timezone:</strong> {userTimezone}</div>
            <div><strong>Formatted Date:</strong> {formatYYYYMMDD(now)}</div>
            <div><strong>Timestamp:</strong> {Math.floor(now.getTime() / 1000)}</div>
            <div><strong>ISO String:</strong> {now.toISOString()}</div>
          </div>
        </div>

        {/* Sample API Data Analysis */}
        <div className="p-3 bg-yellow-50 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">Sample API Data Analysis</h3>
          
          {/* Upcoming Match Example */}
          <div className="mb-3">
            <Badge variant="outline" className="mb-2">Upcoming Match Example</Badge>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div><strong>API Timestamp:</strong> {sampleApiDate}</div>
              <div><strong>Parsed Date:</strong> {format(parseISO(sampleApiDate), 'yyyy-MM-dd HH:mm:ss')}</div>
              <div><strong>In User TZ:</strong> {formatTimeInUserTimezone(sampleApiDate, 'yyyy-MM-dd HH:mm:ss')}</div>
              <div><strong>Date Only:</strong> {formatYYYYMMDD(sampleApiDate)}</div>
              <div><strong>Hours from now:</strong> {Math.round((parseISO(sampleApiDate).getTime() - now.getTime()) / (1000 * 60 * 60))}h</div>
              <div><strong>Status:</strong> {
                parseISO(sampleApiDate) > now ? 
                <Badge className="bg-blue-500">Future</Badge> : 
                <Badge className="bg-red-500">Past</Badge>
              }</div>
            </div>
          </div>

          {/* Finished Match Example */}
          <div>
            <Badge variant="outline" className="mb-2">Finished Match Example</Badge>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div><strong>API Timestamp:</strong> {sampleFinishedMatch}</div>
              <div><strong>Parsed Date:</strong> {format(parseISO(sampleFinishedMatch), 'yyyy-MM-dd HH:mm:ss')}</div>
              <div><strong>In User TZ:</strong> {formatTimeInUserTimezone(sampleFinishedMatch, 'yyyy-MM-dd HH:mm:ss')}</div>
              <div><strong>Date Only:</strong> {formatYYYYMMDD(sampleFinishedMatch)}</div>
              <div><strong>Hours ago:</strong> {Math.round((now.getTime() - parseISO(sampleFinishedMatch).getTime()) / (1000 * 60 * 60))}h</div>
              <div><strong>Days ago:</strong> {Math.round((now.getTime() - parseISO(sampleFinishedMatch).getTime()) / (1000 * 60 * 60 * 24))} days</div>
            </div>
          </div>
        </div>

        {/* Real Match Data (if provided) */}
        {sampleMatch && (
          <div className="p-3 bg-purple-50 rounded-lg">
            <h3 className="font-semibold text-purple-800 mb-2">
              Real Match Data: {sampleMatch.teams?.home?.name} vs {sampleMatch.teams?.away?.name}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div><strong>Match Date:</strong> {sampleMatch.fixture?.date}</div>
              <div><strong>Status:</strong> <Badge>{sampleMatch.fixture?.status?.short}</Badge></div>
              <div><strong>Parsed:</strong> {format(parseISO(sampleMatch.fixture?.date), 'yyyy-MM-dd HH:mm:ss')}</div>
              <div><strong>In User TZ:</strong> {formatTimeInUserTimezone(sampleMatch.fixture?.date, 'yyyy-MM-dd HH:mm:ss')}</div>
              <div><strong>Date Only:</strong> {formatYYYYMMDD(sampleMatch.fixture?.date)}</div>
              <div><strong>Time Diff:</strong> {
                Math.round((parseISO(sampleMatch.fixture?.date).getTime() - now.getTime()) / (1000 * 60 * 60))
              }h from now</div>
              <div><strong>Goals:</strong> {sampleMatch.goals?.home ?? 'null'} - {sampleMatch.goals?.away ?? 'null'}</div>
              <div><strong>League:</strong> {sampleMatch.league?.name}</div>
            </div>
          </div>
        )}

        {/* Time Comparison Issues */}
        <div className="p-3 bg-red-50 rounded-lg">
          <h3 className="font-semibold text-red-800 mb-2">⚠️ Potential Issues Detected</h3>
          <ul className="text-sm space-y-1">
            <li>• Current time: {format(now, 'yyyy-MM-dd HH:mm:ss')} ({userTimezone})</li>
            <li>• Selected date filter may not match API timezone expectations</li>
            <li>• Finished matches from {formatYYYYMMDD(sampleFinishedMatch)} should show scores</li>
            <li>• API returns UTC timestamps, but display logic needs proper timezone handling</li>
            <li>• Check if `goals.home` and `goals.away` are null vs 0 for finished matches</li>
          </ul>
        </div>

        {/* Debug Actions */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2">Debug Actions</h3>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => console.log('Current time debugging info:', {
                now: now.toISOString(),
                userTimezone,
                formattedDate: formatYYYYMMDD(now),
                timestamp: Math.floor(now.getTime() / 1000)
              })}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
            >
              Log Time Info
            </button>
            <button 
              onClick={() => console.log('Sample match analysis:', {
                sampleApiDate,
                parsed: parseISO(sampleApiDate).toISOString(),
                inUserTz: formatTimeInUserTimezone(sampleApiDate, 'yyyy-MM-dd HH:mm:ss'),
                hoursFromNow: Math.round((parseISO(sampleApiDate).getTime() - now.getTime()) / (1000 * 60 * 60))
              })}
              className="px-3 py-1 bg-green-500 text-white rounded text-sm"
            >
              Log Sample Analysis
            </button>
          </div>
        </div>

      </CardContent>
    </Card>
  );
};

export default TimeDebugger;
