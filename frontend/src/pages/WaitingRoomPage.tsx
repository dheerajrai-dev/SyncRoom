import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { roomApi } from '../features/room/api';
import { useRoomStore } from '../features/room/roomStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Clock, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

export default function WaitingRoomPage() {
  const params = useParams();
  const roomCode = (params.roomCode || '').toUpperCase();
  const navigate = useNavigate();

  const participantId = useRoomStore((state) => state.participantId);
  const nickname = useRoomStore((state) => state.nickname);
  const setCredentials = useRoomStore((state) => state.setCredentials);

  useEffect(() => {
    if (!roomCode || !participantId) {
      navigate(`/join?code=${roomCode}`);
      return;
    }

    let intervalId: number;

    const checkStatus = async () => {
      try {
        const res = await roomApi.checkJoinStatus(roomCode, participantId);
        if (res.status === 'approved' && res.ws_token) {
          setCredentials({
            roomCode,
            role: 'participant',
            wsToken: res.ws_token,
            participantId,
            nickname,
          });
          navigate(`/room/${roomCode}`);
        } else if (res.status === 'denied') {
          navigate(`/room/${roomCode}/denied?reason=denied`);
        } else if (res.status === 'expired') {
          navigate(`/room/${roomCode}/denied?reason=expired`);
        }
      } catch (err) {
        console.warn('Status check error:', err);
      }
    };

    checkStatus();
    intervalId = window.setInterval(checkStatus, 1500);

    return () => clearInterval(intervalId);
  }, [roomCode, participantId, nickname, navigate, setCredentials]);

  return (
    <div className="center-page">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md"
      >
        <Card className="form-card text-center items-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-2">
            <Clock className="w-7 h-7 animate-pulse" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white tracking-tight">Knocking on Room</h2>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <span>Room:</span>
              <span className="font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                {roomCode}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/5 w-full space-y-2 text-left">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Your Nickname:</span>
              <span className="font-semibold text-slate-200">{nickname}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Status:</span>
              <span className="text-amber-400 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
                Pending Host Review
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed px-4">
            Waiting for the host to approve your request...
          </p>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Cancel Request
          </Button>
        </Card>
      </motion.div>
    </div>
  );
}
