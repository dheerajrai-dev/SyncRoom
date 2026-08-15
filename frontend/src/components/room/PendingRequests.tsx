import { useState } from 'react';
import type { PendingRequest } from '../../features/room/types';
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
    <div className="border-b border-[#E7E1D3] bg-[#FBE9D6]/30">
      <div className="px-4 py-2 text-xs font-semibold text-[#D9720F] uppercase tracking-wider">
        Requests ({requests.length})
      </div>

      <div className="divide-y divide-[#E7E1D3]">
        <AnimatePresence>
          {requests.map((req) => {
            const isProcessing = processingId === req.request_id;
            return (
              <motion.div
                key={req.request_id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-4 py-2.5 flex items-center justify-between gap-2"
              >
                <span className="text-sm font-medium text-[#1A1815] truncate">{req.nickname}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    disabled={isProcessing}
                    onClick={() => handleApprove(req.request_id)}
                    className="px-2 py-1 text-xs font-medium text-[#1F8A4C] hover:bg-[#E3F3E8] border border-[#1F8A4C] rounded-[6px] transition-colors cursor-pointer"
                  >
                    Approve
                  </button>
                  <button
                    disabled={isProcessing}
                    onClick={() => handleDeny(req.request_id)}
                    className="px-2 py-1 text-xs font-medium text-[#C23B2E] hover:bg-[#FBEAE6] border border-[#C23B2E] rounded-[6px] transition-colors cursor-pointer"
                  >
                    Deny
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
