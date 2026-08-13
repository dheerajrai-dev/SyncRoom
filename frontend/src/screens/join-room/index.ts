import { registerRoute, navigate } from '../../router';
import { apiClient } from '../../api-client';
// @ts-ignore
import * as animejs from 'animejs';
const anime = (animejs as any).default || animejs;

export function renderJoinRoom() {
  const app = document.getElementById('app')!;
  
  app.innerHTML = `
    <div style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: var(--spacing-24); background: transparent;">
      <div id="join-card" class="glass-panel" style="padding: var(--spacing-32); border-radius: var(--radius-md); max-width: 400px; width: 100%; opacity: 0; transform: translateY(20px);">
        <h2 style="font-weight: 600; font-size: 28px; color: var(--color-on-surface); line-height: 1.14; margin-bottom: var(--spacing-8);">
          JOIN ROOM
        </h2>
        <p style="color: var(--color-secondary); margin-bottom: var(--spacing-24); line-height: 1.5;">
          Enter the room code and a nickname to request entry.
        </p>
        
        <form id="join-room-form" style="display: flex; flex-direction: column; gap: var(--spacing-16);">
          <div style="display: flex; flex-direction: column; gap: var(--spacing-4);">
            <label for="room_code" style="font-size: 12px; font-weight: 600; color: var(--color-secondary); text-transform: uppercase;">Room Code <span style="color: var(--color-error)">*</span></label>
            <input type="text" id="room_code" required placeholder="e.g. ABCDEF" style="padding: 12px; font-size: 16px; outline: none; text-transform: uppercase; width: 100%; box-sizing: border-box;" />
          </div>
          <div style="display: flex; flex-direction: column; gap: var(--spacing-4);">
            <label for="nickname" style="font-size: 12px; font-weight: 600; color: var(--color-secondary); text-transform: uppercase;">Nickname <span style="color: var(--color-error)">*</span></label>
            <input type="text" id="nickname" required placeholder="Your display name" style="padding: 12px; font-size: 16px; outline: none; width: 100%; box-sizing: border-box;" />
          </div>
          
          <div id="error-msg" style="color: var(--color-error); font-size: 14px; display: none;"></div>
          
          <button type="submit" id="submit-btn" class="btn-primary" style="margin-top: var(--spacing-8); width: 100%;">
            Request to Join
          </button>
        </form>
        
        <div style="margin-top: var(--spacing-24); text-align: center;">
          <a href="javascript:void(0)" onclick="window.router.navigate('/')" style="color: var(--color-secondary); text-decoration: none; font-size: 14px; font-weight: 600;">
            Cancel
          </a>
        </div>
      </div>
    </div>
  `;

  // Entrance animation
  setTimeout(() => {
    anime({
      targets: '#join-card',
      translateY: [20, 0],
      opacity: [0, 1],
      duration: 600,
      easing: 'easeOutExpo'
    });
  }, 100);

  const form = document.getElementById('join-room-form') as HTMLFormElement;
  const inputCode = document.getElementById('room_code') as HTMLInputElement;
  const inputNickname = document.getElementById('nickname') as HTMLInputElement;
  const errorMsg = document.getElementById('error-msg')!;
  const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Requesting...';

    const code = inputCode.value.trim().toUpperCase();
    const nickname = inputNickname.value.trim();

    try {
      const response = await apiClient(`/api/v1/rooms/${code}/join`, {
        method: 'POST',
        body: JSON.stringify({ username: nickname }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        let errDetail = data.detail;
        if (Array.isArray(errDetail)) errDetail = errDetail.map((e: any) => e.msg).join(', ');
        
        // Handle specific error: room locked
        if (response.status === 403 && data.detail === "room_is_locked") {
            navigate('/denied');
            return;
        }
        throw new Error(errDetail || 'Failed to request access');
      }

      const data = await response.json();
      const participantId = data.participant_id;

      // Save participant_id to poll for approval
      sessionStorage.setItem(`participant_id_${code}`, participantId);
      
      navigate(`/waiting/${code}`);
    } catch (err: any) {
      errorMsg.textContent = err.message || 'An error occurred. Please try again.';
      errorMsg.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Request to Join';
    }
  });
}

registerRoute('/join', renderJoinRoom);
