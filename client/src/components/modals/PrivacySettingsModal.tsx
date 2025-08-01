
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface PrivacySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PrivacyOption {
  id: string;
  title: string;
  agreed: boolean;
}

const PrivacySettingsModal: React.FC<PrivacySettingsModalProps> = ({ isOpen, onClose }) => {
  const [privacyOptions, setPrivacyOptions] = useState<PrivacyOption[]>([
    { id: 'store_access', title: 'Store and/or access information on a device', agreed: false },
    { id: 'measure_advertising', title: 'Measure advertising performance', agreed: false },
    { id: 'limited_advertising', title: 'Use limited data to select advertising', agreed: false },
    { id: 'create_profiles_advertising', title: 'Create profiles for personalised advertising', agreed: false },
    { id: 'precise_geolocation', title: 'Use precise geolocation data', agreed: false },
    { id: 'develop_improve', title: 'Develop and improve services', agreed: false },
    { id: 'understand_audiences', title: 'Understand audiences through statistics or combinations of data from different sources', agreed: false },
    { id: 'profiles_personalised_advertising', title: 'Use profiles to select personalised advertising', agreed: false },
    { id: 'measure_content', title: 'Measure content performance', agreed: false },
    { id: 'limited_content', title: 'Use limited data to select content', agreed: false },
    { id: 'create_profiles_content', title: 'Create profiles to personalise content', agreed: false },
    { id: 'profiles_personalised_content', title: 'Use profiles to select personalised content', agreed: false },
    { id: 'scan_device', title: 'Actively scan device characteristics for identification', agreed: false },
  ]);

  const handleOptionChange = (id: string, agreed: boolean) => {
    setPrivacyOptions(prev => 
      prev.map(option => 
        option.id === id ? { ...option, agreed } : option
      )
    );
  };

  const handleDisagreeAll = () => {
    setPrivacyOptions(prev => prev.map(option => ({ ...option, agreed: false })));
  };

  const handleAgreeAll = () => {
    setPrivacyOptions(prev => prev.map(option => ({ ...option, agreed: true })));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-lg font-semibold text-gray-900">
            Welcome to CS SPORT Consent Management
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-gray-600 mb-6">
            We and our partners place cookies, access and use non-sensitive information from your 
            device to improve products and personalize ads and other contents including 
            throughout this website. You may accept all or part of these operations. To learn more about cookies, 
            partners, and how we use your data, to review your options in these operations for each 
            partner, visit our <span className="text-blue-600 underline cursor-pointer">privacy policy</span>.
          </p>

          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">YOU ALLOW</h3>
            <div className="flex gap-4 mb-6">
              <Button 
                variant="outline" 
                onClick={handleDisagreeAll}
                className="px-6"
              >
                Disagree
              </Button>
              <Button 
                onClick={handleAgreeAll}
                className="px-6 bg-green-600 hover:bg-green-700 text-white"
              >
                ✓ Agree
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {privacyOptions.map((option) => (
              <div key={option.id} className="border-b border-gray-200 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="text-green-600 mr-2">+</span>
                      <h4 className="font-medium text-gray-900">{option.title}</h4>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant={option.agreed ? "outline" : "default"}
                      size="sm"
                      onClick={() => handleOptionChange(option.id, false)}
                      className={`px-4 ${!option.agreed ? 'bg-gray-600 hover:bg-gray-700 text-white' : ''}`}
                    >
                      Disagree
                    </Button>
                    <Button
                      variant={option.agreed ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleOptionChange(option.id, true)}
                      className={`px-4 ${option.agreed ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                    >
                      ✓ Agree
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrivacySettingsModal;
