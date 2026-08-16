import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { roomApi } from '../features/room/api';
import { useRoomStore } from '../features/room/roomStore';
import { Card } from '../components/ui/Card';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';

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
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-md"
      >
        <Card className="form-card text-center flex flex-col items-center gap-6">
          <div className="w-12 h-12 rounded-full bg-[#FBE9D6] border border-[#D9720F]/20 flex items-center justify-center text-[#D9720F]">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="inline-flex items-center justify-center gap-2 mb-1">
              <span className="text-xs font-mono text-[#D9720F] px-2 py-0.5 rounded bg-[#FBE9D6] font-bold">
                #{roomCode}
              </span>
              {nickname && (
                <span className="text-xs text-[#5C574C]">
                  as <strong className="text-[#1A1815]">{nickname}</strong>
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1A1815] tracking-tight">
              Waiting for host approval…
            </h2>
            <p className="text-xs sm:text-sm text-[#5C574C]">
              The host has been notified. You’ll enter automatically once approved.
            </p>
          </div>

          <div className="pt-2 border-t border-[#E7E1D3] w-full flex justify-center">
            <Link
              to="/"
              className="text-xs font-medium text-[#8A8375] hover:text-[#1A1815] transition-colors"
            >
              Cancel Request
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
