import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { useLocation } from 'wouter';

const FeaturedMatch = () => {
  const [, navigate] = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrevious = () => {
    // Add previous navigation logic
  };

  const handleNext = () => {
    // Add next navigation logic
  };

return (
    <Card className="bg-white rounded-lg shadow-md mb-6 overflow-hidden relative">
      <Badge 
        variant="secondary" 
        className="bg-gray-700 text-white text-xs font-medium py-1 px-2 rounded-bl-md absolute top-0 right-0 z-20 pointer-events-none"
      >
        Featured Match
      </Badge>

      {/* Previous button */}
      <button
        onClick={handlePrevious}
        className="absolute left-0 top-[45%] h-[14%] -translate-y-1/2 bg-gray-100 hover:bg-gray-200 text-black px-1 rounded-r-full z-30 flex items-center border border-gray-200 transition-all duration-200 ease-in-out hover:shadow-md hover:scale-105"
      >
        <ChevronLeft className="h-3 w-3" />
      </button>

      {/* Next button */}
      <button
        onClick={handleNext}
        className="absolute right-0 top-[45%] h-[14%] -translate-y-1/2 bg-gray-100 hover:bg-gray-200 text-black px-1 rounded-l-full z-30 flex items-center border border-gray-200 transition-all duration-200 ease-in-out hover:shadow-md hover:scale-105"
      >
        <ChevronRight className="h-3 w-3" />
      </button>
    
    {/* Rest of the card content */}
    </Card>
  );
};

export default FeaturedMatch;