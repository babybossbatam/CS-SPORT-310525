
import React from 'react';

interface MyShotsProps {
  homeStats: any;
  awayStats: any;
  homeTeam: any;
  awayTeam: any;
}

// Enhanced StatRow component with circular backgrounds for shots
const ShotStatRow: React.FC<{
  label: string;
  homeValue: string | number;
  awayValue: string | number;
  homeColor?: string;
  awayColor?: string;
}> = ({ label, homeValue, awayValue, homeColor = '#ef4444', awayColor = '#10b981' }) => {
  // Convert values to numbers for comparison
  const homeNum = typeof homeValue === 'string' ? parseFloat(homeValue.replace('%', '')) || 0 : homeValue || 0;
  const awayNum = typeof awayValue === 'string' ? parseFloat(awayValue.replace('%', '')) || 0 : awayValue || 0;
  
  // Determine which team has higher value
  const homeIsHigher = homeNum > awayNum;
  const awayIsHigher = awayNum > homeNum;

  return (
    <div className="py-2 border-b border-gray-100 last:border-b-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-start w-12 text-left">
          <span 
            className={`text-sm font-medium px-2 py-1 rounded-full ${
              homeIsHigher 
                ? 'bg-red-700 text-white' 
                : 'text-gray-900'
            }`}
          >
            {homeValue}
          </span>
        </div>
        
        <span className="text-sm font-reg text-gray-700 text-center flex-1 px-4">{label}</span>
        
        <div className="flex items-center justify-end w-12 text-right">
          <span 
            className={`text-sm font-medium px-2 py-1 rounded-full ${
              awayIsHigher 
                ? 'bg-green-700 text-white' 
                : 'text-gray-900'
            }`}
          >
            {awayValue}
          </span>
        </div>
      </div>
    </div>
  );
};

const MyShots: React.FC<MyShotsProps> = ({ 
  homeStats, 
  awayStats, 
  homeTeam, 
  awayTeam 
}) => {
  // Helper function to get stat value with multiple possible field names
  const getStatValue = (stats: any[], type: string, alternativeTypes: string[] = []): string => {
    if (!stats || !Array.isArray(stats)) return '0';
    
    // Try primary type first
    let stat = stats.find(s => s.type === type);
    
    // If not found, try alternative types
    if (!stat && alternativeTypes.length > 0) {
      for (const altType of alternativeTypes) {
        stat = stats.find(s => s.type === altType);
        if (stat) break;
      }
    }
    
    return stat && stat.value !== null && stat.value !== undefined ? String(stat.value) : '0';
  };

  return (
    <>
      {/* Team Headers */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b">
        <div className="flex items-center space-x-2">
          <img 
            src={homeTeam?.logo || "/assets/fallback-logo.png"} 
            alt={homeTeam?.name}
            className="w-6 h-6 object-contain"
          />
          <span className="text-sm font-semibold truncate max-w-20">{homeTeam?.name}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-semibold truncate max-w-20">{awayTeam?.name}</span>
          <img 
            src={awayTeam?.logo || "/assets/fallback-logo.png"} 
            alt={awayTeam?.name}
            className="w-6 h-6 object-contain"
          />
        </div>
      </div>

      {/* Shot Statistics */}
      <div className="space-y-3">
        <ShotStatRow 
          label="Blocked Shots" 
          homeValue={getStatValue(homeStats.statistics, 'Blocked Shots', ['Blocked shots'])}
          awayValue={getStatValue(awayStats.statistics, 'Blocked Shots', ['Blocked shots'])}
        />
        <ShotStatRow 
          label="Shots insidebox" 
          homeValue={getStatValue(homeStats.statistics, 'Shots insidebox', ['Shots inside box'])}
          awayValue={getStatValue(awayStats.statistics, 'Shots insidebox', ['Shots inside box'])}
        />
        <ShotStatRow 
          label="Shots outsidebox" 
          homeValue={getStatValue(homeStats.statistics, 'Shots outsidebox', ['Shots outside box'])}
          awayValue={getStatValue(awayStats.statistics, 'Shots outsidebox', ['Shots outside box'])}
        />
      </div>
    </>
  );
};

export default MyShots;
