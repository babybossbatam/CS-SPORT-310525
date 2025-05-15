
import { Card, CardHeader } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ChampionsLeagueHeader = () => {
  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="space-y-4">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Score Overview</TabsTrigger>
              <TabsTrigger value="result">Result</TabsTrigger>
              <TabsTrigger value="fixture">Fixture</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex justify-center">
            <span className="text-xs px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
              Quarter Finals • Leg 2/2
            </span>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};

export default ChampionsLeagueHeaderr;
