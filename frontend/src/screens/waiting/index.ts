import { registerRoute, navigate } from '../../router';
import { apiClient } from '../../api-client';

let pollInterval: ReturnType<typeof setInterval> | null = null;

export function renderWaiting(params: Record<string, string>) {
  const roomCode = params.room_code?.toUpperCase();
  const participantId = sessionStorage.getItem(`participant_id_${roomCode}`);

  if (!roomCode || !participantId) {
    navigate('/join');
    return;
  }

  const app = document.getElementById('app')!;
  
  app.innerHTML = `
    <div style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: var(--spacing-24);">
      <div style="background: var(--color-surface-container-lowest); padding: var(--spacing-48) var(--spacing-32); border-radius: var(--radius-md); box-shadow: var(--shadow-modal); max-width: 400px; width: 100%; text-align: center; border: 1px solid var(--color-outline-variant);">
        
        <div style="display: flex; justify-content: center; margin-bottom: var(--spacing-24);">
          <div class="pulse-dot" style="width: 16px; height: 16px; background-color: var(--color-primary); border-radius: 50%;"></div>
        </div>

        <h2 style="font-weight: 700; font-size: 24px; color: var(--color-on-surface); margin-bottom: var(--spacing-8);">
          Waiting for Host
        </h2>
        <p style="color: var(--color-on-surface-variant); line-height: 1.5; font-size: 14px;">
          Your request to join room <strong style="font-family: var(--font-mono); font-weight: 600;">${roomCode}</strong> has been sent. The host must approve you before you can enter.
        </p>
        
        <div style="margin-top: var(--spacing-32);">
          <a href="javascript:void(0)" id="cancel-wait" style="color: var(--color-secondary); text-decoration: none; font-size: 14px; font-weight: 500; transition: color var(--duration-fast) var(--ease-standard);">
            Cancel Request
          </a>
        </div>
      </div>
    </div>
    <style>
      @keyframes slowPulse {
        0% { opacity: 0.4; }
        50% { opacity: 1; }
        100% { opacity: 0.4; }
      }
      .pulse-dot {
        animation: slowPulse 2s ease-in-out infinite;
      }
      @media (prefers-reduced-motion: reduce) {
        .pulse-dot {
          animation: none;
          opacity: 1;
        }
      }
      #cancel-wait:hover {
        color: var(--color-on-surface);
      }
    </style>
  `;

  document.getElementById('cancel-wait')?.addEventListener('click', () => {
    if (pollInterval) clearInterval(pollInterval);
    sessionStorage.removeItem(`participant_id_${roomCode}`);
    navigate('/join');
  });

  // Start polling
  if (pollInterval) clearInterval(pollInterval);
  pollInterval = setInterval(async () => {
    try {
      const res = await apiClient(`/api/v1/rooms/${roomCode}/join/${participantId}/status`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'approved') {
          clearInterval(pollInterval!);
          sessionStorage.setItem(`ws_token_${roomCode}`, data.ws_token);
          navigate(`/workspace/guest/${roomCode}`);
        } else if (data.status === 'denied') {
          clearInterval(pollInterval!);
          navigate('/denied');
        }
      } else if (res.status === 404) {
        clearInterval(pollInterval!);
        alert('The room has been closed or your request was denied/cancelled.');
        sessionStorage.removeItem(`participant_id_${roomCode}`);
        navigate('/');
      }
    } catch (e) {
      console.error('Failed to poll status', e);
    }
  }, 2000);
}

// Cleanup interval if we navigate away manually
window.addEventListener('popstate', () => {
  if (pollInterval) clearInterval(pollInterval);
});

registerRoute('/waiting/:room_code', renderWaiting);
