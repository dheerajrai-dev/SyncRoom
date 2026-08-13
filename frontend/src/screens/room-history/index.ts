import { registerRoute, navigate } from '../../router';
import { apiClient } from '../../api-client';
// @ts-ignore
import * as animejs from 'animejs';
const anime = (animejs as any).default || animejs;

export function renderRoomHistory(params: Record<string, string>) {
  const roomId = params.room_id;
  if (!roomId) {
    navigate('/dashboard');
    return;
  }

  const app = document.getElementById('app')!;
  
  app.innerHTML = `
    <div id="history-container" style="min-height: 100vh; display: flex; flex-direction: column; background: transparent; opacity: 0;">
      
      <!-- Top Navigation -->
      <header class="glass-panel" style="height: 64px; border-bottom: var(--glass-border); display: flex; align-items: center; padding: 0 var(--spacing-24); justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: var(--spacing-16);">
          <a href="javascript:void(0)" onclick="window.router.navigate('/dashboard')" style="color: var(--color-secondary); text-decoration: none; font-size: 14px; font-weight: 700;">← BACK</a>
          <h1 id="header-title" style="font-size: 20px; font-weight: 800; color: var(--color-on-surface); margin: 0;">Loading...</h1>
        </div>
        
        <div style="display: flex; gap: var(--spacing-12); align-items: center;">
          <button id="export-json" class="btn-ghost">Export JSON</button>
          <button id="export-txt" class="btn-ghost">Export TXT</button>
          <button id="delete-btn" class="btn-primary" style="background: var(--color-error); padding: 10px 16px;">Delete</button>
        </div>
      </header>

      <!-- Main Content -->
      <main style="flex: 1; padding: var(--spacing-24); display: flex; flex-direction: column; max-width: 800px; margin: 0 auto; width: 100%;">
        <div id="history-content" class="glass-panel" style="flex: 1; border: none; box-shadow: none; padding: var(--spacing-24); overflow-y: auto; display: flex; flex-direction: column; gap: var(--spacing-16); border-radius: var(--radius-md);">
          <div style="text-align: center; color: var(--color-secondary);">Loading messages...</div>
        </div>
      </main>

      <!-- Delete Confirmation Modal -->
      <div id="delete-modal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.4); align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(4px);">
        <div id="delete-card" class="glass-panel" style="padding: var(--spacing-32); border-radius: var(--radius-md); width: 400px; box-shadow: var(--shadow-modal);">
          <h2 style="font-size: 24px; font-weight: 600; margin-bottom: 16px; color: var(--color-on-surface);">DELETE ROOM HISTORY?</h2>
          <p style="color: var(--color-on-surface-variant); margin-bottom: 24px; line-height: 1.5;">This action cannot be undone. All messages and metadata for this room will be permanently deleted.</p>
          
          <div style="display: flex; justify-content: flex-end; gap: 12px;">
            <button id="cancel-delete" class="btn-ghost" style="color: var(--color-on-surface); border-color: transparent;">Cancel</button>
            <button id="confirm-delete" class="btn-primary" style="background: var(--color-error);">Delete Everything</button>
          </div>
        </div>
      </div>
    </div>
  `;

  loadRoomHistory(roomId);

  document.getElementById('export-json')?.addEventListener('click', () => downloadExport(roomId, 'json'));
  document.getElementById('export-txt')?.addEventListener('click', () => downloadExport(roomId, 'txt'));
  
  const deleteModal = document.getElementById('delete-modal')!;
  
  document.getElementById('delete-btn')?.addEventListener('click', () => {
    deleteModal.style.display = 'flex';
    anime({
      targets: '#delete-card',
      scale: [0.9, 1],
      opacity: [0, 1],
      duration: 300,
      easing: 'easeOutExpo'
    });
  });
  
  document.getElementById('cancel-delete')?.addEventListener('click', () => {
    anime({
      targets: '#delete-card',
      scale: [1, 0.9],
      opacity: [1, 0],
      duration: 200,
      easing: 'easeInExpo',
      complete: () => {
        deleteModal.style.display = 'none';
      }
    });
  });

  document.getElementById('confirm-delete')?.addEventListener('click', async () => {
    try {
      const res = await apiClient(`/api/v1/dashboard/rooms/${roomId}`, { method: 'DELETE', requireAuth: true });
      if (res.ok) {
        navigate('/dashboard');
      } else {
        alert('Failed to delete room');
      }
    } catch (e) {
      alert('Error occurred during deletion');
    } finally {
      deleteModal.style.display = 'none';
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && deleteModal.style.display === 'flex') {
      deleteModal.style.display = 'none';
    }
  });

  // Entrance animation
  setTimeout(() => {
    anime({
      targets: '#history-container',
      opacity: [0, 1],
      duration: 800,
      easing: 'easeOutQuart'
    });
  }, 50);
}

async function loadRoomHistory(roomId: string) {
  try {
    const res = await apiClient(`/api/v1/dashboard/rooms/${roomId}`, { requireAuth: true });
    if (!res.ok) throw new Error('Failed to load');
    
    const data = await res.json();
    const room = data.room;
    
    document.getElementById('header-title')!.textContent = room.room_name || room.room_code;
    
    const content = document.getElementById('history-content')!;
    if (room.messages.length === 0) {
      content.innerHTML = '<div style="text-align: center; color: var(--color-secondary); margin-top: 24px;">No messages were saved in this room.</div>';
      return;
    }

    content.innerHTML = room.messages.map((m: any) => `
      <div class="history-msg" style="display: flex; flex-direction: column; gap: 6px; opacity: 0; transform: translateY(10px);">
        <div style="font-size: 12px; font-weight: 600; color: var(--color-secondary); padding: 0 4px;">
          ${(m.nickname || 'USER').toUpperCase()} <span style="font-weight: 400; margin-left: 8px;">${new Date(m.sent_at).toLocaleString()}</span>
        </div>
        <div class="glass-panel" style="padding: 14px 16px; border-radius: 8px var(--radius-md) var(--radius-md) var(--radius-md); width: fit-content; max-width: 80%; line-height: 1.5; font-size: 15px; box-shadow: var(--glass-shadow);">
          ${m.content}
        </div>
      </div>
    `).join('');

    setTimeout(() => {
      anime({
        targets: '.history-msg',
        translateY: [20, 0],
        opacity: [0, 1],
        delay: anime.stagger(50),
        duration: 400,
        easing: 'easeOutElastic(1, .8)'
      });
    }, 50);
  } catch (e) {
    document.getElementById('history-content')!.innerHTML = '<div style="color: var(--color-error); text-align: center;">Failed to load history</div>';
  }
}

async function downloadExport(roomId: string, format: string) {
  try {
    const res = await apiClient(`/api/v1/dashboard/rooms/${roomId}/export?format=${format}`, { requireAuth: true });
    if (!res.ok) throw new Error('Export failed');
    
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `room_export_${roomId}.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (e) {
    alert('Failed to download export');
  }
}

registerRoute('/dashboard/room/:room_id', renderRoomHistory);
