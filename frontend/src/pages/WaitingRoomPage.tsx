import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { roomApi } from '../features/room/api';
import { useRoomStore } from '../features/room/roomStore';
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
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="flex flex-col items-center text-center space-y-4 max-w-sm px-4"
      >
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#D9720F] animate-pulse" />
          <p className="text-base text-[#5C574C]">Waiting for host to approve…</p>
        </div>

        <Link
          to="/"
          className="text-sm text-[#8A8375] hover:text-[#1A1815] transition-colors"
        >
          Cancel
        </Link>
      </motion.div>
    </div>
  );
}
