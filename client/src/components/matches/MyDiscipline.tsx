

import React from 'react';

interface MyDisciplineProps {
  homeStats: any;
  awayStats: any;
  homeTeam: any;
  awayTeam: any;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

// Enhanced StatRow component with circular backgrounds
const StatRowWithBars: React.FC<{
  label: string;
  homeValue: string | number;
  awayValue: string | number;
  homeColor?: string;
  awayColor?: string;
}> = ({ label, homeValue, awayValue, homeColor = '#ef4444', awayColor = '#10b981' }) => {
  // Convert values to numbers for comparison
  const homeNum = typeof homeValue === 'string' ? parseFloat(homeValue.replace('%', '')) || 0 : homeValue || 0;
  const awayNum = typeof awayValue === 'string' ? parseFloat(awayValue.replace('%', '')) || 0 : awayValue || 0;
  
  // Determine which team has higher value (for discipline stats, lower is usually better)
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

const MyDiscipline: React.FC<MyDisciplineProps> = ({ 
  homeStats, 
  awayStats, 
  homeTeam, 
  awayTeam, 
  isExpanded, 
  onToggleExpanded 
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
      <div className="flex items-center justify-between mb-1 pb-1 border-b">
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

      {/* Discipline Statistics with bars - Real API data */}
      <div className="space-y-1">
        {/* Always visible discipline stats (first 4) */}
        <StatRowWithBars 
          label="Fouls" 
          homeValue={getStatValue(homeStats.statistics, 'Fouls')}
          awayValue={getStatValue(awayStats.statistics, 'Fouls')}
        />
        <StatRowWithBars 
          label="Yellow Cards" 
          homeValue={getStatValue(homeStats.statistics, 'Yellow Cards')}
          awayValue={getStatValue(awayStats.statistics, 'Yellow Cards')}
        />
        <StatRowWithBars 
          label="Red Cards" 
          homeValue={getStatValue(homeStats.statistics, 'Red Cards')}
          awayValue={getStatValue(awayStats.statistics, 'Red Cards')}
        />
        <StatRowWithBars 
          label="Offsides" 
          homeValue={getStatValue(homeStats.statistics, 'Offsides', ['Offside'])}
          awayValue={getStatValue(awayStats.statistics, 'Offsides', ['Offside'])}
        />
        
        {/* Expandable discipline stats */}
        {isExpanded && (
          <>
            <StatRowWithBars 
              label="Fouls Committed" 
              homeValue={getStatValue(homeStats.statistics, 'Fouls committed', ['Fouls Committed'])}
              awayValue={getStatValue(awayStats.statistics, 'Fouls committed', ['Fouls Committed'])}
            />
            
            <StatRowWithBars 
              label="Fouls Suffered" 
              homeValue={getStatValue(homeStats.statistics, 'Fouls suffered', ['Fouls Suffered'])}
              awayValue={getStatValue(awayStats.statistics, 'Fouls suffered', ['Fouls Suffered'])}
            />
            
            <StatRowWithBars 
              label="Aggressive Fouls" 
              homeValue={getStatValue(homeStats.statistics, 'Aggressive fouls', ['Aggressive Fouls'])}
              awayValue={getStatValue(awayStats.statistics, 'Aggressive fouls', ['Aggressive Fouls'])}
            />
            
            <StatRowWithBars 
              label="Technical Fouls" 
              homeValue={getStatValue(homeStats.statistics, 'Technical fouls', ['Technical Fouls'])}
              awayValue={getStatValue(awayStats.statistics, 'Technical fouls', ['Technical Fouls'])}
            />

            <StatRowWithBars 
              label="Fair Play Score" 
              homeValue={getStatValue(homeStats.statistics, 'Fair play score', ['Fair Play Score'])}
              awayValue={getStatValue(awayStats.statistics, 'Fair play score', ['Fair Play Score'])}
            />

            <StatRowWithBars 
              label="Disciplinary Points" 
              homeValue={getStatValue(homeStats.statistics, 'Disciplinary points', ['Disciplinary Points'])}
              awayValue={getStatValue(awayStats.statistics, 'Disciplinary points', ['Disciplinary Points'])}
            />

            <StatRowWithBars 
              label="Bookings Points" 
              homeValue={getStatValue(homeStats.statistics, 'Bookings points', ['Bookings Points'])}
              awayValue={getStatValue(awayStats.statistics, 'Bookings points', ['Bookings Points'])}
            />
            
            <StatRowWithBars 
              label="Cards Per Game" 
              homeValue={getStatValue(homeStats.statistics, 'Cards per game', ['Cards Per Game'])}
              awayValue={getStatValue(awayStats.statistics, 'Cards per game', ['Cards Per Game'])}
            />
            
            <StatRowWithBars 
              label="Time Wasting" 
              homeValue={getStatValue(homeStats.statistics, 'Time wasting', ['Time Wasting'])}
              awayValue={getStatValue(awayStats.statistics, 'Time wasting', ['Time Wasting'])}
            />
            
            <StatRowWithBars 
              label="Unsporting Behavior" 
              homeValue={getStatValue(homeStats.statistics, 'Unsporting behavior', ['Unsporting Behavior'])}
              awayValue={getStatValue(awayStats.statistics, 'Unsporting behavior', ['Unsporting Behavior'])}
            />
          </>
        )}
      </div>

      {/* Expand/Collapse Button */}
      <div className="mt-4 -mx-4">
        <button
          onClick={onToggleExpanded}
          className="w-full flex items-center justify-center gap-2 text-sm text-gray-600 hover:bg-gray-100 font-medium py-1 -mb-4 px-4 transition-colors duration-200"
        >
          <span>{isExpanded ? 'Show Less' : 'See All'}</span>
          {isExpanded ? (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>
      </div>
    </>
  );
};

export default MyDiscipline;
