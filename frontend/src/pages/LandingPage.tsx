import { useNavigate, Link } from 'react-router-dom';
import { Plus, ArrowRight, Send, Lock, CheckCheck } from 'lucide-react';
import { motion } from 'motion/react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 py-10 sm:py-16 md:py-20">
      <div className="w-full max-w-3xl flex flex-col items-center gap-12 sm:gap-16">
        
        {/* 1. Hero Section */}
        <section className="flex flex-col items-center text-center max-w-2xl w-full gap-5">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="text-xs font-semibold tracking-wider text-[#D9720F] uppercase"
          >
            Real-Time Collaboration
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, delay: 0.05 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#1A1815] tracking-tight leading-[1.12]"
          >
            Instant collaborative rooms <br className="hidden sm:inline" />
            that <span className="text-[#D9720F]">forget by default</span>.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, delay: 0.1 }}
            className="text-base sm:text-lg text-[#5C574C] max-w-lg leading-relaxed"
          >
            Temporary rooms for fast team syncs, code reviews, and discussions. In-memory messaging that disappears on session close.
          </motion.p>

          {/* Action Row */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, delay: 0.15 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 pt-3 w-full"
          >
            <button
              onClick={() => navigate('/create')}
              className="btn btn-primary px-6 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-subtle"
            >
              <Plus className="w-4 h-4 text-[#D9720F]" />
              Create Room
            </button>
            
            <Link
              to="/join"
              className="btn-text text-sm font-medium hover:underline flex items-center gap-1.5 transition-colors"
            >
              <span>Have a code? Join a room</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </section>

        {/* 2. Product Preview Card with WhatsApp-Style Chat Bubbles */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.2 }}
          className="w-full"
        >
          <div className="surface-card overflow-hidden w-full shadow-md">
            {/* Mock Room Window Header */}
            <div className="px-4 py-3 border-b border-[#E7E1D3] bg-[#F6F2E9] flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D6CFC0]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D6CFC0]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D6CFC0]" />
                </div>
                <div className="h-3.5 w-px bg-[#E7E1D3]" />
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#1A1815]">Quick Sync</span>
                  <span className="text-[#D9720F] font-mono text-[11px] font-medium">#ABC123</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-[#1F8A4C] text-[11px] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1F8A4C]" />
                  <span>Connected</span>
                </div>
                <span className="text-[#8A8375] text-[11px]">3 active</span>
                <Lock className="w-3.5 h-3.5 text-[#8A8375]" />
              </div>
            </div>

            {/* Chat Area with WhatsApp-Style Bubbles */}
            <div className="p-4 sm:p-6 flex flex-col gap-3 bg-[#F6F2E9] min-h-[240px] justify-end">
              {/* Receiver Bubble 1 (Left) */}
              <div className="flex w-full justify-start">
                <div className="bg-[#FFFDF8] border border-[#E7E1D3] text-[#1A1815] rounded-2xl rounded-tl-xs px-4 py-2.5 max-w-[85%] sm:max-w-[75%] shadow-subtle flex flex-col gap-0.5">
                  <span className="font-bold text-xs text-[#D9720F]">Alex</span>
                  <p className="text-sm text-[#1A1815] leading-relaxed">
                    Let's review the API changes before deploying to staging.
                  </p>
                  <span className="text-[10px] text-[#8A8375] font-mono text-right mt-0.5">10:41 AM</span>
                </div>
              </div>

              {/* Receiver Bubble 2 (Left) */}
              <div className="flex w-full justify-start">
                <div className="bg-[#FFFDF8] border border-[#E7E1D3] text-[#1A1815] rounded-2xl rounded-tl-xs px-4 py-2.5 max-w-[85%] sm:max-w-[75%] shadow-subtle flex flex-col gap-0.5">
                  <span className="font-bold text-xs text-[#D9720F]">Sam</span>
                  <p className="text-sm text-[#1A1815] leading-relaxed">
                    Checked auth tokens and WebSocket lifecycle. All 23 tests pass cleanly.
                  </p>
                  <span className="text-[10px] text-[#8A8375] font-mono text-right mt-0.5">10:42 AM</span>
                </div>
              </div>

              {/* Sender Bubble 3 (Right - Own message) */}
              <div className="flex w-full justify-end">
                <div className="bg-[#FBE9D6] border border-[#D9720F]/30 text-[#1A1815] rounded-2xl rounded-tr-xs px-4 py-2.5 max-w-[85%] sm:max-w-[75%] shadow-subtle flex flex-col gap-0.5">
                  <p className="text-sm text-[#1A1815] leading-relaxed">
                    I'll merge PR #42 and trigger the release pipeline.
                  </p>
                  <div className="flex items-center gap-1 justify-end text-[10px] text-[#8A8375] font-mono mt-0.5">
                    <span>10:43 AM</span>
                    <CheckCheck className="w-3.5 h-3.5 text-[#D9720F]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Mock Composer */}
            <div className="p-3 border-t border-[#E7E1D3] bg-[#FFFDF8] flex items-center gap-3">
              <div className="flex-1 bg-[#F6F2E9] border border-[#D6CFC0] rounded-[10px] px-3 py-2 text-xs sm:text-sm text-[#8A8375]">
                Type a message...
              </div>
              <button className="btn btn-filled-primary p-2 h-9 w-9 shrink-0 flex items-center justify-center">
                <Send className="w-4 h-4 text-[#FFFDF8]" />
              </button>
            </div>
          </div>
        </motion.section>

        {/* 3. Minimal Clean Footer */}
        <footer className="w-full pt-6 border-t border-[#E7E1D3] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8A8375]">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#38352F]">SyncRoom</span>
            <span>·</span>
            <span>Ephemeral collaboration workspace</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/create" className="hover:text-[#1A1815] transition-colors">Create Room</Link>
            <Link to="/join" className="hover:text-[#1A1815] transition-colors">Join Room</Link>
          </div>
        </footer>

      </div>
    </div>
  );
}
