'use client';

import { AuthCard } from '@/components/auth/AuthCard';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className='max-h-[calc(100svh-0.75rem)] w-[calc(100%-1.5rem)] max-w-[30rem] overflow-x-hidden overflow-y-auto rounded-[1.5rem] border-0 bg-transparent p-0 shadow-none sm:max-w-[30rem] [&_[data-slot=dialog-close]]:right-3 [&_[data-slot=dialog-close]]:top-3 [&_[data-slot=dialog-close]]:z-20 [&_[data-slot=dialog-close]]:flex [&_[data-slot=dialog-close]]:h-9 [&_[data-slot=dialog-close]]:w-9 [&_[data-slot=dialog-close]]:items-center [&_[data-slot=dialog-close]]:justify-center [&_[data-slot=dialog-close]]:rounded-lg [&_[data-slot=dialog-close]]:bg-background/90 [&_[data-slot=dialog-close]]:opacity-100 [&_[data-slot=dialog-close]]:shadow-sm'
      >
        <DialogTitle className='sr-only'>OlegGuitar</DialogTitle>
        <AuthCard onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
