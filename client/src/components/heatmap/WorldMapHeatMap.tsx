import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

// Define country regions with their coordinates
const countryRegions = [
  { id: 'uk', name: 'United Kingdom', x: 440, y: 130, engagement: 125000, color: '#ff5e5e' },
  { id: 'spain', name: 'Spain', x: 430, y: 160, engagement: 110000, color: '#ff5e5e' },
  { id: 'germany', name: 'Germany', x: 470, y: 130, engagement: 145000, color: '#ff5e5e' },
  { id: 'france', name: 'France', x: 450, y: 145, engagement: 98000, color: '#ff5e5e' },
  { id: 'italy', name: 'Italy', x: 480, y: 155, engagement: 102000, color: '#ff5e5e' },
  { id: 'usa', name: 'United States', x: 220, y: 155, engagement: 205000, color: '#5e9aff' },
  { id: 'canada', name: 'Canada', x: 220, y: 110, engagement: 75000, color: '#5e9aff' },
  { id: 'mexico', name: 'Mexico', x: 180, y: 180, engagement: 65000, color: '#5e9aff' },
  { id: 'brazil', name: 'Brazil', x: 300, y: 250, engagement: 180000, color: '#5eff5e' },
  { id: 'argentina', name: 'Argentina', x: 270, y: 300, engagement: 95000, color: '#5eff5e' },
  { id: 'south_africa', name: 'South Africa', x: 490, y: 280, engagement: 48000, color: '#ffb55e' },
  { id: 'nigeria', name: 'Nigeria', x: 460, y: 205, engagement: 72000, color: '#ffb55e' },
  { id: 'egypt', name: 'Egypt', x: 510, y: 180, engagement: 58000, color: '#ffb55e' },
  { id: 'china', name: 'China', x: 650, y: 160, engagement: 135000, color: '#d15eff' },
  { id: 'japan', name: 'Japan', x: 720, y: 160, engagement: 95000, color: '#d15eff' },
  { id: 'india', name: 'India', x: 600, y: 190, engagement: 126000, color: '#d15eff' },
  { id: 'australia', name: 'Australia', x: 700, y: 270, engagement: 68000, color: '#5effff' },
  { id: 'new_zealand', name: 'New Zealand', x: 770, y: 300, engagement: 42000, color: '#5effff' },
];

// Group countries by region
const regions = [
  { id: 'europe', name: 'Europe', color: '#ff5e5e', countries: ['uk', 'spain', 'germany', 'france', 'italy'] },
  { id: 'north_america', name: 'North America', color: '#5e9aff', countries: ['usa', 'canada', 'mexico'] },
  { id: 'south_america', name: 'South America', color: '#5eff5e', countries: ['brazil', 'argentina'] },
  { id: 'africa', name: 'Africa', color: '#ffb55e', countries: ['south_africa', 'nigeria', 'egypt'] },
  { id: 'asia', name: 'Asia', color: '#d15eff', countries: ['china', 'japan', 'india'] },
  { id: 'oceania', name: 'Oceania', color: '#5effff', countries: ['australia', 'new_zealand'] },
];

interface WorldMapHeatMapProps {
  matchId?: number;
  teamId?: number;
  className?: string;
}

const WorldMapHeatMap: React.FC<WorldMapHeatMapProps> = ({ matchId, teamId, className = '' }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Format number with commas
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  useEffect(() => {
    // Simulate API loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [matchId, teamId]);

  const getTotalEngagement = () => {
    return countryRegions.reduce((sum, country) => sum + country.engagement, 0);
  };

  const getRegionEngagement = (regionId: string) => {
    const region = regions.find(r => r.id === regionId);
    if (!region) return 0;
    
    return countryRegions
      .filter(country => region.countries.includes(country.id))
      .reduce((sum, country) => sum + country.engagement, 0);
  };

  const handleRegionClick = (regionId: string) => {
    setSelectedRegion(regionId === selectedRegion ? null : regionId);
  };

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Interactive Fan Engagement Map</CardTitle>
        <p className="text-sm text-muted-foreground">
          {isLoading 
            ? 'Loading map data...' 
            : `Total Engagement: ${formatNumber(getTotalEngagement())} fans`
          }
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="w-full aspect-[16/9]">
            <Skeleton className="w-full h-full" />
          </div>
        ) : (
          <div className="space-y-4">
            <div ref={mapRef} className="relative w-full aspect-[16/9] bg-slate-50 rounded-lg overflow-hidden">
              {/* World map background - simplified for demo */}
              <div className="absolute inset-0 bg-slate-100 opacity-70">
                <svg width="100%" height="100%" viewBox="0 0 800 400">
                  {/* Simplified world continent outlines */}
                  <path d="M400,100 Q450,50 500,100 T600,120 T700,150 Q750,200 700,250 T600,280 T500,250 Q450,300 400,250 T300,280 T200,250 Q150,200 200,150 T300,120 T400,100" 
                    fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
                </svg>
              </div>
              
              {/* Region hotspots */}
              {regions.map(region => {
                const isSelected = selectedRegion === region.id;
                const regionEngagement = getRegionEngagement(region.id);
                const totalEngagement = getTotalEngagement();
                const percentage = Math.round((regionEngagement / totalEngagement) * 100);
                
                // Calculate region center by averaging country positions
                const countries = countryRegions.filter(c => region.countries.includes(c.id));
                const avgX = countries.reduce((sum, c) => sum + c.x, 0) / countries.length;
                const avgY = countries.reduce((sum, c) => sum + c.y, 0) / countries.length;
                
                return (
                  <div key={region.id} className="absolute transform -translate-x-1/2 -translate-y-1/2"
                    style={{ 
                      left: `${avgX / 8}%`, 
                      top: `${avgY / 4}%`,
                      zIndex: isSelected ? 10 : 5
                    }}>
                    <div
                      className={`cursor-pointer transition-all duration-300 rounded-full flex items-center justify-center
                        ${isSelected ? 'scale-125 shadow-lg' : 'hover:scale-110'}`}
                      style={{
                        backgroundColor: region.color,
                        width: `${Math.max(percentage * 0.8, 15)}px`,
                        height: `${Math.max(percentage * 0.8, 15)}px`,
                        opacity: hoveredCountry && !region.countries.includes(hoveredCountry) ? 0.3 : 0.7
                      }}
                      onClick={() => handleRegionClick(region.id)}
                    >
                      {isSelected && (
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white p-2 rounded shadow-md text-xs text-center whitespace-nowrap">
                          <strong>{region.name}:</strong> {formatNumber(regionEngagement)} fans ({percentage}%)
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {/* Country markers */}
              {countryRegions.map(country => {
                const isHighlighted = selectedRegion 
                  ? regions.find(r => r.id === selectedRegion)?.countries.includes(country.id)
                  : hoveredCountry === country.id;
                
                return (
                  <div 
                    key={country.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                    style={{ 
                      left: `${country.x / 8}%`, 
                      top: `${country.y / 4}%`,
                      zIndex: isHighlighted ? 20 : 10
                    }}
                    onMouseEnter={() => setHoveredCountry(country.id)}
                    onMouseLeave={() => setHoveredCountry(null)}
                  >
                    <div
                      className={`transition-all duration-300 rounded-full
                        ${isHighlighted ? 'scale-150 shadow-lg' : 'scale-100'}`}
                      style={{
                        backgroundColor: country.color,
                        width: '6px',
                        height: '6px',
                        opacity: isHighlighted ? 1 : 0.6
                      }}
                    />
                    
                    {hoveredCountry === country.id && (
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white p-2 rounded shadow-md text-xs z-30 whitespace-nowrap">
                        <strong>{country.name}:</strong> {formatNumber(country.engagement)} fans
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Region legend */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {regions.map(region => {
                const regionEngagement = getRegionEngagement(region.id);
                const totalEngagement = getTotalEngagement();
                const percentage = Math.round((regionEngagement / totalEngagement) * 100);
                
                return (
                  <div key={region.id} 
                    className={`flex items-center gap-2 p-1 rounded cursor-pointer
                      ${selectedRegion === region.id ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                    onClick={() => handleRegionClick(region.id)}
                  >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: region.color }} />
                    <div className="flex-1 truncate">{region.name}</div>
                    <div className="font-medium">{percentage}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WorldMapHeatMap;