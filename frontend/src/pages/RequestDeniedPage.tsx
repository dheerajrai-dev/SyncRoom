import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
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
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-md"
      >
        <Card className="form-card text-center items-center">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-[#1A1815] tracking-tight">
              {isExpired ? 'Request Expired' : 'Join Request Denied'}
            </h2>
            <p className="text-sm text-[#5C574C]">
              {isExpired
                ? 'Your request to join timed out before the host responded.'
                : 'The host declined your request to enter this session.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 w-full">
            <Button
              variant="primary"
              className="w-full sm:flex-1"
              onClick={() => navigate(`/join?code=${roomCode}`)}
            >
              Try Again
            </Button>
            <Button
              variant="secondary"
              className="w-full sm:flex-1"
              onClick={() => navigate('/')}
            >
              Home
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
