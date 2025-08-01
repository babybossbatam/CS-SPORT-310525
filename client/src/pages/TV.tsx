
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TvIcon } from '@/components/icons/SportIcons';

const TV: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <TvIcon className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">TV Sports</h1>
              <p className="text-gray-600">Live streaming and broadcast schedules</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Card className="w-full max-w-4xl mx-auto shadow-lg">
          <CardHeader className="text-center bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <TvIcon className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
              TV Sports Coming Soon
            </CardTitle>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We're working hard to bring you live sports TV streaming, channel guides, and broadcast schedules. This exciting feature will be available very soon!
            </p>
          </CardHeader>
          
          <CardContent className="pt-8 pb-12">
            {/* Progress indicator */}
            <div className="mb-8 text-center">
              <div className="w-full bg-gray-200 rounded-full h-3 max-w-md mx-auto">
                <div className="bg-blue-600 h-3 rounded-full animate-pulse" style={{ width: '65%' }}></div>
              </div>
              <p className="text-sm text-gray-500 mt-3">Development in progress...</p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                  What's Coming
                </h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3"></span>
                    Live TV streaming integration
                  </li>
                  <li className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3"></span>
                    Sports channel listings
                  </li>
                  <li className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3"></span>
                    Match broadcast schedules
                  </li>
                  <li className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-3"></span>
                    Personalized recommendations
                  </li>
                </ul>
              </div>

              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                  Premium Features
                </h3>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3"></span>
                    HD quality streaming
                  </li>
                  <li className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3"></span>
                    Multi-device support
                  </li>
                  <li className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3"></span>
                    Real-time notifications
                  </li>
                  <li className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-3"></span>
                    Custom watchlists
                  </li>
                </ul>
              </div>
            </div>

            {/* Call to action */}
            <div className="mt-10 text-center">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg p-6 max-w-lg mx-auto">
                <h4 className="text-lg font-semibold mb-2">Stay Updated</h4>
                <p className="text-blue-100 text-sm">
                  Be the first to know when TV Sports goes live! In the meantime, explore our other sports sections for live scores and match updates.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TV;
