import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import LeagueTabs from './LeagueTabs';
import { Search, Star, Settings, Newspaper } from 'lucide-react';
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
    
    // Close search dialog
    setSearchOpen(false);
    
    // Navigate to search results
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    
    // Reset search query
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
    <header className="bg-black/80 backdrop-blur-sm text-white shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/" className="text-2xl font-bold flex items-center">
            <img 
              src="/logo.png" 
              alt="CS SPORT Logo" 
              className="h-5 mr-2" 
            />
            <span className="flex items-center gap-2">
              <span className="text-amber-400 font-bold text-xl">CSSPORT</span>
              <span className="text-amber-300">|</span>
              <span className="text-amber-300 font-medium">潮勝體育</span>
            </span>
          </Link>
        </div>
        
        <div className="flex items-center space-x-4">
          <LeagueTabs />
          
          
          <Button 
            variant="ghost" 
            className="text-sm flex items-center space-x-1 text-white"
            onClick={() => isAuthenticated ? navigate('/my-scores') : navigate('/login')}
          >
            <Star className="h-4 w-4 mr-1" />
            <span>My Scores</span>
          </Button>
          
          <Button 
            variant="ghost" 
            className="text-white" 
            size="icon"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
          </Button>
          
          <Button 
            variant="ghost" 
            className="text-white" 
            size="icon"
            onClick={() => navigate('/settings')}
          >
            <Settings className="h-5 w-5" />
          </Button>
          
          {isAuthenticated && (
            <div className="flex items-center ml-2">
              <div className="text-sm mr-2">{username}</div>
              <Button 
                variant="ghost" 
                className="text-sm text-gray-300 hover:text-white"
                onClick={handleLogout}
              >
                Logout
              </Button>
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
