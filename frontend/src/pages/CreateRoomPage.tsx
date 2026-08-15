import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { createRoomSchema, type CreateRoomFormData } from '../features/room/schemas';
import { roomApi } from '../features/room/api';
import { useRoomStore } from '../features/room/roomStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function CreateRoomPage() {
  const navigate = useNavigate();
  const setCredentials = useRoomStore((state) => state.setCredentials);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateRoomFormData>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      roomName: '',
    },
  });

  const onSubmit = async (data: CreateRoomFormData) => {
    try {
      setServerError(null);
      const name = data.roomName?.trim() || 'Quick Sync';
      const res = await roomApi.createRoom(name);

      // Store credentials into Zustand roomStore & sessionStorage
      setCredentials({
        roomCode: res.code,
        role: 'host',
        hostToken: res.host_token,
        wsToken: res.host_token,
        nickname: 'Host',
        roomName: name,
      });

      navigate(`/room/${res.code}`);
    } catch (err: any) {
      setServerError(err.message || 'Failed to create room. Please try again.');
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
            <h2 className="text-2xl font-bold text-[#1A1815] tracking-tight">Create a Room</h2>
            <p className="text-sm text-[#5C574C]">
              Start an ephemeral workspace and share the code with collaborators.
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
              label="Room Name (Optional)"
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
            >
              Create Room
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
