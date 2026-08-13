import { registerRoute, navigate } from '../../router';
import { apiClient } from '../../api-client';
import { WsClient } from '../../ws-client';
import type { ServerMessage } from '../../types/ws-messages';
// @ts-ignore
import * as animejs from 'animejs';
const anime = (animejs as any).default || animejs;

interface WorkspaceState {
  roomCode: string;
  isHost: boolean;
  token: string;
  ws: WsClient | null;
  participants: any[];
  messages: any[];
  pendingRequests: any[];
  isLocked: boolean;
  traceMeterTimer: ReturnType<typeof setInterval> | null;
}

export function renderWorkspace(params: Record<string, string>, isHost: boolean) {
  const roomCode = params.room_code?.toUpperCase();
  const token = isHost ? sessionStorage.getItem(`host_token_${roomCode}`) : sessionStorage.getItem(`ws_token_${roomCode}`);

  if (!roomCode || !token) {
    navigate('/');
    return;
  }

  const state: WorkspaceState = {
    roomCode,
    isHost,
    token,
    ws: null,
    participants: [],
    messages: [],
    pendingRequests: [],
    isLocked: false,
    traceMeterTimer: null,
  };

  const app = document.getElementById('app')!;
  
  app.innerHTML = `
    <div id="workspace-container" style="display: flex; height: 100vh; flex-direction: column; opacity: 0; background-color: transparent;">
      <!-- Trace Meter -->
      <div id="trace-meter" style="display: none; height: 4px; background: var(--color-secondary); width: 100%; transition: background var(--duration-moderate) var(--ease-standard);"></div>
      
      <!-- Top Bar -->
      <header class="glass-panel" style="height: 64px; border-bottom: var(--glass-border); display: flex; align-items: center; padding: 0 var(--spacing-24); justify-content: space-between; z-index: 10;">
        <div style="display: flex; align-items: center; gap: var(--spacing-16);">
          <button id="toggle-sidebar" class="btn-ghost" style="padding: 6px; border: none; display: flex; align-items: center; justify-content: center; color: var(--color-on-surface); background: transparent;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          <h1 style="font-size: 20px; font-weight: 600; color: var(--color-on-surface); margin: 0; display: flex; align-items: center; gap: 8px;">
            ROOM 
            <span id="room-code-chip" style="font-family: var(--font-mono); background: rgba(255,255,255,0.4); border: var(--glass-border); padding: 4px 12px; border-radius: var(--radius-sm); cursor: pointer; transition: background-color var(--duration-fast) var(--ease-standard); display: flex; align-items: center; gap: 6px; font-weight: 600;" title="Click to copy">
              ${roomCode}
              <svg id="copy-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.5;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              <svg id="check-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: none; color: var(--color-success);"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </span>
          </h1>
          ${isHost ? `
            <button id="toggle-lock" class="btn-ghost" style="padding: 8px 16px; font-size: 14px; background: transparent;">
              Loading...
            </button>
          ` : ''}
        </div>
        <div>
          ${isHost ? `
            <button id="end-session-btn" class="btn-primary" style="background: var(--color-error); padding: 10px 20px;">End Session</button>
          ` : `
            <button id="leave-btn" class="btn-secondary" style="padding: 10px 20px;">Leave Room</button>
          `}
        </div>
      </header>

      <div style="display: flex; flex: 1; overflow: hidden; position: relative;">
        <!-- Main Chat Area -->
        <main style="flex: 1; display: flex; flex-direction: column; background: transparent; z-index: 1;">
          <div id="chat-messages" style="flex: 1; overflow-y: auto; padding: var(--spacing-24); display: flex; flex-direction: column; gap: var(--spacing-16);">
            <!-- Messages go here -->
          </div>
          <div style="padding: var(--spacing-24); background: transparent;">
            <form id="chat-form" class="glass-panel" style="display: flex; gap: var(--spacing-12); border-radius: var(--radius-sm); padding: 4px;">
              <input type="text" id="chat-input" placeholder="Message room..." style="flex: 1; padding: 12px; border: none; background: transparent; color: var(--color-on-surface); font-family: var(--font-inter); outline: none; box-shadow: none;" autocomplete="off" />
              <button type="submit" class="btn-primary" style="margin: 4px; padding: 0 24px; border-radius: 4px;">Send</button>
            </form>
          </div>
        </main>

        <!-- Sidebar -->
        <aside id="sidebar" class="glass-panel" style="width: 300px; border-left: var(--glass-border); border-top: none; border-bottom: none; border-right: none; display: flex; flex-direction: column; z-index: 2; overflow: hidden; flex-shrink: 0; box-shadow: none;">
          <div style="width: 300px; display: flex; flex-direction: column; height: 100%;">
            <div style="padding: var(--spacing-16); border-bottom: var(--glass-border);">
              <h2 style="font-size: 14px; font-weight: 600; color: var(--color-secondary); margin: 0;">PARTICIPANTS</h2>
            </div>
            <div id="participant-list" style="flex: 1; overflow-y: auto; padding: var(--spacing-16); display: flex; flex-direction: column; gap: var(--spacing-12);">
              <!-- Participants go here -->
            </div>
            ${isHost ? `
              <div style="padding: var(--spacing-16); border-top: var(--glass-border);">
                <h2 style="font-size: 14px; font-weight: 600; color: var(--color-secondary); margin: 0 0 12px 0;">PENDING REQUESTS</h2>
                <div id="pending-list" style="display: flex; flex-direction: column; gap: var(--spacing-12);">
                  <!-- Pending joins go here -->
                </div>
              </div>
            ` : ''}
          </div>
        </aside>
      </div>
      
      <!-- End Session Modal (Host Only) -->
      <div id="end-session-modal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.4); align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(4px);">
        <div id="end-session-card" class="glass-panel" style="padding: var(--spacing-32); border-radius: var(--radius-md); width: 400px; box-shadow: var(--shadow-modal);">
          <h2 style="font-size: 24px; font-weight: 600; margin-bottom: 16px; color: var(--color-on-surface);">END SESSION</h2>
          <p style="color: var(--color-on-surface-variant); margin-bottom: 24px;">This will permanently close the room.</p>
          
          <div id="save-option-container" style="display: none; margin-bottom: 24px;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: var(--color-on-surface);">
              <input type="checkbox" id="save-chat-cb" style="width: auto;" />
              <span>Save chat history to Dashboard</span>
            </label>
          </div>
          
          <div style="display: flex; justify-content: flex-end; gap: 12px;">
            <button id="cancel-end" class="btn-ghost" style="color: var(--color-on-surface); border-color: transparent; background: transparent;">Cancel</button>
            <button id="confirm-end" class="btn-primary" style="background: var(--color-error);">End Session</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Init Data
  initWorkspace(state);

  // Entrance animation
  setTimeout(() => {
    anime({
      targets: '#workspace-container',
      opacity: [0, 1],
      duration: 800,
      easing: 'easeOutQuart'
    });
  }, 50);
}

async function initWorkspace(state: WorkspaceState) {
  let roomId = state.roomCode;

  // Fetch room info
  try {
    const res = await apiClient(`/api/v1/rooms/${state.roomCode}`);
    if (res.ok) {
      const data = await res.json();
      roomId = data.room_id; // Get the actual UUID for WebSocket
      state.isLocked = data.locked;
      updateLockUI(state);
    }
  } catch (e) {
    console.error(e);
  }

  // If host, fetch initial participants & pending and start polling
  if (state.isHost) {
    await fetchParticipants(state);
    setInterval(() => fetchParticipants(state), 5000);
    
    // Check if user is registered to show "Save" option in End modal
    const saveContainer = document.getElementById('save-option-container');
    const authRes = await apiClient('/api/v1/auth/me', { requireAuth: true }).catch(() => null);
    if (authRes && authRes.ok && saveContainer) {
      saveContainer.style.display = 'block'; // Show save option since they are a registered user
    }
    
    document.getElementById('end-session-btn')?.addEventListener('click', () => {
      document.getElementById('end-session-modal')!.style.display = 'flex';
      anime({
        targets: '#end-session-card',
        scale: [0.9, 1],
        opacity: [0, 1],
        duration: 300,
        easing: 'easeOutExpo'
      });
    });
    document.getElementById('cancel-end')?.addEventListener('click', () => {
      anime({
        targets: '#end-session-card',
        scale: [1, 0.9],
        opacity: [1, 0],
        duration: 200,
        easing: 'easeInExpo',
        complete: () => {
          document.getElementById('end-session-modal')!.style.display = 'none';
        }
      });
    });
    document.getElementById('confirm-end')?.addEventListener('click', async () => {
      const saveCb = document.getElementById('save-chat-cb') as HTMLInputElement;
      const save = saveCb ? saveCb.checked : false;
      await apiClient(`/api/v1/rooms/${state.roomCode}/end`, {
        method: 'POST',
        headers: { 'X-Host-Token': state.token },
        body: JSON.stringify({ save })
      });
      state.ws?.disconnect();
      navigate('/');
    });
    
    document.addEventListener('keydown', (e) => {
      const modal = document.getElementById('end-session-modal');
      if (e.key === 'Escape' && modal && modal.style.display === 'flex') {
        modal.style.display = 'none';
      }
    });
    
    document.getElementById('toggle-lock')?.addEventListener('click', async () => {
      const endpoint = state.isLocked ? 'unlock' : 'lock';
      const res = await apiClient(`/api/v1/rooms/${state.roomCode}/${endpoint}`, {
        method: 'POST',
        headers: { 'X-Host-Token': state.token }
      });
      if (res.ok) {
        state.isLocked = !state.isLocked;
        updateLockUI(state);
      }
    });
  } else {
    document.getElementById('leave-btn')?.addEventListener('click', () => {
      state.ws?.disconnect();
      sessionStorage.removeItem(`ws_token_${state.roomCode}`);
      navigate('/');
    });
  }

  // Sidebar toggle animation (Host & Guest)
  let sidebarOpen = true;
  document.getElementById('toggle-sidebar')?.addEventListener('click', () => {
    sidebarOpen = !sidebarOpen;
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      sidebar.style.transition = 'width var(--duration-base) var(--ease-standard), opacity var(--duration-base) var(--ease-standard)';
      sidebar.style.width = sidebarOpen ? '300px' : '0px';
      sidebar.style.opacity = sidebarOpen ? '1' : '0';
    }
  });

  // Copy to clipboard micro-interaction
  const copyChip = document.getElementById('room-code-chip');
  if (copyChip) {
    copyChip.addEventListener('click', () => {
      navigator.clipboard.writeText(state.roomCode);
      const copyIcon = document.getElementById('copy-icon');
      const checkIcon = document.getElementById('check-icon');
      
      if (copyIcon && checkIcon) {
        copyIcon.style.display = 'none';
        checkIcon.style.display = 'block';
        copyChip.style.backgroundColor = 'var(--color-primary-container)';
        
        // Use anime for the checkmark delight
        anime({
          targets: checkIcon,
          scale: [0.5, 1],
          duration: 250,
          easing: 'cubicBezier(0.34, 1.56, 0.64, 1)'
        });
        
        setTimeout(() => {
          checkIcon.style.display = 'none';
          copyIcon.style.display = 'block';
          copyChip.style.backgroundColor = 'var(--color-surface-container)';
        }, 2000);
      }
    });
  }

  // Setup WS
  state.ws = new WsClient(roomId, state.token);
  
  state.ws.onMessage((msg: ServerMessage) => {
    handleWsMessage(msg, state);
  });
  
  state.ws.onClose(() => {
    // Basic reconnect or cleanup
    console.log('WS Closed');
  });

  state.ws.connect();

  // Chat Form
  const chatForm = document.getElementById('chat-form') as HTMLFormElement;
  const chatInput = document.getElementById('chat-input') as HTMLInputElement;
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const content = chatInput.value.trim();
    if (content) {
      state.messages.push({
        content,
        username: 'Me',
        sent_at: new Date().toISOString()
      });
      renderMessages(state);

      state.ws?.send({ type: 'chat_message', content });
      chatInput.value = '';
    }
  });
}

function updateLockUI(state: WorkspaceState) {
  const btn = document.getElementById('toggle-lock');
  if (btn) {
    btn.textContent = state.isLocked ? 'Unlock Room' : 'Lock Room';
    btn.style.color = state.isLocked ? 'var(--color-success)' : 'var(--color-on-surface)';
  }
}

async function fetchParticipants(state: WorkspaceState) {
  try {
    const res = await apiClient(`/api/v1/rooms/${state.roomCode}/participants`, {
      headers: { 'X-Host-Token': state.token }
    });
    if (res.ok) {
      const data = await res.json();
      state.participants = data.participants.filter((p: any) => p.status === 'approved');
      state.pendingRequests = data.participants.filter((p: any) => p.status === 'pending');
      renderParticipants(state);
    }
  } catch (e) {
    console.error(e);
  }
}

function renderParticipants(state: WorkspaceState) {
  const pList = document.getElementById('participant-list');
  if (pList) {
    pList.innerHTML = state.participants.map(p => `
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 14px;">
        <span>${p.username || p.nickname}</span>
        ${state.isHost && p.username !== 'Host' ? `<button onclick="window.kickParticipant('${p.id || p.participant_id}')" style="background: none; border: none; color: var(--color-error); cursor: pointer; font-size: 12px;">Kick</button>` : ''}
      </div>
    `).join('');
  }

  const pendList = document.getElementById('pending-list');
  if (pendList && state.isHost) {
    if (state.pendingRequests.length === 0) {
      pendList.innerHTML = '<div style="color: var(--color-on-surface-variant); font-size: 12px;">No pending requests.</div>';
    } else {
      pendList.innerHTML = state.pendingRequests.map(p => `
        <div style="background: var(--color-surface-container); padding: 12px; border-radius: var(--radius-sm); font-size: 14px; display: flex; flex-direction: column; gap: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div><strong style="color: var(--color-primary);">${p.username || p.nickname}</strong> wants to join</div>
          <div style="display: flex; gap: 8px;">
            <button onclick="window.approveJoin('${p.id}')" class="btn-primary" style="flex: 1; padding: 6px; font-size: 12px;">Approve</button>
            <button onclick="window.denyJoin('${p.id}')" class="btn-secondary" style="flex: 1; padding: 6px; font-size: 12px; background: transparent; color: var(--color-on-surface); border-color: var(--color-outline-variant);">Deny</button>
          </div>
        </div>
      `).join('');
    }
  }
}

function renderMessages(state: WorkspaceState) {
  const chatDiv = document.getElementById('chat-messages');
  if (chatDiv) {
    chatDiv.innerHTML = state.messages.map((m, i) => {
      const isMe = m.username === 'Me';
      const isLast = i === state.messages.length - 1;
      
      const align = isMe ? 'flex-end' : 'flex-start';
      const bgColor = isMe ? 'var(--color-primary-container)' : 'var(--color-surface-container-lowest)';
      const color = isMe ? 'var(--color-on-primary-container)' : 'var(--color-on-surface)';
      const borderRadius = isMe ? 'var(--radius-md) 8px var(--radius-md) var(--radius-md)' : '8px var(--radius-md) var(--radius-md) var(--radius-md)';
      const opacity = isLast ? '0' : '1';

      return `
        <div class="${isLast ? 'new-chat-msg' : ''}" style="display: flex; flex-direction: column; gap: 6px; align-items: ${align}; opacity: ${opacity};">
          <div style="font-size: 12px; font-weight: 700; color: var(--color-secondary); padding: 0 4px;">${isMe ? 'YOU' : (m.username || m.nickname).toUpperCase()}</div>
          <div style="background: ${bgColor}; color: ${color}; padding: 14px 16px; border-radius: ${borderRadius}; width: fit-content; max-width: 80%; line-height: 1.5; font-size: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
            ${m.content}
          </div>
        </div>
      `;
    }).join('');
    chatDiv.scrollTop = chatDiv.scrollHeight;

    // Anime entrance animation for new messages
    setTimeout(() => {
      anime({
        targets: '.new-chat-msg',
        translateY: [20, 0],
        opacity: [0, 1],
        duration: 400,
        easing: 'easeOutElastic(1, .8)'
      });
    }, 10);
  }
}

function handleWsMessage(msg: any, state: WorkspaceState) {
  switch (msg.type) {
    case 'room_state':
      state.participants = msg.participants;
      state.messages = msg.messages;
      renderParticipants(state);
      renderMessages(state);
      break;
    case 'participant_joined':
    case 'participant_reconnected':
      if (!state.participants.find(p => (p.id || p.participant_id) === msg.participant_id)) {
        state.participants.push({ id: msg.participant_id, nickname: msg.nickname, username: msg.nickname, role: 'participant' });
      }
      renderParticipants(state);
      break;
    case 'participant_left':
      state.participants = state.participants.filter(p => (p.id || p.participant_id) !== msg.participant_id);
      renderParticipants(state);
      break;
    case 'participant_kicked':
      state.participants = state.participants.filter(p => (p.id || p.participant_id) !== msg.participant_id);
      renderParticipants(state);
      break;
    case 'chat_message':
      state.messages.push(msg);
      renderMessages(state);
      break;
    case 'join_request':
      if (state.isHost) {
        state.pendingRequests.push({ id: msg.participant_id, username: msg.nickname });
        renderParticipants(state);
      }
      break;
    case 'participant_approved':
    case 'participant_denied':
      if (state.isHost) {
        state.pendingRequests = state.pendingRequests.filter(p => p.id !== msg.participant_id);
        renderParticipants(state);
      }
      break;
    case 'host_disconnected_grace_started':
      startTraceMeter(msg.grace_expires_at, state);
      break;
    case 'host_reconnected':
      stopTraceMeter(state);
      break;
    case 'room_closing':
    case 'room_deleted':
      state.ws?.disconnect();
      alert(msg.message || msg.reason || 'Room closed');
      navigate('/');
      break;
  }
}

function startTraceMeter(expiresAtIso: string, state: WorkspaceState) {
  const meter = document.getElementById('trace-meter');
  if (!meter) return;
  meter.style.display = 'block';
  meter.style.width = '100%';
  
  const expiresAt = new Date(expiresAtIso).getTime();
  const totalGraceMs = 5 * 60 * 1000; // 5 mins
  
  if (state.traceMeterTimer) clearInterval(state.traceMeterTimer);
  
  state.traceMeterTimer = setInterval(() => {
    const now = Date.now();
    const remaining = expiresAt - now;
    if (remaining <= 0) {
      clearInterval(state.traceMeterTimer!);
      meter.style.width = '0%';
    } else {
      const pct = (remaining / totalGraceMs) * 100;
      // Let anime tween the width smoothly
      anime({
        targets: meter,
        width: `${pct}%`,
        duration: 1000,
        easing: 'linear'
      });
      // Switch color to amber if < 60s
      if (remaining < 60000) {
        meter.style.background = 'var(--color-tertiary)';
      } else {
        meter.style.background = 'var(--color-secondary)';
      }
    }
  }, 1000);
}

function stopTraceMeter(state: WorkspaceState) {
  if (state.traceMeterTimer) {
    clearInterval(state.traceMeterTimer);
    state.traceMeterTimer = null;
  }
  const meter = document.getElementById('trace-meter');
  if (meter) meter.style.display = 'none';
}

// Global handlers for inline HTML onclick
(window as any).approveJoin = async (id: string) => {
  const path = window.location.pathname;
  const roomCode = path.split('/').pop()?.toUpperCase() || '';
  const token = sessionStorage.getItem('host_token_' + roomCode);
  await apiClient('/api/v1/rooms/' + roomCode + '/approve', {
    method: 'POST',
    headers: { 'X-Host-Token': token || '' },
    body: JSON.stringify({ participant_id: id })
  });
  // Will be handled via WS or next fetch
};

(window as any).denyJoin = async (id: string) => {
  const path = window.location.pathname;
  const roomCode = path.split('/').pop()?.toUpperCase() || '';
  const token = sessionStorage.getItem('host_token_' + roomCode);
  await apiClient('/api/v1/rooms/' + roomCode + '/deny', {
    method: 'POST',
    headers: { 'X-Host-Token': token || '' },
    body: JSON.stringify({ participant_id: id })
  });
};

(window as any).kickParticipant = async (id: string) => {
  const path = window.location.pathname;
  const roomCode = path.split('/').pop()?.toUpperCase() || '';
  const token = sessionStorage.getItem('host_token_' + roomCode);
  await apiClient('/api/v1/rooms/' + roomCode + '/kick', {
    method: 'POST',
    headers: { 'X-Host-Token': token || '' },
    body: JSON.stringify({ participant_id: id })
  });
};

registerRoute('/workspace/host/:room_code', (p) => renderWorkspace(p, true));
registerRoute('/workspace/guest/:room_code', (p) => renderWorkspace(p, false));
