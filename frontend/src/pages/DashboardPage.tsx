import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks';
import {
  useDashboardRooms,
  useDeleteArchivedRoom,
  useExportArchivedRoom,
} from '../features/dashboard/hooks';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { formatDate } from '../lib/utils';
import {
  Plus,
  Search,
  Trash2,
  FileText,
  FileCode,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
  const [roomToDelete, setRoomToDelete] = useState<{ id: string; name: string } | null>(null);

  const { data, isLoading, error } = useDashboardRooms(searchQuery);
  const deleteMutation = useDeleteArchivedRoom();
  const exportMutation = useExportArchivedRoom();

  const rawRooms = useMemo(() => data?.rooms || [], [data?.rooms]);

  const sortedRooms = useMemo(() => {
    return [...rawRooms].sort((a, b) => {
      if (sortBy === 'name') {
        return a.room_name.localeCompare(b.room_name);
      }
      return new Date(b.archived_at).getTime() - new Date(a.archived_at).getTime();
    });
  }, [rawRooms, sortBy]);

  const totalMessages = useMemo(() => {
    return rawRooms.reduce((acc, r) => acc + (r.message_count || 0), 0);
  }, [rawRooms]);

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
    <div className="w-full flex-1 flex flex-col items-center">
      {/* Main Container */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex flex-col gap-8">
        
        {/* 1. Header / Page Intro */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E7E1D3]">
          <div className="flex flex-col gap-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1815] tracking-tight truncate">
              Welcome back, {user?.display_name || user?.username || 'User'}
            </h1>
            <p className="text-xs sm:text-sm text-[#5C574C]">
              Manage your saved workspaces, archived conversations, and account data.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
            <Button
              variant="primary"
              onClick={() => navigate('/create')}
              className="px-4 sm:px-5 py-2 text-xs sm:text-sm"
              leftIcon={<Plus className="w-4 h-4 text-[#D9720F]" />}
            >
              Create Room
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate('/join')}
              className="px-4 py-2 text-xs sm:text-sm"
            >
              Join Room
            </Button>
          </div>
        </section>

        {/* 2. Overview Section */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold text-[#8A8375] uppercase tracking-wider">
            Overview
          </h2>
          <div className="flex flex-col sm:flex-row items-stretch gap-4 w-full">
            {/* Card 1: Saved Sessions */}
            <div className="surface-card flex-1 min-w-0 p-5 sm:p-6 flex flex-col justify-center gap-1.5 shadow-xs">
              <span className="text-xs sm:text-sm font-medium text-[#5C574C]">Saved Sessions</span>
              <span className="text-2xl sm:text-3xl font-bold text-[#1A1815] tabular-nums tracking-tight">
                {rawRooms.length.toLocaleString()}
              </span>
            </div>

            {/* Card 2: Total Messages */}
            <div className="surface-card flex-1 min-w-0 p-5 sm:p-6 flex flex-col justify-center gap-1.5 shadow-xs">
              <span className="text-xs sm:text-sm font-medium text-[#5C574C]">Total Messages</span>
              <span className="text-2xl sm:text-3xl font-bold text-[#1A1815] tabular-nums tracking-tight">
                {totalMessages.toLocaleString()}
              </span>
            </div>

            {/* Card 3: Account Status */}
            <div className="surface-card flex-1 min-w-0 p-5 sm:p-6 flex flex-col justify-center gap-1.5 shadow-xs">
              <span className="text-xs sm:text-sm font-medium text-[#5C574C]">Account Status</span>
              <span className="text-2xl sm:text-3xl font-bold text-[#1F8A4C] tracking-tight">
                Active
              </span>
            </div>
          </div>
        </section>

        {/* 3. Saved Rooms Section */}
        <section className="flex flex-col gap-4">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg sm:text-xl font-bold text-[#1A1815]">Saved Rooms</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-[#E7E1D3] text-[#5C574C] font-mono text-xs font-semibold">
                {sortedRooms.length}
              </span>
            </div>

            {/* Search + Sort */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <div className="relative flex-1 min-w-0 sm:w-64">
                <Search className="w-4 h-4 text-[#8A8375] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search rooms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search saved rooms"
                  className="input-field pl-9 py-2 text-xs sm:text-sm w-full"
                />
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'name')}
                aria-label="Sort rooms by"
                className="input-field py-2 px-3 text-xs sm:text-sm w-28 sm:w-32 bg-[#FFFDF8] cursor-pointer shrink-0"
              >
                <option value="date">Newest</option>
                <option value="name">Name</option>
              </select>
            </div>
          </div>

          {/* List or Empty State */}
          {isLoading ? (
            <div className="surface-card p-10 text-center text-xs sm:text-sm text-[#8A8375]">
              Loading saved sessions...
            </div>
          ) : error ? (
            <div className="surface-card p-6 text-center text-xs sm:text-sm text-[#C23B2E] bg-[#FBEAE6]">
              Failed to load saved sessions.
            </div>
          ) : sortedRooms.length === 0 ? (
            <div className="surface-card p-10 sm:p-12 text-center flex flex-col items-center justify-center gap-3 w-full shadow-xs">
              <div className="w-10 h-10 rounded-full bg-[#F6F2E9] border border-[#E7E1D3] flex items-center justify-center text-[#8A8375]">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="flex flex-col items-center gap-1 max-w-md">
                <h3 className="text-base font-semibold text-[#1A1815]">
                  {searchQuery ? 'No rooms matching your search' : 'No saved rooms yet'}
                </h3>
                <p className="text-xs sm:text-sm text-[#5C574C] leading-relaxed">
                  {searchQuery
                    ? `No archived sessions found matching "${searchQuery}". Try a different keyword.`
                    : 'When you host a room while signed in, choose "Save Chat Log" when ending the room to archive it here.'}
                </p>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="mt-2 text-xs font-semibold text-[#D9720F] hover:underline cursor-pointer"
                  >
                    Clear search
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="surface-card divide-y divide-[#E7E1D3] overflow-hidden w-full">
              <AnimatePresence>
                {sortedRooms.map((room) => (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F6F2E9]/50 transition-colors"
                  >
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <Link
                          to={`/dashboard/rooms/${room.id}`}
                          className="text-base font-semibold text-[#1A1815] hover:text-[#D9720F] transition-colors truncate"
                        >
                          {room.room_name}
                        </Link>
                        <span className="text-xs font-mono text-[#D9720F] px-1.5 py-0.5 rounded bg-[#FBE9D6] shrink-0">
                          #{room.room_code}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#8A8375]">
                        <span>{formatDate(room.archived_at)}</span>
                        <span>•</span>
                        <span>{room.message_count} {room.message_count === 1 ? 'message' : 'messages'}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        to={`/dashboard/rooms/${room.id}`}
                        className="btn btn-ghost text-xs py-1.5 px-3 flex items-center gap-1"
                      >
                        <span>View</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleExport(room.id, 'json')}
                        className="p-1.5 text-[#5C574C] hover:text-[#1A1815] hover:bg-[#E7E1D3] rounded-[6px] transition-colors cursor-pointer"
                        title="Download JSON Export"
                        aria-label="Download JSON Export"
                      >
                        <FileCode className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleExport(room.id, 'txt')}
                        className="p-1.5 text-[#5C574C] hover:text-[#1A1815] hover:bg-[#E7E1D3] rounded-[6px] transition-colors cursor-pointer"
                        title="Download TXT Export"
                        aria-label="Download TXT Export"
                      >
                        <FileText className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setRoomToDelete({ id: room.id, name: room.room_name })}
                        className="p-1.5 text-[#C23B2E] hover:bg-[#FBEAE6] rounded-[6px] transition-colors cursor-pointer"
                        title="Delete Session"
                        aria-label="Delete Session"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>

      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!roomToDelete}
        onClose={() => setRoomToDelete(null)}
        title="Delete Saved Session?"
        description={`Are you sure you want to permanently delete "${roomToDelete?.name}"?`}
      >
        <div className="flex flex-col gap-4 pt-2">
          <p className="text-xs sm:text-sm text-[#5C574C]">
            This action cannot be undone. All messages recorded in this archived room will be permanently wiped.
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setRoomToDelete(null)}
              disabled={deleteMutation.isPending}
              className="text-xs text-[#8A8375] hover:text-[#1A1815] cursor-pointer"
            >
              Cancel
            </button>
            <Button
              variant="danger"
              size="sm"
              isLoading={deleteMutation.isPending}
              onClick={handleDeleteConfirm}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Delete Session
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
