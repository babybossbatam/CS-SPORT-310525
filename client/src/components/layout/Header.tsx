import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import LeagueTabs from './LeagueTabs';
import { Search, Star, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, userActions } from '@/lib/store';

const Header = () => {
  const [location, navigate] = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const dispatch = useDispatch();

  const isAuthenticated = useSelector((state: RootState) => state.user.isAuthenticated);
  const username = useSelector((state: RootState) => state.user.username);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      return;
    }
    setSearchOpen(false);
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    setSearchQuery('');
  };

  const handleLogout = () => {
    dispatch(userActions.logout());
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of your account."
    });
    navigate('/');
  };

  return (
    <header className="bg-black text-white shadow-md fixed top-0 left-0 right-0 z-50 h-[77px]">
      <div className="container mx-auto px-20 py-3 flex items-center justify-between">
        <Link href="/" className="flex-shrink-0 flex items-center h-full bg-black">
          <img 
            src="/CSSPORT_1_updated.png" 
            alt="CS SPORT Logo" 
            className="h-full max-h-[57px] w-auto mr-2 transition-all duration-200 hover:drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
            onError={(e) => {
              console.log('Logo failed to load, trying fallback');
              const target = e.target as HTMLImageElement;
              if (target.src !== '/CSSPORT_1_updated.png') {
                target.src = '/CSSPORT_1_updated.png';
              }
            }}
          />
          <span className="flex items-center gap-2 whitespace-nowrap">
            <span className="bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-400 bg-clip-text text-transparent font-bold text-[clamp(1.707rem,2vw,2.032rem)] transition-all duration-200 hover:from-white hover:via-yellow-100 hover:to-amber-200 hover:drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" style={{fontFamily: 'Roboto, sans-serif'}}>CSSPORT</span>
          </span>
        </Link>

        <LeagueTabs />
        <LeagueTabs />
        <div className="flex items-center gap-[1.05rem]">
          <div 
            className="text-sm flex items-center space-x-1 text-white hover:text-amber-400 transition-colors duration-200 cursor-pointer"
            onClick={() => isAuthenticated ? navigate('/my-scores') : navigate('/login')}
          >
            <Star className="h-4 w-4 mr-1 fill-current" />
            <span>My Scores</span>
          </div>

          <div 
            className="text-sm flex items-center space-x-1 text-white hover:text-amber-400 transition-colors duration-200 cursor-pointer"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-4 w-4" />
          </div>

          <div 
            className="text-sm flex items-center space-x-1 text-white hover:text-amber-400 transition-colors duration-200 cursor-pointer"
            onClick={() => navigate('/settings')}
          >
            <Settings className="h-4 w-4" />
          </div>

          {isAuthenticated && (
            <div className="flex items-center ml-2 mx-16">
              <div className="text-sm mr-2">{username}</div>
              <div 
                className="text-sm flex items-center space-x-1 text-white hover:text-amber-400 transition-colors duration-200 cursor-pointer"
                onClick={handleLogout}
              >
                <span>Logout</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Search</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSearch} className="space-y-4">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for teams, leagues, players..."
              className="w-full"
              autoFocus
            />
            <div className="flex justify-end">
              <Button type="submit">Search</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </header>
  );
};

export default Header;