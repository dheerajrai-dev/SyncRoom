import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Clock } from 'lucide-react';

export interface GraceBannerProps {
  isVisible: boolean;
  graceExpiresAt: string | null;
}

export function GraceBanner({ isVisible, graceExpiresAt }: GraceBannerProps) {
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!isVisible || !graceExpiresAt) {
      setSecondsRemaining(null);
      return;
    }

    const updateTimer = () => {
      const expiry = new Date(graceExpiresAt).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.floor((expiry - now) / 1000));
      setSecondsRemaining(diff);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isVisible, graceExpiresAt]);

  const formatCountdown = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-amber-500/15 border-b border-amber-500/30 text-amber-200 px-4 py-2.5 flex items-center justify-between text-xs sm:text-sm font-medium z-30"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Host disconnected. Room will close automatically if the host does not return.</span>
          </div>
          {secondsRemaining !== null && (
            <div className="flex items-center gap-1.5 font-mono font-semibold text-amber-300 bg-amber-500/20 px-2.5 py-1 rounded-md border border-amber-500/30 shrink-0 ml-2">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatCountdown(secondsRemaining)}</span>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
