import React from 'react';
import { Dialog, DialogContent, DialogOverlay } from "@/components/ui/dialog";
import { AnimatePresence, motion } from 'framer-motion';
import TeamLogoEvolution from '../matches/TeamLogoEvolution';

interface TeamLogoModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  teamName: string;
  logoUrl: string;
}

export function TeamLogoModal({
  isOpen,
  onClose,
  teamId,
  teamName,
  logoUrl
}: TeamLogoModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogOverlay className="bg-black/60" />
          <DialogContent className="sm:max-w-[600px] p-0 bg-transparent border-none shadow-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <TeamLogoEvolution
                teamId={teamId}
                teamName={teamName}
                currentLogo={logoUrl}
                onClose={onClose}
              />
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}

export default TeamLogoModal;