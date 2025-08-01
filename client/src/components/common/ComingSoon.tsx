
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TvIcon } from '@/components/icons/SportIcons';

interface ComingSoonProps {
  title?: string;
  description?: string;
  icon?: React.ComponentType<any>;
  feature?: string;
}

const ComingSoon: React.FC<ComingSoonProps> = ({
  title = "Coming Soon",
  description = "This feature is currently under development and will be available soon.",
  icon: Icon = TvIcon,
  feature = "feature"
}) => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center  ">
      <Card className="w-full max-w-2xl mx-auto shadow-lg mt-16">
        <CardContent className="pt-12 pb-12 text-center">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <Icon className="h-12 w-12 text-gray-400" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>

          {/* Description */}
          <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
            {description}
          </p>

          {/* Progress indicator */}
          <div className="mb-8">
            <div className="w-full bg-gray-200 rounded-full h-2 max-w-xs mx-auto">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '55%' }}></div>
            </div>
            <p className="text-sm text-gray-500 mt-2">Development in progress...</p>
          </div>

          {/* Features coming */}
          <div className="rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">What's Coming</h3>
            <ul className="text-left text-gray-800 space-y-2">
              {feature === 'horseracing' ? (
                <>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-gray-600 rounded-full mr-3"></span>
                    Live race results and odds
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-gray-600 rounded-full mr-3"></span>
                    Horse and jockey statistics
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-gray-600 rounded-full mr-3"></span>
                    Track conditions and schedules
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-gray-600 rounded-full mr-3"></span>
                    Major race coverage
                  </li>
                </>
              ) : feature === 'snooker' ? (
                <>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-gray-600 rounded-full mr-3"></span>
                    Live tournament scores
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-gray-600 rounded-full mr-3"></span>
                    Player rankings and statistics
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-gray-600 rounded-full mr-3"></span>
                    World Championship coverage
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-gray-600 rounded-full mr-3"></span>
                    Match highlights and results
                  </li>
                </>
              ) : feature === 'esports' ? (
                <>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-gray-600 rounded-full mr-3"></span>
                    Live tournament streams
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-gray-600 rounded-full mr-3"></span>
                    Team and player statistics
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-gray-600 rounded-full mr-3"></span>
                    Major championship coverage
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-gray-600 rounded-full mr-3"></span>
                    Game-specific tournaments
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-gray-600 rounded-full mr-3"></span>
                    Live TV streaming integration
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-gray-600 rounded-full mr-3"></span>
                    Sports channel listings
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-gray-600 rounded-full mr-3"></span>
                    Match broadcast schedules
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-gray-600 rounded-full mr-3"></span>
                    Personalized recommendations
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Call to action */}
          <div className="mt-8">
            <p className="text-sm text-gray-500">
              Stay tuned for updates! In the meantime, explore our other sports sections.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComingSoon;
