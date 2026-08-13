import { registerRoute, navigate } from '../../router';

export function renderDenied() {
  const app = document.getElementById('app')!;
  
  app.innerHTML = `
    <div style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: var(--spacing-24);">
      <div style="background: var(--color-surface-container-lowest); padding: var(--spacing-48) var(--spacing-32); border-radius: var(--radius-md); box-shadow: var(--shadow-modal); max-width: 400px; width: 100%; text-align: center; border-top: 4px solid var(--color-error);">
        <h2 style="font-weight: 800; font-size: 24px; color: var(--color-on-surface); margin-bottom: var(--spacing-8);">
          Entry Denied
        </h2>
        <p style="color: var(--color-on-surface-variant); line-height: 1.5; margin-bottom: var(--spacing-32);">
          The host declined your request to join, or the room is currently locked.
        </p>
        
        <button id="btn-back" style="background: var(--color-surface-container-lowest); border: 1.5px solid var(--color-primary); color: var(--color-primary); padding: var(--spacing-12) var(--spacing-24); border-radius: var(--radius-sm); font-weight: 600; font-size: 16px; cursor: pointer;">
          Back to Home
        </button>
      </div>
    </div>
  `;

  document.getElementById('btn-back')?.addEventListener('click', () => {
    navigate('/');
  });
}

registerRoute('/denied', renderDenied);
