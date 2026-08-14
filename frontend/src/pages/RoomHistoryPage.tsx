import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  useDashboardRoom,
  useDeleteArchivedRoom,
  useExportArchivedRoom,
} from '../features/dashboard/hooks';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Spinner } from '../components/ui/Spinner';
import { formatDate, formatTime } from '../lib/utils';
import {
  ArrowLeft,
  FileCode,
  FileText,
  Trash2,
  Calendar,
  MessageSquare,
} from 'lucide-react';

export default function RoomHistoryPage() {
  const params = useParams();
  const roomId = params.roomId || '';
  const navigate = useNavigate();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const { data: room, isLoading, error } = useDashboardRoom(roomId);
  const deleteMutation = useDeleteArchivedRoom();
  const exportMutation = useExportArchivedRoom();

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(roomId);
      navigate('/dashboard');
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12">
        <Spinner size="lg" />
        <p className="text-xs text-slate-400 mt-3">Loading archived session...</p>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="center-page">
        <Card className="form-card text-center">
          <h2 className="text-lg font-bold text-white mb-1">Session Not Found</h2>
          <p className="text-xs text-slate-400 mb-4">
            This archived room could not be loaded or may have been deleted.
          </p>
          <Button variant="secondary" onClick={() => navigate('/dashboard')} leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      {/* Back button & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white">{room.room_name}</h1>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {room.room_code}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(room.archived_at)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5" />
                {room.messages.length} messages
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => exportMutation.mutate({ roomId, format: 'json' })}
            leftIcon={<FileCode className="w-4 h-4 text-blue-400" />}
          >
            JSON
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => exportMutation.mutate({ roomId, format: 'txt' })}
            leftIcon={<FileText className="w-4 h-4 text-emerald-400" />}
          >
            TXT
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setIsDeleteModalOpen(true)}
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Message Archive Log */}
      <div className="glass-panel p-4 sm:p-6 space-y-4 max-h-[65vh] overflow-y-auto">
        {room.messages.length === 0 ? (
          <p className="text-center text-xs text-slate-500 py-8">No messages recorded in this session.</p>
        ) : (
          room.messages.map((msg, idx) => (
            <div key={idx} className="flex flex-col p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-blue-300">{msg.nickname}</span>
                <span>{formatTime(msg.sent_at)}</span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed break-words">{msg.content}</p>
            </div>
          ))
        )}
      </div>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Archived Room"
        description="Are you sure you want to permanently delete this archived session?"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-slate-400">
            This will permanently remove this room and its message history from your dashboard.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={deleteMutation.isPending}
              onClick={handleDelete}
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
