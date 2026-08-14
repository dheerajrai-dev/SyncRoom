import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks';
import { Card } from '../components/ui/Card';
import { PlusCircle, Users, Shield, Zap, Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
      {/* Hero Badge */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-medium text-blue-300 mb-6"
      >
        <Sparkles className="w-3.5 h-3.5 text-blue-400" />
        <span>Real-Time Ephemeral Collaboration</span>
      </motion.div>

      {/* Main Title & Pitch */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="text-center max-w-2xl mb-10"
      >
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
          Instant collaborative rooms that <span className="text-blue-400">forget by default</span>.
        </h1>
        <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
          Create secure, temporary chat rooms for fast team syncs, code reviews, and discussions. No clutter, zero message retention unless you choose to archive.
        </p>

        {isAuthenticated && user && (
          <div className="mt-4 p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 inline-block text-xs font-medium text-blue-200">
            Welcome back, <span className="font-bold text-white">{user.display_name || user.username}</span>!
          </div>
        )}
      </motion.div>

      {/* Action Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl mb-12"
      >
        <Card
          interactive
          onClick={() => navigate('/create')}
          className="cursor-pointer flex flex-col justify-between group p-6 border-blue-500/20 hover:border-blue-500/40"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
              <PlusCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
              Create a Room
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Start a new private workspace, invite participants with a 6-character code, and manage access as host.
            </p>
          </div>
          <div className="flex items-center text-xs font-semibold text-blue-400 gap-1 mt-6 group-hover:translate-x-1 transition-transform">
            <span>Get Started</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Card>

        <Card
          interactive
          onClick={() => navigate('/join')}
          className="cursor-pointer flex flex-col justify-between group p-6 border-white/10 hover:border-white/20"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-slate-200 transition-colors">
              Join a Room
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enter an existing session code with your preferred nickname. Fast, anonymous, and frictionless.
            </p>
          </div>
          <div className="flex items-center text-xs font-semibold text-slate-300 gap-1 mt-6 group-hover:translate-x-1 transition-transform">
            <span>Enter Room</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Card>
      </motion.div>

      {/* Feature Highlights */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl text-center"
      >
        <div className="p-4 rounded-xl glass-panel bg-slate-900/40 flex flex-col items-center">
          <Zap className="w-5 h-5 text-blue-400 mb-2" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1">Sub-Millisecond Sync</h4>
          <p className="text-xs text-slate-400">Native WebSocket protocol ensures real-time typing and updates.</p>
        </div>
        <div className="p-4 rounded-xl glass-panel bg-slate-900/40 flex flex-col items-center">
          <Shield className="w-5 h-5 text-emerald-400 mb-2" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1">Host Moderation</h4>
          <p className="text-xs text-slate-400">Host controls approvals, lock state, member kicks, and session saves.</p>
        </div>
        <div className="p-4 rounded-xl glass-panel bg-slate-900/40 flex flex-col items-center">
          <Sparkles className="w-5 h-5 text-amber-400 mb-2" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1">Zero Persistence</h4>
          <p className="text-xs text-slate-400">Messages live in memory and are discarded when the room ends.</p>
        </div>
      </motion.div>
    </div>
  );
}
