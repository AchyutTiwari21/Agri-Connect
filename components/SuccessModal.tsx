'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, X } from 'lucide-react';
import { Button } from './ui/button';

type SuccessModalProps = {
  open: boolean;
  title: string;
  description: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  onClose?: () => void;
};

export default function SuccessModal({
  open,
  title,
  description,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  onClose,
}: SuccessModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl"
      >
        <button
          aria-label="Close"
          className="absolute right-4 top-4 text-muted-foreground transition hover:text-foreground"
          onClick={onClose ?? onSecondary ?? onPrimary}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center space-y-4">
          <div className="rounded-full bg-green-100 p-4 text-green-600">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <div>
            <h3 className="text-2xl font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          </div>
          <div className="flex w-full flex-col gap-3 pt-4">
            <Button className="w-full bg-green-600 hover:bg-green-700" onClick={onPrimary}>
              {primaryLabel}
            </Button>
            {secondaryLabel && onSecondary && (
              <Button variant="outline" className="w-full" onClick={onSecondary}>
                {secondaryLabel}
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}


