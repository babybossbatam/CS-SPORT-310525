
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';

interface MyShotsProps {
  homeStats: any;
  awayStats: any;
  homeTeam: any;
  awayTeam: any;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
}

interface StatRowWithBarsProps {
  label: string;
  homeValue: string | number;
  awayValue: string | number;
  homeTeam?: any;
  awayTeam?: any;
}

const StatRowWithBars: React.FC<StatRowWithBarsProps> = ({ 
  label, 
  homeValue, 
  awayValue, 
  homeTeam, 
  awayTeam 
}) => {
  const homeNum = parseFloat(String(homeValue)) || 0;
  const awayNum = parseFloat(String(awayValue)) || 0;
  const total = homeNum + awayNum;
  
  const homePercentage = total > 0 ? (homeNum / total) * 100 : 50;
  const awayPercentage = total > 0 ? (awayNum / total) * 100 : 50;

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
      {/* Home team value and logo */}
      <div className="flex items-center space-x-2 w-16 justify-end">
        <span className="text-sm font-medium">{homeValue}</span>
        {homeTeam?.logo && (
          <img 
            src={homeTeam.logo} 
            alt={homeTeam.name}
            className="w-4 h-4 object-contain"
          />
        )}
      </div>

      {/* Center section with bars and label */}
      <div className="flex-1 mx-4">
        <div className="text-xs text-center text-gray-600 mb-1">{label}</div>
        <div className="flex items-center h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${homePercentage}%` }}
          />
          <div 
            className="h-full bg-red-500 transition-all duration-300"
            style={{ width: `${awayPercentage}%` }}
          />
        </div>
      </div>

      {/* Away team logo and value */}
      <div className="flex items-center space-x-2 w-16">
        {awayTeam?.logo && (
          <img 
            src={awayTeam.logo} 
            alt={awayTeam.name}
            className="w-4 h-4 object-contain"
          />
        )}
        <span className="text-sm font-medium">{awayValue}</span>
      </div>
    </div>
  );
};

const MyShots: React.FC<MyShotsProps> = ({ 
  homeStats, 
  awayStats, 
  homeTeam, 
  awayTeam, 
  isExpanded = false,
  onToggleExpanded 
}) => {
  const [localExpanded, setLocalExpanded] = useState(false);
  const expanded = isExpanded || localExpanded;

  const getStatValue = (stats: any, type: string, alternatives: string[] = []): string => {
    if (!stats?.statistics || !Array.isArray(stats.statistics)) return '0';
    
    // First try the exact type
    let stat = stats.statistics.find((s: any) => s.type === type);
    
    // If not found, try alternatives
    if (!stat && alternatives.length > 0) {
      for (const alt of alternatives) {
        stat = stats.statistics.find((s: any) => s.type === alt);
        if (stat) break;
      }
    }
    
    return stat ? String(stat.value) : '0';
  };

  const formatPercentage = (value: string | number): string => {
    const numValue = parseFloat(String(value));
    if (isNaN(numValue)) return '0%';
    
    // If the value is already a percentage (> 1), return as is
    if (numValue > 1) {
      return `${Math.round(numValue)}%`;
    }
    
    // If it's a decimal (0-1), convert to percentage
    return `${Math.round(numValue * 100)}%`;
  };

  // Shot-specific statistics
  const shotStats = [
    {
      label: 'Total Shots',
      homeValue: getStatValue(homeStats, 'Total Shots', ['Shots', 'total shots']),
      awayValue: getStatValue(awayStats, 'Total Shots', ['Shots', 'total shots'])
    },
    {
      label: 'Shots on Goal',
      homeValue: getStatValue(homeStats, 'Shots on Goal', ['Shots on target', 'shots on target']),
      awayValue: getStatValue(awayStats, 'Shots on Goal', ['Shots on target', 'shots on target'])
    },
    {
      label: 'Blocked Shots',
      homeValue: getStatValue(homeStats, 'Blocked Shots', ['Blocked shots']),
      awayValue: getStatValue(awayStats, 'Blocked Shots', ['Blocked shots'])
    }
  ];

  const additionalShotStats = [
    {
      label: 'Shots Inside Box',
      homeValue: getStatValue(homeStats, 'Shots insidebox', ['Shots inside box']),
      awayValue: getStatValue(awayStats, 'Shots insidebox', ['Shots inside box'])
    },
    {
      label: 'Shots Outside Box',
      homeValue: getStatValue(homeStats, 'Shots outsidebox', ['Shots outside box']),
      awayValue: getStatValue(awayStats, 'Shots outsidebox', ['Shots outside box'])
    },
    {
      label: 'Shot Accuracy',
      homeValue: formatPercentage(getStatValue(homeStats, 'Shot Accuracy', ['shots on target %', 'Shot accuracy'])),
      awayValue: formatPercentage(getStatValue(awayStats, 'Shot Accuracy', ['shots on target %', 'Shot accuracy']))
    }
  ];

  const allStats = [...shotStats, ...(expanded ? additionalShotStats : [])];

  const handleToggleExpanded = () => {
    if (onToggleExpanded) {
      onToggleExpanded();
    } else {
      setLocalExpanded(!localExpanded);
    }
  };

  return (
    <div className="space-y-0">
      {/* Team headers */}
      <div className="flex items-center justify-between py-2 mb-2">
        <div className="flex items-center space-x-2 w-16 justify-end">
          <span className="text-xs font-medium text-gray-600">{homeTeam?.name}</span>
        </div>
        
        <div className="flex-1 mx-4">
          <div className="text-xs text-center text-gray-500 font-medium">Shot Statistics</div>
        </div>
        
        <div className="flex items-center space-x-2 w-16">
          <span className="text-xs font-medium text-gray-600">{awayTeam?.name}</span>
        </div>
      </div>

      {/* Shot statistics rows */}
      {allStats.map((stat, index) => (
        <StatRowWithBars
          key={`${stat.label}-${index}`}
          label={stat.label}
          homeValue={stat.homeValue}
          awayValue={stat.awayValue}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
        />
      ))}

      {/* See All / Collapse button */}
      <div className="flex justify-center pt-3">
        <button
          onClick={handleToggleExpanded}
          className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
        >
          <span>{expanded ? 'Show Less' : 'See All'}</span>
          {expanded ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
        </button>
      </div>
    </div>
  );
};

export default MyShots;
