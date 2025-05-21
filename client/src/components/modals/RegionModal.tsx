import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, uiActions, userActions } from '@/lib/store';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';

const RegionModal = () => {
  const dispatch = useDispatch();

  const showModal = useSelector((state: RootState) => state.ui.showRegionModal);
  const user = useSelector((state: RootState) => state.user);

  useEffect(() => {
    const hasShownRegionModal = localStorage.getItem('hasShownRegionModal');

    if (!hasShownRegionModal) {
      dispatch(uiActions.setShowRegionModal(true));
      localStorage.setItem('hasShownRegionModal', 'true');
    }
  }, [dispatch]);

  const handleClose = () => {
    dispatch(uiActions.setShowRegionModal(false));
  };

  const handleSetUS = () => {
    dispatch(userActions.setRegion('us'));

    if (user.isAuthenticated && user.id) {
      apiRequest('PATCH', `/api/user/${user.id}/preferences`, {
        region: 'us'
      }).catch(err => {
        console.error('Failed to update region preference:', err);
      });
    }

    handleClose();
  };

  const handleKeepGlobal = () => {
    dispatch(userActions.setRegion('global'));

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
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-lg font-semibold mb-4">Region Selection</h2>
          <p className="text-muted-foreground mb-6">Wanna see the US version of our site?</p>
          <div className="flex justify-center space-x-4">
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
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default RegionModal;