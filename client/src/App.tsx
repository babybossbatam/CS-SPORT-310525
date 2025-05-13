import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Football from "@/pages/Football";
import Basketball from "@/pages/Basketball";
import Baseball from "@/pages/Baseball";
import Tennis from "@/pages/Tennis";
import Hockey from "@/pages/Hockey";
import MatchDetails from "@/pages/MatchDetails";
import Authentication from "@/pages/Authentication";
import LeagueDetails from "@/pages/LeagueDetails";
import MyScores from "@/pages/MyScores";
import Settings from "@/pages/Settings";
import SearchResults from "@/pages/SearchResults";
import LiveMatches from "@/pages/LiveMatches";
import NewsPage from "@/pages/NewsPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/football" component={Football} />
      <Route path="/basketball" component={Basketball} />
      <Route path="/baseball" component={Baseball} />
      <Route path="/tennis" component={Tennis} />
      <Route path="/hockey" component={Hockey} />
      <Route path="/login" component={() => <Authentication mode="login" />} />
      <Route path="/register" component={() => <Authentication mode="register" />} />
      <Route path="/match/:id" component={MatchDetails} />
      <Route path="/match/:id/:tab" component={MatchDetails} />
      <Route path="/league/:id" component={LeagueDetails} />
      <Route path="/league/:id/:tab" component={LeagueDetails} />
      <Route path="/my-scores" component={MyScores} />
      <Route path="/settings" component={Settings} />
      <Route path="/search" component={SearchResults} />
      <Route path="/live" component={LiveMatches} />
      <Route path="/news" component={NewsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <Router />
    </TooltipProvider>
  );
}

export default App;
