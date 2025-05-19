import { Card } from "@/components/ui/card";

const FeatureMatchCard = () => {
  return (
    <Card className="bg-white rounded-lg shadow-md mb-6 overflow-hidden relative">
      <div className="p-4 text-center">
        No matches available
      </div>
    </Card>
  );
};

export default FeatureMatchCard;