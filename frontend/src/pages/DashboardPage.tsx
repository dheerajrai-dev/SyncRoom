import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks';
import {
  useDashboardRooms,
  useDeleteArchivedRoom,
  useExportArchivedRoom,
} from '../features/dashboard/hooks';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Spinner } from '../components/ui/Spinner';
import { formatDate } from '../lib/utils';
import {
  PlusCircle,
  Users,
  Search,
  Trash2,
  FileText,
  FileCode,
  Archive,
  ArrowUpRight,
  MessageSquare,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [roomToDelete, setRoomToDelete] = useState<{ id: string; name: string } | null>(null);

  const { data, isLoading, error } = useDashboardRooms(searchQuery);
  const deleteMutation = useDeleteArchivedRoom();
  const exportMutation = useExportArchivedRoom();

  const rooms = data?.rooms || [];

  const handleDeleteConfirm = async () => {
    if (!roomToDelete) return;
    try {
      await deleteMutation.mutateAsync(roomToDelete.id);
      setRoomToDelete(null);
    } catch (err) {
      console.error('Failed to delete archived room:', err);
    }
  };

  const handleExport = (roomId: string, format: 'json' | 'txt') => {
    exportMutation.mutate({ roomId, format });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Welcome back, <span className="text-blue-400 font-semibold">{user?.display_name || user?.username}</span>.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/create')}
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            Create Room
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/join')}
            leftIcon={<Users className="w-4 h-4" />}
          >
            Join Room
          </Button>
        </div>
      </div>

      {/* Quick Action Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card
          interactive
          onClick={() => navigate('/create')}
          className="cursor-pointer p-5 flex items-center justify-between group border-blue-500/20 hover:border-blue-500/40"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                Start New Session
              </h3>
              <p className="text-xs text-slate-400">Launch an ephemeral workspace as host</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
        </Card>

        <Card
          interactive
          onClick={() => navigate('/join')}
          className="cursor-pointer p-5 flex items-center justify-between group border-white/10 hover:border-white/20"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white group-hover:text-slate-200 transition-colors">
                Enter Room Code
              </h3>
              <p className="text-xs text-slate-400">Join a collaborator's active room</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
        </Card>
      </div>

      {/* Saved & Archived Sessions Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Archive className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">Saved Sessions</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
              {data?.total || 0}
            </span>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search saved rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-9 py-1.5 text-xs"
            />
          </div>
        </div>

        {/* List of Archived Rooms */}
        {isLoading ? (
          <div className="glass-panel p-12 flex flex-col items-center justify-center text-center">
            <Spinner size="lg" />
            <p className="text-xs text-slate-400 mt-3">Loading saved sessions...</p>
          </div>
        ) : error ? (
          <div className="glass-panel p-6 border-red-500/20 bg-red-500/5 text-center text-xs text-red-300">
            Failed to load saved sessions.
          </div>
        ) : rooms.length === 0 ? (
          <div className="glass-panel p-12 text-center flex flex-col items-center justify-center text-slate-400 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 mb-2">
              <Archive className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-300">No saved sessions found</p>
            <p className="text-xs text-slate-500 max-w-sm">
              When you host a room while signed in, you can choose to "Save & Archive" the session when ending it.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <AnimatePresence>
              {rooms.map((room) => (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass-panel p-4 flex flex-col justify-between gap-3 border border-white/5 hover:border-white/15 transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        to={`/dashboard/rooms/${room.id}`}
                        className="text-base font-semibold text-white hover:text-blue-400 transition-colors flex items-center gap-1.5 group-hover:underline"
                      >
                        {room.room_name}
                      </Link>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                        <span className="font-mono text-blue-400/80">{room.room_code}</span>
                        <span>•</span>
                        <span>{formatDate(room.archived_at)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/5 text-xs text-slate-300 shrink-0">
                      <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                      <span>{room.message_count} msgs</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                    <Link
                      to={`/dashboard/rooms/${room.id}`}
                      className="text-slate-300 hover:text-white font-medium flex items-center gap-1"
                    >
                      View Chat
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleExport(room.id, 'json')}
                        className="p-1.5 text-slate-400 hover:text-blue-400 rounded-md hover:bg-white/5 transition-colors"
                        title="Download JSON Export"
                      >
                        <FileCode className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleExport(room.id, 'txt')}
                        className="p-1.5 text-slate-400 hover:text-emerald-400 rounded-md hover:bg-white/5 transition-colors"
                        title="Download TXT Export"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setRoomToDelete({ id: room.id, name: room.room_name })}
                        className="p-1.5 text-slate-400 hover:text-red-400 rounded-md hover:bg-white/5 transition-colors"
                        title="Delete Archived Session"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!roomToDelete}
        onClose={() => setRoomToDelete(null)}
        title="Delete Saved Session"
        description={`Are you sure you want to permanently delete "${roomToDelete?.name}"?`}
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-slate-400">
            This action cannot be undone. All messages in this archived room will be permanently removed.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRoomToDelete(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={deleteMutation.isPending}
              onClick={handleDeleteConfirm}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Delete Session
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
