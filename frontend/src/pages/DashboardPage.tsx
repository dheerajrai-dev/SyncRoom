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

  const rawRooms = data?.rooms || [];

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
      {/* 1. Top Band: Welcome + Create Room (§9.4) */}
      <section className="w-full border-b border-[#E7E1D3] bg-[#FFFDF8] py-8 sm:py-10 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1815] tracking-tight">
              Welcome back, {user?.display_name || user?.username}
            </h1>
            <p className="text-sm text-[#5C574C]">
              Manage your saved workspaces, archived conversations, and account data.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              onClick={() => navigate('/create')}
              className="px-5 py-2.5 text-sm"
              leftIcon={<Plus className="w-4 h-4 text-[#D9720F]" />}
            >
              Create Room
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate('/join')}
              className="px-4 py-2.5 text-sm"
            >
              Join Room
            </Button>
          </div>
        </div>
      </section>

      {/* 2. Main Content: Four Flat-Row Lists (§9.4) */}
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-10">
        
        {/* Section A: Statistics Band */}
        <section className="flex flex-col gap-3">
          <div className="text-xs font-semibold text-[#8A8375] uppercase tracking-wider">
            Overview
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="surface-card p-4 flex flex-col gap-1">
              <span className="text-xs text-[#8A8375]">Saved Sessions</span>
              <span className="text-2xl font-bold text-[#1A1815]">{rawRooms.length}</span>
            </div>
            <div className="surface-card p-4 flex flex-col gap-1">
              <span className="text-xs text-[#8A8375]">Total Messages</span>
              <span className="text-2xl font-bold text-[#1A1815]">{totalMessages}</span>
            </div>
            <div className="surface-card p-4 flex flex-col gap-1 col-span-2 sm:col-span-1">
              <span className="text-xs text-[#8A8375]">Account Status</span>
              <span className="text-2xl font-bold text-[#1F8A4C]">Active</span>
            </div>
          </div>
        </section>

        {/* Section B: Saved & Archived Rooms (§9.4 - search input + plain filter dropdown + flat rows) */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#1A1815]">Saved Rooms</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#E7E1D3] text-[#5C574C] font-mono">
                {sortedRooms.length}
              </span>
            </div>

            {/* Search + Filter */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-4 h-4 text-[#8A8375] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search rooms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pl-9 py-1.5 text-xs"
                />
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'name')}
                className="input-field py-1.5 px-2.5 text-xs w-28 bg-[#FFFDF8]"
              >
                <option value="date">Newest</option>
                <option value="name">Name</option>
              </select>
            </div>
          </div>

          {/* Flat Row List (§9.4: reuse §7.5 row pattern with --fog hairline) */}
          <div className="surface-card divide-y divide-[#E7E1D3] overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-[#8A8375]">
                Loading saved sessions...
              </div>
            ) : error ? (
              <div className="p-6 text-center text-xs text-[#C23B2E] bg-[#FBEAE6]">
                Failed to load saved sessions.
              </div>
            ) : sortedRooms.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#F6F2E9] flex items-center justify-center text-[#8A8375]">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <p className="text-sm font-medium text-[#1A1815]">No saved rooms yet</p>
                <p className="text-xs text-[#8A8375] max-w-sm">
                  When you host a room while signed in, choose "Save Chat Log" when ending the room to archive it here.
                </p>
              </div>
            ) : (
              <AnimatePresence>
                {sortedRooms.map((room) => (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F6F2E9]/50 transition-colors"
                  >
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/dashboard/rooms/${room.id}`}
                          className="text-base font-semibold text-[#1A1815] hover:text-[#D9720F] transition-colors truncate"
                        >
                          {room.room_name}
                        </Link>
                        <span className="text-xs font-mono text-[#D9720F] px-1.5 py-0.5 rounded bg-[#FBE9D6]">
                          #{room.room_code}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#8A8375]">
                        <span>{formatDate(room.archived_at)}</span>
                        <span>•</span>
                        <span>{room.message_count} messages</span>
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        to={`/dashboard/rooms/${room.id}`}
                        className="btn btn-ghost text-xs py-1.5 px-3 flex items-center gap-1"
                      >
                        <span>View</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        onClick={() => handleExport(room.id, 'json')}
                        className="p-1.5 text-[#5C574C] hover:text-[#1A1815] hover:bg-[#E7E1D3] rounded-[6px] transition-colors"
                        title="Download JSON Export"
                      >
                        <FileCode className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleExport(room.id, 'txt')}
                        className="p-1.5 text-[#5C574C] hover:text-[#1A1815] hover:bg-[#E7E1D3] rounded-[6px] transition-colors"
                        title="Download TXT Export"
                      >
                        <FileText className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setRoomToDelete({ id: room.id, name: room.room_name })}
                        className="p-1.5 text-[#C23B2E] hover:bg-[#FBEAE6] rounded-[6px] transition-colors"
                        title="Delete Session"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
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
          <p className="text-xs text-[#5C574C]">
            This action cannot be undone. All messages recorded in this archived room will be permanently wiped.
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setRoomToDelete(null)}
              disabled={deleteMutation.isPending}
              className="text-xs text-[#8A8375] hover:text-[#1A1815]"
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
