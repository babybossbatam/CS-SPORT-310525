
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest } from '@/lib/queryClient';

const POPULAR_LEAGUES = [
  { id: 2, name: 'Champions League', country: 'Europe', logo: 'https://media.api-sports.io/football/leagues/2.png' },
  { id: 39, name: 'Premier League', country: 'England', logo: 'https://media.api-sports.io/football/leagues/39.png' },
  { id: 140, name: 'La Liga', country: 'Spain', logo: 'https://media.api-sports.io/football/leagues/140.png' },
  { id: 135, name: 'Serie A', country: 'Italy', logo: 'https://media.api-sports.io/football/leagues/135.png' },
  { id: 78, name: 'Bundesliga', country: 'Germany', logo: 'https://media.api-sports.io/football/leagues/78.png' },
  { id: 3, name: 'Europa League', country: 'Europe', logo: 'https://media.api-sports.io/football/leagues/3.png' },
  { id: 307, name: 'Saudi League', country: 'Saudi Arabia', logo: 'https://media.api-sports.io/football/leagues/307.png' },
  { id: 233, name: 'Premier League', country: 'Egypt', logo: 'https://media.api-sports.io/football/leagues/233.png' }
];

const StandingsFilterCard = () => {
  const [selectedLeague, setSelectedLeague] = useState(POPULAR_LEAGUES[0].id.toString());
  const [selectedLeagueName, setSelectedLeagueName] = useState(POPULAR_LEAGUES[0].name);

  const { data: standings, isLoading } = useQuery({
    queryKey: ['standings', selectedLeague],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/leagues/${selectedLeague}/standings`);
      const data = await response.json();
      return data?.league?.standings?.[0] || [];
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Select 
            value={selectedLeague} 
            onValueChange={(value) => {
              setSelectedLeague(value);
              const league = POPULAR_LEAGUES.find(l => l.id.toString() === value);
              if (league) {
                setSelectedLeagueName(league.name);
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue>Loading...</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {POPULAR_LEAGUES.map((league) => (
                <SelectItem key={league.id} value={league.id.toString()}>
                  <div className="flex items-center gap-2">
                    <img
                      src={league.logo}
                      alt={league.name}
                      className="h-5 w-5 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/fallback-logo.svg';
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
          <div className="h-[400px] flex items-center justify-center">
            <p>Loading standings...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <Select 
          value={selectedLeague} 
          onValueChange={(value) => {
            setSelectedLeague(value);
            const league = POPULAR_LEAGUES.find(l => l.id.toString() === value);
            if (league) {
              setSelectedLeagueName(league.name);
            }
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue>
              <div className="flex items-center gap-2">
                <img
                  src={POPULAR_LEAGUES.find(l => l.id.toString() === selectedLeague)?.logo}
                  alt={selectedLeagueName}
                  className="h-5 w-5 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/fallback-logo.svg';
                  }}
                />
                {selectedLeagueName}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {POPULAR_LEAGUES.map((league) => (
              <SelectItem key={league.id} value={league.id.toString()}>
                <div className="flex items-center gap-2">
                  <img
                    src={league.logo}
                    alt={league.name}
                    className="h-5 w-5 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/fallback-logo.svg';
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
      </CardContent>
    </Card>
  );
};

export default StandingsFilterCard;
