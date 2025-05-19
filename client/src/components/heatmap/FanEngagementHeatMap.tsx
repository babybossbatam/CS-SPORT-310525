import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

// Define regions for the heat map
const regions = [
  { id: 'europe', name: 'Europe', color: '#ff5e5e' },
  { id: 'north_america', name: 'North America', color: '#5e9aff' },
  { id: 'south_america', name: 'South America', color: '#5eff5e' },
  { id: 'africa', name: 'Africa', color: '#ffb55e' },
  { id: 'asia', name: 'Asia', color: '#d15eff' },
  { id: 'oceania', name: 'Oceania', color: '#5effff' },
];

interface EngagementData {
  region: string;
  count: number;
  percentage: number;
}

interface FanEngagementHeatMapProps {
  matchId?: number;
  teamId?: number;
  className?: string;
}

const FanEngagementHeatMap: React.FC<FanEngagementHeatMapProps> = ({ 
  matchId, 
  teamId,
  className = '' 
}) => {
  const [engagementData, setEngagementData] = useState<EngagementData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalEngagement, setTotalEngagement] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const fetchEngagementData = async () => {
      setIsLoading(true);
      try {
        // We would fetch actual API data here in a production environment
        // For now, we'll check if we can access the API endpoint
        let endpoint = '/api/fan-engagement';
        if (matchId) {
          endpoint += `/match/${matchId}`;
        } else if (teamId) {
          endpoint += `/team/${teamId}`;
        }
        
        // Check if endpoint exists
        try {
          await apiRequest('GET', endpoint);
        } catch (error) {
          console.log('API endpoint not available, using static data for demo purposes');
        }
        
        // Static data for demo
        const staticData = [
          { region: 'europe', count: 856400, percentage: 42.8 },
          { region: 'north_america', count: 345200, percentage: 17.2 },
          { region: 'south_america', count: 289600, percentage: 14.5 },
          { region: 'asia', count: 254000, percentage: 12.7 },
          { region: 'africa', count: 178500, percentage: 8.9 },
          { region: 'oceania', count: 78300, percentage: 3.9 }
        ];
        
        setEngagementData(staticData);
        setTotalEngagement(staticData.reduce((sum, item) => sum + item.count, 0));
      } catch (error) {
        console.error('Error fetching engagement data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load fan engagement data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEngagementData();
  }, [matchId, teamId, toast]);

  // Format number with commas (e.g. 1,000,000)
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Global Fan Engagement</CardTitle>
        <p className="text-sm text-muted-foreground">
          {isLoading 
            ? 'Loading engagement data...' 
            : `Total Engagement: ${formatNumber(totalEngagement)}`
          }
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-7 w-full" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {engagementData
              .sort((a, b) => b.count - a.count)
              .map((item, index) => {
                const region = regions.find(r => r.id === item.region);
                
                return (
                  <div key={item.region} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{region?.name}</span>
                      <span className="font-medium">{item.percentage}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${item.percentage}%`,
                          backgroundColor: region?.color || '#888'
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">{formatNumber(item.count)} fans</p>
                  </div>
                );
              })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FanEngagementHeatMap;