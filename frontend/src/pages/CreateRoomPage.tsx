import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { createRoomSchema, type CreateRoomFormData } from '../features/room/schemas';
import { roomApi } from '../features/room/api';
import { useRoomStore } from '../features/room/roomStore';
import { useAuth } from '../features/auth/hooks';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PlusCircle, ArrowLeft, AlertCircle, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export default function CreateRoomPage() {
  const navigate = useNavigate();
  const { accessToken, user } = useAuth();
  const setCredentials = useRoomStore((state) => state.setCredentials);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateRoomFormData>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      roomName: user ? `${user.display_name || user.username}'s Room` : 'Quick Sync',
    },
  });

  const onSubmit = async (data: CreateRoomFormData) => {
    try {
      setServerError(null);
      const res = await roomApi.createRoom(data.roomName, accessToken);

      // Store credentials into Zustand roomStore
      setCredentials({
        roomCode: res.code,
        role: 'host',
        hostToken: res.host_token,
        wsToken: res.host_token, // Host connects with host_token as token
        nickname: user?.display_name || user?.username || 'Host',
        roomName: data.roomName,
      });

      navigate(`/room/${res.code}`);
    } catch (err: any) {
      setServerError(err.message || 'Failed to create room. Please try again.');
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
            <span className="text-[11px] font-medium text-blue-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Host Workspace
            </span>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-white tracking-tight">Create a Room</h2>
            <p className="text-xs text-slate-400">
              Start a new session and share the invite code with collaborators.
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
              label="Room Name"
              placeholder="e.g. Design Critique"
              autoFocus
              error={errors.roomName?.message}
              {...register('roomName')}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full py-2.5 mt-2"
              isLoading={isSubmitting}
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              Create & Launch Room
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
