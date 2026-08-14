import { useState } from 'react';
import type { PendingRequest } from '../../features/room/types';
import { Button } from '../ui/Button';
import { UserCheck, UserX, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface PendingRequestsProps {
  requests: PendingRequest[];
  onApprove: (requestId: string) => Promise<void>;
  onDeny: (requestId: string) => Promise<void>;
}

export function PendingRequests({ requests, onApprove, onDeny }: PendingRequestsProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  if (requests.length === 0) return null;

  const handleApprove = async (id: string) => {
    try {
      setProcessingId(id);
      await onApprove(id);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeny = async (id: string) => {
    try {
      setProcessingId(id);
      await onDeny(id);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="p-4 border-b border-white/10 bg-amber-500/5">
      <div className="flex items-center gap-2 mb-3">
        <UserPlus className="w-4 h-4 text-amber-400" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">
          Pending Approvals ({requests.length})
        </h3>
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {requests.map((req) => {
            const isProcessing = processingId === req.request_id;
            return (
              <motion.div
                key={req.request_id}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-2.5 rounded-xl glass-panel bg-slate-900/80 border-amber-500/20 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white truncate">{req.nickname}</span>
                  <span className="text-[10px] text-amber-400/80 font-medium">Waiting</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    className="flex-1 py-1 text-xs bg-emerald-600 hover:bg-emerald-500 border-emerald-500"
                    isLoading={isProcessing}
                    onClick={() => handleApprove(req.request_id)}
                    leftIcon={<UserCheck className="w-3.5 h-3.5" />}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    className="flex-1 py-1 text-xs"
                    disabled={isProcessing}
                    onClick={() => handleDeny(req.request_id)}
                    leftIcon={<UserX className="w-3.5 h-3.5" />}
                  >
                    Deny
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
