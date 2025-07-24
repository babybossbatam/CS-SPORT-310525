import React from "react";

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
}> = ({
  label,
  homeValue,
  awayValue,
  homeColor = "#ef4444",
  awayColor = "#10b981",
}) => {
  // Convert values to numbers for comparison
  const homeNum =
    typeof homeValue === "string"
      ? parseFloat(homeValue.replace("%", "")) || 0
      : homeValue || 0;
  const awayNum =
    typeof awayValue === "string"
      ? parseFloat(awayValue.replace("%", "")) || 0
      : awayValue || 0;

  // Determine which team has higher value (for discipline stats, lower is usually better)
  const homeIsHigher = homeNum > awayNum;
  const awayIsHigher = awayNum > homeNum;

  return (
    <div className="py-2 border-b border-gray-100 last:border-b-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-start w-12 text-left">
          <span
            className={`text-sm font-medium px-2 py-1 rounded-full ${
              homeIsHigher ? "bg-red-700 text-white" : "text-gray-900"
            }`}
          >
            {homeValue}
          </span>
        </div>

        <span className="text-sm font-reg text-gray-700 text-center flex-1 px-4">
          {label}
        </span>

        <div className="flex items-center justify-end w-12 text-right">
          <span
            className={`text-sm font-medium px-2 py-1 rounded-full ${
              awayIsHigher ? "bg-green-700 text-white" : "text-gray-900"
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
  onToggleExpanded,
}) => {
  // Helper function to get stat value with multiple possible field names
  const getStatValue = (
    stats: any[],
    type: string,
    alternativeTypes: string[] = [],
  ): string => {
    if (!stats || !Array.isArray(stats)) return "0";

    // Try primary type first
    let stat = stats.find((s) => s.type === type);

    // If not found, try alternative types
    if (!stat && alternativeTypes.length > 0) {
      for (const altType of alternativeTypes) {
        stat = stats.find((s) => s.type === altType);
        if (stat) break;
      }
    }

    return stat && stat.value !== null && stat.value !== undefined
      ? String(stat.value)
      : "0";
  };

  return (
    <>
      <span className="flex text-sm  font-semibold border-b py-3 -mx-2">
        Discipline
      </span>
      {/* Discipline Statistics with bars - Real API data */}
      <div className="space-y-1">
        {/* Always visible discipline stats (first 4) */}
        <StatRowWithBars
          label="Fouls"
          homeValue={getStatValue(homeStats.statistics, "Fouls")}
          awayValue={getStatValue(awayStats.statistics, "Fouls")}
        />
        <StatRowWithBars
          label="Red Cards"
          homeValue={getStatValue(homeStats.statistics, "Red Cards")}
          awayValue={getStatValue(awayStats.statistics, "Red Cards")}
        />

        <StatRowWithBars
          label="Yellow Cards"
          homeValue={getStatValue(homeStats.statistics, "Yellow Cards")}
          awayValue={getStatValue(awayStats.statistics, "Yellow Cards")}
        />
     

        {/* Expandable discipline stats */}
        {isExpanded && (
          <>
            
          </>
        )}
      </div>

   
    </>
  );
};

export default MyDiscipline;
