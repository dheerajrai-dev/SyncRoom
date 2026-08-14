import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ShieldX, ArrowLeft, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

export default function RequestDeniedPage() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const roomCode = (params.roomCode || '').toUpperCase();
  const reason = searchParams.get('reason') || 'denied';
  const navigate = useNavigate();

  const isExpired = reason === 'expired';

  return (
    <div className="center-page">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md"
      >
        <Card className="form-card text-center items-center">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-2">
            <ShieldX className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white tracking-tight">
              {isExpired ? 'Request Expired' : 'Join Request Denied'}
            </h2>
            <p className="text-xs text-slate-400">
              {isExpired
                ? 'Your request to join timed out before the host responded.'
                : 'The room host declined your request to enter this session.'}
            </p>
          </div>

          <div className="flex items-center gap-3 pt-4 w-full">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => navigate('/')}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Home
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={() => navigate(`/join?code=${roomCode}`)}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Try Again
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
