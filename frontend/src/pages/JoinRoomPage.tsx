import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { joinRoomSchema, type JoinRoomFormData } from '../features/room/schemas';
import { roomApi } from '../features/room/api';
import { useRoomStore } from '../features/room/roomStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function JoinRoomPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCode = searchParams.get('code') || '';
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
      nickname: '',
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
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-md"
      >
        <Card className="form-card flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-[#8A8375] hover:text-[#1A1815] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </Link>
          </div>

          <div className="flex flex-col gap-1.5">
            <h2 className="text-2xl font-bold text-[#1A1815] tracking-tight">Join a Room</h2>
            <p className="text-sm text-[#5C574C]">
              Enter the room code and choose your display nickname.
            </p>
          </div>

          {serverError && (
            <div className="p-3 rounded-[10px] bg-[#FBEAE6] border border-[#C23B2E]/20 flex items-center gap-2 text-xs text-[#C23B2E]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Room Code"
              placeholder="e.g. ABC123"
              autoFocus
              className="font-mono uppercase tracking-widest text-center font-bold text-base"
              error={errors.roomCode?.message}
              {...register('roomCode', {
                onChange: (e) => {
                  setValue('roomCode', e.target.value.toUpperCase());
                },
              })}
            />

            <Input
              label="Nickname"
              placeholder="e.g. Bob"
              error={errors.nickname?.message}
              {...register('nickname')}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full py-2.5 mt-2"
              isLoading={isSubmitting}
            >
              Join Room
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
