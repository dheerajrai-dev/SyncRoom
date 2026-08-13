import { registerRoute, navigate } from '../../router';
import { apiClient } from '../../api-client';
// @ts-ignore
import * as animejs from 'animejs';
const anime = (animejs as any).default || animejs;

export function renderRegister() {
  const app = document.getElementById('app')!;
  
  app.innerHTML = `
    <div style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: var(--spacing-24); background: transparent;">
      <div id="register-card" class="glass-panel" style="padding: var(--spacing-32); border-radius: var(--radius-md); max-width: 400px; width: 100%; opacity: 0; transform: translateY(20px);">
        <h2 style="font-weight: 600; font-size: 28px; color: var(--color-on-surface); line-height: 1.14; margin-bottom: var(--spacing-8);">
          CREATE AN ACCOUNT
        </h2>
        <p style="color: var(--color-secondary); margin-bottom: var(--spacing-24); line-height: 1.5;">
          Join us and start creating rooms.
        </p>
        
        <form id="register-form" style="display: flex; flex-direction: column; gap: var(--spacing-16);">
          <div style="display: flex; flex-direction: column; gap: var(--spacing-4);">
            <label for="username" style="font-size: 12px; font-weight: 600; color: var(--color-secondary); text-transform: uppercase;">Username <span style="color: var(--color-error)">*</span></label>
            <input type="text" id="username" required style="padding: 12px; font-size: 16px; width: 100%; box-sizing: border-box;" autocomplete="username" />
          </div>
          <div style="display: flex; flex-direction: column; gap: var(--spacing-4);">
            <label for="password" style="font-size: 12px; font-weight: 600; color: var(--color-secondary); text-transform: uppercase;">Password <span style="color: var(--color-error)">*</span></label>
            <div style="position: relative; width: 100%;">
              <button type="button" id="toggle-pw" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: transparent; border: none; padding: 0; color: var(--color-secondary); display: flex; align-items: center; justify-content: center;" tabindex="-1">
                <svg id="eye-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              </button>
            </div>
          </div>
          <div style="display: flex; flex-direction: column; gap: var(--spacing-4);">
            <label for="confirm-password" style="font-size: 12px; font-weight: 600; color: var(--color-secondary); text-transform: uppercase;">Confirm Password <span style="color: var(--color-error)">*</span></label>
            <input type="password" id="confirm-password" required minlength="10" style="padding: 12px; font-size: 16px; width: 100%; box-sizing: border-box;" autocomplete="new-password" />
          </div>
          
          <div id="error-msg" style="color: var(--color-error); font-size: 14px; display: none;"></div>
          
          <button type="submit" id="submit-btn" class="btn-primary" style="margin-top: var(--spacing-8); width: 100%;">
            Sign Up
          </button>
        </form>
        
        <div style="margin-top: var(--spacing-24); text-align: center; display: flex; flex-direction: column; gap: 12px;">
          <a href="javascript:void(0)" onclick="window.router.navigate('/login')" style="color: var(--color-primary); text-decoration: none; font-size: 14px; font-weight: 600;">
            Already have an account? Log in
          </a>
          <a href="javascript:void(0)" onclick="window.router.navigate('/')" style="color: var(--color-secondary); text-decoration: none; font-size: 14px; font-weight: 600;">
            Back to Home
          </a>
        </div>
      </div>
    </div>
  `;

  // Entrance animation
  setTimeout(() => {
    anime({
      targets: '#register-card',
      translateY: [20, 0],
      opacity: [0, 1],
      duration: 600,
      easing: 'easeOutExpo'
    });
  }, 100);

  const form = document.getElementById('register-form') as HTMLFormElement;
  const errorMsg = document.getElementById('error-msg')!;
  const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;
  const pwInput = document.getElementById('password') as HTMLInputElement;
  
  document.getElementById('toggle-pw')?.addEventListener('click', () => {
    if (pwInput.type === 'password') {
      pwInput.type = 'text';
    } else {
      pwInput.type = 'password';
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account...';

    const username = (document.getElementById('username') as HTMLInputElement).value.trim();
    const password = (document.getElementById('password') as HTMLInputElement).value;
    const confirm = (document.getElementById('confirm-password') as HTMLInputElement).value;

    if (password !== confirm) {
      errorMsg.textContent = 'Passwords do not match';
      errorMsg.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign Up';
      return;
    }

    try {
      const response = await apiClient('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username,
          password
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || 'Failed to register account');
      }

      // Automatically log in or just navigate to login
      navigate('/login');
    } catch (err: any) {
      errorMsg.textContent = err.message || 'An error occurred. Please try again.';
      errorMsg.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign Up';
    }
  });
}

registerRoute('/register', renderRegister);
