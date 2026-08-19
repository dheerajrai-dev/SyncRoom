import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

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
      {isVisible && !!graceExpiresAt && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-[#FBE9D6] border-b border-[#E7E1D3] text-[#1A1815] px-4 py-2 flex items-center justify-between text-xs sm:text-sm font-medium z-30"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D9720F]" />
            <span>
              Host disconnected — reconnecting or room closes in{' '}
              <span className="font-mono font-bold tabular-nums text-[#1A1815]">
                {secondsRemaining !== null ? formatCountdown(secondsRemaining) : '00:45'}
              </span>
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
