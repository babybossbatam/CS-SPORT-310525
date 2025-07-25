

import React from 'react';

interface MyPassProps {
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

const MyPass: React.FC<MyPassProps> = ({ 
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

  // Helper function to format percentage
  const formatPercentage = (value: string): string => {
    if (!value || value === '0' || value === 'null') return '0%';
    if (value.includes('%')) return value;
    const num = parseFloat(value);
    return isNaN(num) ? '0%' : `${num}%`;
  };

  return (
    <>
       <span className="flex text-sm  font-semibold  border-b py-3 -mx-2">Passes</span>
      {/* Pass Statistics with bars - Real API data */}
      <div className="space-y-1 -mx-2">
        {/* Always visible pass stats (first 4) */}
        <StatRowWithBars 
          label="Total Passes" 
          homeValue={getStatValue(homeStats.statistics, 'Total passes', ['Passes'])}
          awayValue={getStatValue(awayStats.statistics, 'Total passes', ['Passes'])}
        />
        <StatRowWithBars 
          label="Accuracy (%)" 
          homeValue={formatPercentage(getStatValue(homeStats.statistics, 'Passes %', ['Pass accuracy']))}
          awayValue={formatPercentage(getStatValue(awayStats.statistics, 'Passes %', ['Pass accuracy']))}
        />
        <StatRowWithBars 
          label="Passes On Target" 
          homeValue={getStatValue(homeStats.statistics, 'Passes accurate', ['Accurate passes'])}
          awayValue={getStatValue(awayStats.statistics, 'Passes accurate', ['Accurate passes'])}
        />
  
        
        {/* Expandable pass stats */}
        {isExpanded && (
          <>
            <StatRowWithBars 
              label="Throw-in" 
              homeValue={getStatValue(homeStats.statistics, 'Throw-in', ['Throw in', 'Throw ins'])}
              awayValue={getStatValue(awayStats.statistics, 'Throw-in', ['Throw in', 'Throw ins'])}
            />

            <StatRowWithBars 
              label="Goal Kicks" 
              homeValue={getStatValue(homeStats.statistics, 'Goal kicks', ['Goal Kicks'])}
              awayValue={getStatValue(awayStats.statistics, 'Goal kicks', ['Goal Kicks'])}
            />
          </>
        )}
      </div>

    </>
  );
};

export default MyPass;
