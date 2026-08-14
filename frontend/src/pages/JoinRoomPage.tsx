import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { joinRoomSchema, type JoinRoomFormData } from '../features/room/schemas';
import { roomApi } from '../features/room/api';
import { useRoomStore } from '../features/room/roomStore';
import { useAuth } from '../features/auth/hooks';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { LogIn, ArrowLeft, AlertCircle, Hash, User } from 'lucide-react';
import { motion } from 'motion/react';

export default function JoinRoomPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCode = searchParams.get('code') || '';
  const { user } = useAuth();
  const setCredentials = useRoomStore((state) => state.setCredentials);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<JoinRoomFormData>({
    resolver: zodResolver(joinRoomSchema),
    defaultValues: {
      roomCode: initialCode.toUpperCase(),
      nickname: user?.display_name || user?.username || '',
    },
  });

  const onSubmit = async (data: JoinRoomFormData) => {
    try {
      setServerError(null);
      const res = await roomApi.joinRoom(data.roomCode, data.nickname);

      // Save participant credentials
      setCredentials({
        roomCode: data.roomCode,
        role: 'participant',
        participantId: res.participant_id,
        nickname: data.nickname,
      });

      navigate(`/room/${data.roomCode}/waiting`);
    } catch (err: any) {
      if (err.status === 404 || err.message?.includes('not found')) {
        setServerError('Room not found. Please check the code and try again.');
      } else if (err.status === 403 || err.message?.includes('locked') || err.message?.includes('full')) {
        setServerError('Cannot join: Room is locked or full.');
      } else {
        setServerError(err.message || 'Failed to submit join request.');
      }
    }
  };

  return (
    <div className="center-page">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md"
      >
        <Card className="form-card">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </Link>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-white tracking-tight">Join a Room</h2>
            <p className="text-xs text-slate-400">
              Enter the 6-character room code and choose your display nickname.
            </p>
          </div>

          {serverError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Room Code"
              placeholder="e.g. ABC123"
              autoFocus
              className="font-mono uppercase tracking-widest text-center text-lg font-bold"
              leftIcon={<Hash className="w-4 h-4" />}
              error={errors.roomCode?.message}
              {...register('roomCode', {
                onChange: (e) => {
                  setValue('roomCode', e.target.value.toUpperCase());
                },
              })}
            />

            <Input
              label="Your Nickname"
              placeholder="e.g. Bob"
              leftIcon={<User className="w-4 h-4" />}
              error={errors.nickname?.message}
              {...register('nickname')}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full py-2.5 mt-2"
              isLoading={isSubmitting}
              leftIcon={<LogIn className="w-4 h-4" />}
            >
              Request to Join
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
