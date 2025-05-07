import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, uiActions, userActions } from '@/lib/store';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

const RegionModal = () => {
  const dispatch = useDispatch();
  
  const showModal = useSelector((state: RootState) => state.ui.showRegionModal);
  const user = useSelector((state: RootState) => state.user);
  
  // Show region modal on first visit
  useEffect(() => {
    // Check if the modal has been shown before
    const hasShownRegionModal = localStorage.getItem('hasShownRegionModal');
    
    if (!hasShownRegionModal) {
      dispatch(uiActions.setShowRegionModal(true));
      localStorage.setItem('hasShownRegionModal', 'true');
    }
  }, [dispatch]);
  
  // Close the modal
  const handleClose = () => {
    dispatch(uiActions.setShowRegionModal(false));
  };
  
  // Set region to US
  const handleSetUS = () => {
    dispatch(userActions.setRegion('us'));
    
    // Update on server if user is authenticated
    if (user.isAuthenticated && user.id) {
      apiRequest('PATCH', `/api/user/${user.id}/preferences`, {
        region: 'us'
      }).catch(err => {
        console.error('Failed to update region preference:', err);
      });
    }
    
    handleClose();
  };
  
  // Keep global region
  const handleKeepGlobal = () => {
    dispatch(userActions.setRegion('global'));
    
    // Update on server if user is authenticated
    if (user.isAuthenticated && user.id) {
      apiRequest('PATCH', `/api/user/${user.id}/preferences`, {
        region: 'global'
      }).catch(err => {
        console.error('Failed to update region preference:', err);
      });
    }
    
    handleClose();
  };
  
  return (
    <Dialog open={showModal} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Region Selection</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6" 
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            Wanna see the US version of our site?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-center space-x-4 sm:justify-center">
          <Button 
            onClick={handleSetUS}
            className="px-4 py-2 bg-[#3182CE] text-white hover:bg-[#2C5282]"
          >
            Yes
          </Button>
          <Button 
            variant="outline"
            onClick={handleKeepGlobal}
            className="px-4 py-2 bg-gray-200 text-gray-800 hover:bg-gray-300"
          >
            No
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RegionModal;
