import { useEffect } from 'react';
import { format } from 'date-fns';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const StandingsFilterCard = () => {
  const selectedDate = useSelector((state: RootState) => state.ui.selectedDate);

  useEffect(() => {
    // Load 365Scores widget script
    const script = document.createElement('script');
    script.src = 'https://widgets.365scores.com/main.js';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      // Cleanup script on unmount
      const existingScript = document.querySelector('script[src="https://widgets.365scores.com/main.js"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="border-b">
          <h3 className="text-lg font-semibold">
            {selectedDate === format(new Date(), 'yyyy-MM-dd')
              ? "Today's Matches"
              : `Matches for ${format(new Date(selectedDate), 'MMM d, yyyy')}`
            }
          </h3>
        </CardHeader>
        <CardContent className="p-4">
          {/* 365Scores Widget */}
          <div 
            data-widget-type="entityScores" 
            data-entity-type="league" 
            data-entity-id="572" 
            data-lang="en" 
            data-widget-id="edce6784-c4f7-4755-ab9d-0d94aea861e0"
            className="min-h-[300px]"
          ></div>
          
          {/* Powered by 365Scores */}
          <div className="flex items-center justify-center mt-4 text-xs text-gray-500">
            <span>Powered by </span>
            <a 
              href="https://www.365scores.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="ml-1 text-blue-500 hover:underline"
            >
              365Scores.com
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StandingsFilterCard;