import MyLiveAction from '@/components/matches/MyLiveAction';
import MyLMTLive from '@/components/matches/MyLMTLive';

// MyNewLMT component needs to be imported here. Assuming it is in the same directory
import MyNewLMT from '@/components/matches/MyNewLMT';

// Assuming this code is within a functional component like MyMainLayout
function MyMainLayout({ selectedMatchId, selectedMatch }) {
  return (
    <div>
      <MyLiveAction 
        matchId={selectedMatchId}
        homeTeam={selectedMatch?.teams?.home}
        awayTeam={selectedMatch?.teams?.away}
        status={selectedMatch?.fixture?.status?.short}
        className="mb-6"
      />

      <MyNewLMT 
        matchId={selectedMatchId}
        homeTeam={selectedMatch?.teams?.home}
        awayTeam={selectedMatch?.teams?.away}
        status={selectedMatch?.fixture?.status?.short}
        className="mb-6"
      />
    </div>
  );
}

export default MyMainLayout;