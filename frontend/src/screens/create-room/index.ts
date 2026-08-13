import { registerRoute, navigate } from '../../router';
import { apiClient } from '../../api-client';
// @ts-ignore
import * as animejs from 'animejs';
const anime = (animejs as any).default || animejs;

export function renderCreateRoom() {
  const app = document.getElementById('app')!;
  
  app.innerHTML = `
    <div style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: var(--spacing-24); background: transparent;">
      <div id="create-card" class="glass-panel" style="padding: var(--spacing-32); border-radius: var(--radius-md); max-width: 400px; width: 100%; opacity: 0; transform: translateY(20px);">
        <h2 style="font-weight: 600; font-size: 28px; color: var(--color-on-surface); line-height: 1.14; margin-bottom: var(--spacing-8);">
          CREATE ROOM
        </h2>
        <p style="color: var(--color-secondary); margin-bottom: var(--spacing-24); line-height: 1.5;">
          Start a new ephemeral workspace. Everything is deleted when you end the session.
        </p>
        
        <form id="create-room-form" style="display: flex; flex-direction: column; gap: var(--spacing-16);">
          <div style="display: flex; flex-direction: column; gap: var(--spacing-4);">
            <label for="room_name" style="font-size: 12px; font-weight: 600; color: var(--color-secondary); text-transform: uppercase;">Room Name (Optional)</label>
            <input type="text" id="room_name" placeholder="e.g. Brainstorming Session" style="padding: 12px; font-size: 16px; outline: none;" />
          </div>
          
          <div id="error-msg" style="color: var(--color-error); font-size: 14px; display: none;"></div>
          
          <button type="submit" id="submit-btn" class="btn-primary" style="margin-top: var(--spacing-8); width: 100%;">
            Create Room
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
      targets: '#create-card',
      translateY: [20, 0],
      opacity: [0, 1],
      duration: 600,
      easing: 'easeOutExpo'
    });
  }, 100);

  const form = document.getElementById('create-room-form') as HTMLFormElement;
  const inputName = document.getElementById('room_name') as HTMLInputElement;
  const errorMsg = document.getElementById('error-msg')!;
  const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating...';

    try {
      // apiClient handles requireAuth auto-injecting JWT if available
      const response = await apiClient('/api/v1/rooms', {
        method: 'POST',
        requireAuth: true, 
        body: JSON.stringify({ room_name: inputName.value.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to create room');
      }

      const data = await response.json();
      const roomCode = data.code;
      const hostToken = data.host_token;

      // Save host token so the host can use it for WS and ending the session
      sessionStorage.setItem(`host_token_${roomCode}`, hostToken);
      
      navigate(`/workspace/host/${roomCode}`);
    } catch (err: any) {
      errorMsg.textContent = err.message || 'An error occurred. Please try again.';
      errorMsg.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Room';
    }
  });
}

registerRoute('/create', renderCreateRoom);
