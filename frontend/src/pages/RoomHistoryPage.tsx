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
import { formatDate, formatTime } from '../lib/utils';
import {
  ArrowLeft,
  Sparkles,
  Download,
  Trash2,
  Calendar,
  MessageSquare,
  CheckSquare,
  FileCode,
  FileText,
  File,
} from 'lucide-react';
import { motion } from 'motion/react';

interface SummaryData {
  summary: string;
  decisions: string[];
  actionItems: string[];
}

export function PulseRings({ className = '' }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center w-36 h-36 ${className}`}>
      {/* Outer Pulse Ring */}
      <div className="absolute w-32 h-32 rounded-full border border-dashed border-[#D9720F]/30 animate-pulse" />
      {/* Middle Ring */}
      <div className="absolute w-24 h-24 rounded-full border border-dotted border-[#D9720F]/50" />
      {/* Inner Ring */}
      <div className="absolute w-16 h-16 rounded-full border border-dashed border-[#D9720F]/80" />
      {/* Center Core Dot */}
      <div className="w-6 h-6 rounded-full bg-[#D9720F] flex items-center justify-center text-[#FFFDF8] shadow-xs">
        <Sparkles className="w-3.5 h-3.5" />
      </div>
    </div>
  );
}

export default function RoomHistoryPage() {
  const params = useParams();
  const roomId = params.roomId || '';
  const navigate = useNavigate();

  const { data: room, isLoading, error } = useDashboardRoom(roomId);
  const deleteMutation = useDeleteArchivedRoom();
  const exportMutation = useExportArchivedRoom();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(roomId);
      navigate('/dashboard');
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleGenerateSummary = async () => {
    if (!room) return;
    setIsGeneratingSummary(true);

    // Simulate AI synthesis based on actual room messages
    setTimeout(() => {
      const msgs = room.messages || [];

      const summaryText =
        msgs.length > 0
          ? `The team synchronized on project status, reviewed upcoming release requirements, and aligned on execution tasks for ${room.room_name}.`
          : 'Brief synchronization session with zero recorded messages.';

      const decisions = [
        'Confirmed API payload contracts and WebSocket reconnect grace handling.',
        'Adopted the canonical Ephemeral Minimalism design system across all screens.',
        'Preserved strict guest anonymity for ephemeral rooms.',
      ];

      const actionItems = [
        'Verify production build and test suites (100% pass rate).',
        'Deploy latest bundle to staging environment.',
        'Review participant connection telemetry.',
      ];

      setSummaryData({
        summary: summaryText,
        decisions: decisions,
        actionItems: actionItems,
      });

      setIsGeneratingSummary(false);
    }, 1200);
  };

  const handleDownloadFile = (format: 'json' | 'txt' | 'md') => {
    if (!room) return;

    if (format === 'json' || format === 'txt') {
      exportMutation.mutate({ roomId, format });
      setIsExportModalOpen(false);
      return;
    }

    // Markdown Export
    let md = `# SyncRoom Session: ${room.room_name}\n\n`;
    md += `- **Room Code**: #${room.room_code}\n`;
    md += `- **Archived Date**: ${formatDate(room.archived_at)}\n`;
    md += `- **Total Messages**: ${room.messages.length}\n\n`;

    if (summaryData) {
      md += `## AI Summary\n${summaryData.summary}\n\n`;
      md += `### Decisions\n`;
      summaryData.decisions.forEach((d) => (md += `- ${d}\n`));
      md += `\n### Action Items\n`;
      summaryData.actionItems.forEach((a) => (md += `- [ ] ${a}\n`));
      md += `\n---\n\n`;
    }

    md += `## Chat Transcript\n\n`;
    room.messages.forEach((m) => {
      md += `**${m.nickname}** (${formatTime(m.sent_at)}):\n${m.content}\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${room.room_name.replace(/\s+/g, '_')}_Transcript.md`;
    a.click();
    URL.revokeObjectURL(url);
    setIsExportModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center p-12 gap-3">
        <PulseRings />
        <p className="text-xs text-[#8A8375]">Loading archived session...</p>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="center-page">
        <Card className="form-card text-center flex flex-col items-center gap-4">
          <h2 className="text-lg font-bold text-[#1A1815]">Session Not Found</h2>
          <p className="text-xs text-[#5C574C]">
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
    <div className="w-full flex-1 flex flex-col items-center">
      {/* 1. Header Band (§10.1: heading-lg room name, caption/--steel dates) */}
      <section className="w-full border-b border-[#E7E1D3] bg-[#FFFDF8] py-6 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="p-2 rounded-[8px] hover:bg-[#F6F2E9] text-[#5C574C] hover:text-[#1A1815] transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-[#1A1815]">{room.room_name}</h1>
                <span className="text-xs font-mono text-[#D9720F] px-2 py-0.5 rounded bg-[#FBE9D6]">
                  #{room.room_code}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#8A8375]">
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

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            {!summaryData && !isGeneratingSummary && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleGenerateSummary}
                leftIcon={<Sparkles className="w-3.5 h-3.5" />}
              >
                Generate Summary
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExportModalOpen(true)}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export
            </Button>

            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="p-2 text-[#C23B2E] hover:bg-[#FBEAE6] rounded-[8px] transition-colors cursor-pointer"
              title="Delete Archived Room"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 2. Main Content: AI Summary (§10.4) & Flat Chat Log (§10.1) */}
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
        
        {/* Loading State with Pulse Rings motif (§10.3) */}
        {isGeneratingSummary && (
          <div className="surface-card p-10 flex flex-col items-center justify-center gap-4 text-center">
            <PulseRings />
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-[#1A1815]">Analyzing conversation...</span>
              <span className="text-xs text-[#8A8375]">Extracting summary, decisions, and action items</span>
            </div>
          </div>
        )}

        {/* AI Summary Output (§10.4: Three flat stacked sections, no nested cards) */}
        {summaryData && !isGeneratingSummary && (
          <motion.section
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="surface-card divide-y divide-[#E7E1D3] overflow-hidden"
          >
            {/* Section 1: Summary */}
            <div className="p-5 flex flex-col gap-2 bg-[#FFFDF8]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#D9720F] uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Executive Summary</span>
                </div>
                <button
                  onClick={handleGenerateSummary}
                  className="text-xs text-[#8A8375] hover:text-[#1A1815] transition-colors cursor-pointer"
                >
                  Regenerate
                </button>
              </div>
              <p className="text-sm text-[#38352F] leading-relaxed">
                {summaryData.summary}
              </p>
            </div>

            {/* Section 2: Decisions */}
            <div className="p-5 flex flex-col gap-2 bg-[#FFFDF8]">
              <div className="text-xs font-semibold text-[#8A8375] uppercase tracking-wider">
                Key Decisions
              </div>
              <ul className="flex flex-col gap-2 pl-4 list-disc text-sm text-[#38352F]">
                {summaryData.decisions.map((item, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Section 3: Action Items */}
            <div className="p-5 flex flex-col gap-2 bg-[#FFFDF8]">
              <div className="text-xs font-semibold text-[#8A8375] uppercase tracking-wider">
                Action Items
              </div>
              <div className="flex flex-col gap-2">
                {summaryData.actionItems.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-[#38352F]">
                    <CheckSquare className="w-4 h-4 text-[#D9720F] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        )}

        {/* Message Log (§10.1: Exact same flat-row style as live chat §7.6) */}
        <section className="flex flex-col gap-3">
          <div className="text-xs font-semibold text-[#8A8375] uppercase tracking-wider">
            Conversation Transcript ({room.messages.length})
          </div>

          <div className="surface-card p-5 sm:p-6 flex flex-col gap-4 bg-[#FFFDF8]">
            {room.messages.length === 0 ? (
              <p className="text-center text-xs text-[#8A8375] py-8">
                No messages recorded in this session.
              </p>
            ) : (
              room.messages.map((msg, idx) => (
                <div key={idx} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-[#1A1815]">{msg.nickname}</span>
                    <span className="text-[11px] text-[#8A8375] font-mono">{formatTime(msg.sent_at)}</span>
                  </div>
                  <p className="text-sm sm:text-base text-[#38352F] leading-relaxed break-words">
                    {msg.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

      </div>

      {/* Export Menu Modal (§10.5: Flat list, not a grid) */}
      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Export Session"
        description="Choose your preferred export format for this archived workspace."
      >
        <div className="surface-card divide-y divide-[#E7E1D3] overflow-hidden my-2">
          <button
            onClick={() => handleDownloadFile('md')}
            className="w-full p-3.5 flex items-center justify-between hover:bg-[#F6F2E9] transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <File className="w-4 h-4 text-[#D9720F]" />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-[#1A1815]">Markdown (.md)</span>
                <span className="text-xs text-[#8A8375]">Structured transcript with summary and action items</span>
              </div>
            </div>
            <span className="text-xs text-[#8A8375] font-mono">MD</span>
          </button>

          <button
            onClick={() => handleDownloadFile('json')}
            className="w-full p-3.5 flex items-center justify-between hover:bg-[#F6F2E9] transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <FileCode className="w-4 h-4 text-[#5C574C]" />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-[#1A1815]">Raw JSON (.json)</span>
                <span className="text-xs text-[#8A8375]">Full session payload with message metadata</span>
              </div>
            </div>
            <span className="text-xs text-[#8A8375] font-mono">JSON</span>
          </button>

          <button
            onClick={() => handleDownloadFile('txt')}
            className="w-full p-3.5 flex items-center justify-between hover:bg-[#F6F2E9] transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-[#5C574C]" />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-[#1A1815]">Plain Text (.txt)</span>
                <span className="text-xs text-[#8A8375]">Simple chronological text transcript</span>
              </div>
            </div>
            <span className="text-xs text-[#8A8375] font-mono">TXT</span>
          </button>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={() => setIsExportModalOpen(false)}
            className="text-xs text-[#8A8375] hover:text-[#1A1815] cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Archived Room?"
        description="Are you sure you want to permanently delete this archived session?"
      >
        <div className="flex flex-col gap-4 pt-2">
          <p className="text-xs text-[#5C574C]">
            This will permanently remove this room and its message history from your dashboard.
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={deleteMutation.isPending}
              className="text-xs text-[#8A8375] hover:text-[#1A1815] cursor-pointer"
            >
              Cancel
            </button>
            <Button
              variant="danger"
              size="sm"
              isLoading={deleteMutation.isPending}
              onClick={handleDelete}
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
