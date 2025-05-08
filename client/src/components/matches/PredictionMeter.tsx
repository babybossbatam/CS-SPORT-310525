import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { TrendingUp, Activity, Percent, Award } from 'lucide-react';

interface TeamPrediction {
  chance: number;  // 0-100 percentage
  form: 'ascending' | 'descending' | 'stable';
  history: number; // 0-100 percentage based on historical wins
}

interface PredictionMeterProps {
  homeTeam: {
    id: number;
    name: string;
    logo: string;
    prediction: TeamPrediction;
  };
  awayTeam: {
    id: number;
    name: string;
    logo: string;
    prediction: TeamPrediction;
  };
  drawChance: number; // 0-100 percentage
  confidence: number; // 0-100 percentage of how confident the prediction is
}

const PredictionMeter: React.FC<PredictionMeterProps> = ({
  homeTeam,
  awayTeam,
  drawChance,
  confidence
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // Determine the winner prediction
  const homeWins = homeTeam.prediction.chance > (awayTeam.prediction.chance + drawChance);
  const awayWins = awayTeam.prediction.chance > (homeTeam.prediction.chance + drawChance);
  const isDraw = !homeWins && !awayWins;
  
  // Format predictions for display
  const formatPrediction = (num: number) => {
    return Math.round(num) + '%';
  };
  
  // Get color based on form trend
  const getFormColor = (form: 'ascending' | 'descending' | 'stable') => {
    switch (form) {
      case 'ascending':
        return 'text-green-500';
      case 'descending':
        return 'text-red-500';
      case 'stable':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };
  
  // Get icon based on form trend
  const getFormIcon = (form: 'ascending' | 'descending' | 'stable') => {
    switch (form) {
      case 'ascending':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'descending':
        return <TrendingUp className="h-3 w-3 text-red-500 transform rotate-180" />;
      case 'stable':
        return <Activity className="h-3 w-3 text-yellow-500" />;
      default:
        return null;
    }
  };
  
  // Trigger animation on hover
  const handleHover = () => {
    setIsHovered(true);
    setIsAnimating(true);
    
    // Reset animation after a short delay
    setTimeout(() => {
      setIsAnimating(false);
    }, 1000);
  };
  
  // Get confidence level text
  const getConfidenceText = () => {
    if (confidence >= 80) return 'Very High';
    if (confidence >= 60) return 'High';
    if (confidence >= 40) return 'Medium';
    if (confidence >= 20) return 'Low';
    return 'Very Low';
  };
  
  // Get confidence level color
  const getConfidenceColor = () => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-green-500';
    if (confidence >= 40) return 'text-yellow-500';
    if (confidence >= 20) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <Card 
      className="shadow-md overflow-hidden"
      onMouseEnter={handleHover}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="p-4 border-b">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg flex items-center">
            <Award className="h-5 w-5 mr-2 text-amber-500" />
            Match Prediction
          </h3>
          <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full text-xs">
            <Percent className="h-3 w-3 mr-1" />
            <span>Confidence:</span>
            <span className={`font-semibold ${getConfidenceColor()}`}>
              {getConfidenceText()}
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="flex flex-col space-y-6">
          {/* Prediction Meter */}
          <div className="relative h-8 rounded-full bg-gray-200 overflow-hidden">
            <div className="absolute inset-0 flex">
              <motion.div 
                className="h-full bg-blue-600"
                style={{ width: `${homeTeam.prediction.chance}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${homeTeam.prediction.chance}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
              <motion.div 
                className="h-full bg-gray-400"
                style={{ width: `${drawChance}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${drawChance}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
              />
              <motion.div 
                className="h-full bg-red-600"
                style={{ width: `${awayTeam.prediction.chance}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${awayTeam.prediction.chance}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.6 }}
              />
            </div>
            
            {/* Animated pulse on the most likely outcome */}
            {isAnimating && (
              <motion.div 
                className={`absolute top-0 bottom-0 bg-white opacity-20 w-12 ${
                  homeWins ? 'left-0' : awayWins ? 'right-0' : 'left-1/2 transform -translate-x-1/2'
                }`}
                animate={{
                  x: homeWins ? [0, 50, 0] : awayWins ? [0, -50, 0] : [0, -40, 40, 0],
                  opacity: [0.1, 0.4, 0.1]
                }}
                transition={{ 
                  duration: 1.5, 
                  ease: "easeInOut",
                  repeat: 0 
                }}
              />
            )}
            
            {/* Confidence level indicator */}
            <motion.div 
              className="absolute bottom-0 h-1 bg-white"
              style={{ 
                width: `${confidence}%`,
                left: `${(100-confidence)/2}%`
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 0.6 : 0 }}
              transition={{ duration: 0.3 }}
            />
          </div>
          
          {/* Team predictions */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div 
              className={`p-2 rounded transition-all duration-300 ${
                homeWins ? 'bg-blue-50 shadow-sm scale-105' : ''
              }`}
            >
              <div className="flex items-center justify-center mb-2">
                <img src={homeTeam.logo} alt={homeTeam.name} className="h-10 w-10" />
              </div>
              <div className="font-medium text-sm mb-1">{homeTeam.name}</div>
              <div className={`text-lg font-bold ${homeWins ? 'text-blue-600' : 'text-gray-700'}`}>
                {formatPrediction(homeTeam.prediction.chance)}
              </div>
              <div className="flex items-center justify-center text-xs mt-1">
                <span className={`flex items-center ${getFormColor(homeTeam.prediction.form)}`}>
                  {getFormIcon(homeTeam.prediction.form)}
                  <span className="ml-1">Form</span>
                </span>
              </div>
            </div>
            
            <div 
              className={`p-2 rounded transition-all duration-300 ${
                isDraw ? 'bg-gray-50 shadow-sm scale-105' : ''
              }`}
            >
              <div className="mb-2 h-10 flex items-center justify-center text-2xl font-bold">
                X
              </div>
              <div className="font-medium text-sm mb-1">Draw</div>
              <div className={`text-lg font-bold ${isDraw ? 'text-gray-600' : 'text-gray-700'}`}>
                {formatPrediction(drawChance)}
              </div>
              <div className="text-xs mt-1 text-gray-500">
                Neutral
              </div>
            </div>
            
            <div 
              className={`p-2 rounded transition-all duration-300 ${
                awayWins ? 'bg-red-50 shadow-sm scale-105' : ''
              }`}
            >
              <div className="flex items-center justify-center mb-2">
                <img src={awayTeam.logo} alt={awayTeam.name} className="h-10 w-10" />
              </div>
              <div className="font-medium text-sm mb-1">{awayTeam.name}</div>
              <div className={`text-lg font-bold ${awayWins ? 'text-red-600' : 'text-gray-700'}`}>
                {formatPrediction(awayTeam.prediction.chance)}
              </div>
              <div className="flex items-center justify-center text-xs mt-1">
                <span className={`flex items-center ${getFormColor(awayTeam.prediction.form)}`}>
                  {getFormIcon(awayTeam.prediction.form)}
                  <span className="ml-1">Form</span>
                </span>
              </div>
            </div>
          </div>
          
          {/* Prediction explanation */}
          <div className="text-xs text-gray-500 border-t pt-3 mt-2">
            <p className="text-center italic">
              {homeWins 
                ? `${homeTeam.name} has a ${formatPrediction(homeTeam.prediction.chance)} chance of winning based on recent form and historical data.`
                : awayWins
                ? `${awayTeam.name} has a ${formatPrediction(awayTeam.prediction.chance)} chance of winning based on recent form and historical data.`
                : `This match has a high probability (${formatPrediction(drawChance)}) of ending in a draw.`
              }
            </p>
            <div className="text-center mt-2">
              <span className={getConfidenceColor()}>
                {confidence >= 70 
                  ? "This prediction has strong statistical backing." 
                  : confidence >= 40
                  ? "This prediction is based on moderate statistical evidence."
                  : "This prediction has limited statistical backing."}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PredictionMeter;