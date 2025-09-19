
import React from "react";
import MyMatchdetailsScoreboard from "@/components/matches/MyMatchdetailsScoreboard";

interface MyMainLayoutRightProps {
  selectedFixture: any;
  onClose: () => void;
}

const MyMainLayoutRight: React.FC<MyMainLayoutRightProps> = ({ 
  selectedFixture, 
  onClose 
}) => {
  // Don't render anything if no fixture is selected
  // The component is always mounted but will be hidden by CSS
  if (!selectedFixture) {
    return <div className="h-full w-full" />;
  }

  return (
    <div className="h-full w-full overflow-hidden">
      <MyMatchdetailsScoreboard 
        fixture={selectedFixture} 
        onClose={onClose}
      />
    </div>
  );
};

export default MyMainLayoutRight;
