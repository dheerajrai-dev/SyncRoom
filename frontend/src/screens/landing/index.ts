import { registerRoute, navigate } from '../../router';

export function renderLanding() {
  const app = document.getElementById('app')!;
  
  // Ephemeral Minimalism + Signal frosted typography + Discord bold headers
  app.innerHTML = `
    <div style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: var(--color-background); padding: var(--spacing-24); text-align: center;">
      <h1 style="font-weight: 800; font-size: 60px; color: var(--color-on-surface); line-height: 1.07; letter-spacing: -0.01em;">
        SyncRoom
      </h1>
      <p style="margin-top: var(--spacing-16); font-size: 20px; color: var(--color-on-surface-variant); max-width: 480px; line-height: 1.5;">
        A private, ephemeral workspace for people who don't need another account. Leave no trace.
      </p>
      
      <div style="margin-top: var(--spacing-48); display: flex; gap: var(--spacing-16); flex-wrap: wrap; justify-content: center;">
        <button id="btn-create" style="background: var(--color-surface-container-lowest); border: 1.5px solid var(--color-primary); color: var(--color-primary); padding: var(--spacing-12) var(--spacing-24); border-radius: var(--radius-sm); font-weight: 600; font-size: 16px; cursor: pointer;">
          Create Room
        </button>
        <button id="btn-join" style="background: var(--color-surface-container-lowest); border: 1.5px solid var(--color-secondary); color: var(--color-secondary); padding: var(--spacing-12) var(--spacing-24); border-radius: var(--radius-sm); font-weight: 600; font-size: 16px; cursor: pointer;">
          Join Room
        </button>
      </div>
      
      <div style="margin-top: var(--spacing-48);">
        <a href="javascript:void(0)" onclick="window.router.navigate('/login')" style="color: var(--color-primary); text-decoration: none; font-weight: 600;">
          Log in (Registered Users)
        </a>
      </div>
    </div>
  `;

  document.getElementById('btn-create')?.addEventListener('click', () => {
    navigate('/create');
  });

  document.getElementById('btn-join')?.addEventListener('click', () => {
    navigate('/join');
  });
}

// Register route
registerRoute('/', renderLanding);
