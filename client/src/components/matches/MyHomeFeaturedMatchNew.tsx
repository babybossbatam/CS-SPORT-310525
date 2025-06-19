import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";

interface MyHomeFeaturedMatchNewProps {
  selectedDate?: string;
  maxMatches?: number;
}

const MyFeaturedMatchSlide: React.FC<MyHomeFeaturedMatchNewProps> = ({
  selectedDate,
  maxMatches = 3,
}) => {
  return (
    <Card className="px-0 pt-0 pb-2 relative shadow-md mb-4">
      <Badge
        variant="secondary"
        className="bg-gray-700 text-white text-xs font-medium py-1 px-2 rounded-bl-md absolute top-0 right-0 z-10 pointer-events-none"
      >
        Featured Match
      </Badge>

      <CardContent className="p-6">
        <div className="flex flex-col items-center justify-center py-8 text-gray-500">
          <Trophy className="h-12 w-12 mb-3 opacity-50" />
          <p className="text-lg font-medium mb-1">No data flow configured</p>
          <p className="text-sm">Ready for your custom implementation</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MyFeaturedMatchSlide;