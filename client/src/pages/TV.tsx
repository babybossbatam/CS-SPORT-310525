
import React from 'react';
import ComingSoon from '@/components/common/ComingSoon';
import { TvIcon } from '@/components/icons/SportIcons';

const TV: React.FC = () => {
  return (
    <ComingSoon
      title="TV Sports Coming Soon"
      description="We're working hard to bring you live sports TV streaming, channel guides, and broadcast schedules. This exciting feature will be available very soon!"
      icon={TvIcon}
      feature="TV Sports"
    />
  );
};

export default TV;
