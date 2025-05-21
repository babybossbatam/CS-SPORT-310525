import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, uiActions, userActions } from '@/lib/store';
import { Dialog } from '@/components/ui/dialog';

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

  return (
    <Dialog open={showModal} onOpenChange={handleClose}>
      <div className="fixed inset-0 z-50 flex items-center justify-center" />
    </Dialog>
  );
};

export default RegionModal;