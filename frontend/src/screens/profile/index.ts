import { registerRoute } from '../../router';
import { apiClient } from '../../api-client';
// @ts-ignore
import * as animejs from 'animejs';
const anime = (animejs as any).default || animejs;

export function renderProfile() {
  const app = document.getElementById('app')!;
  
  app.innerHTML = `
    <div id="profile-container" style="min-height: 100vh; display: flex; flex-direction: column; background: transparent; opacity: 0;">
      
      <!-- Top Navigation -->
      <header class="glass-panel" style="height: 64px; border-bottom: var(--glass-border); display: flex; align-items: center; padding: 0 var(--spacing-24); justify-content: space-between; z-index: 10;">
        <div style="display: flex; align-items: center; gap: var(--spacing-16);">
          <a href="javascript:void(0)" onclick="window.router.navigate('/dashboard')" style="color: var(--color-secondary); text-decoration: none; font-size: 14px; font-weight: 600;">← DASHBOARD</a>
          <h1 style="font-size: 20px; font-weight: 600; color: var(--color-on-surface); margin: 0;">PROFILE SETTINGS</h1>
        </div>
      </header>

      <!-- Main Content -->
      <main style="flex: 1; padding: var(--spacing-48) var(--spacing-24); max-width: 600px; margin: 0 auto; width: 100%;">
        <div class="glass-panel" style="border-radius: var(--radius-md); padding: var(--spacing-32);">
          
          <div id="profile-content">
            <div style="text-align: center; color: var(--color-secondary);">Loading profile...</div>
          </div>
          
        </div>
      </main>
    </div>
  `;

  setTimeout(() => {
    anime({
      targets: '#profile-container',
      opacity: [0, 1],
      duration: 800,
      easing: 'easeOutQuart'
    });
  }, 50);

  loadProfile();
}

async function loadProfile() {
  const content = document.getElementById('profile-content')!;
  
  try {
    const res = await apiClient('/api/v1/users/me', { requireAuth: true });
    if (!res.ok) throw new Error('Failed to load');
    
    const user = await res.json();
    const avatarUrl = user.avatar_url || 'https://via.placeholder.com/100';

    content.innerHTML = `
      <!-- Avatar Section -->
      <div style="display: flex; flex-direction: column; align-items: center; gap: var(--spacing-16); margin-bottom: var(--spacing-32);">
        <img src="${avatarUrl}" id="avatar-preview" alt="Avatar" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 2px solid var(--color-primary);" />
        
        <div style="display: flex; gap: var(--spacing-8);">
          <label class="btn-secondary" style="cursor: pointer; display: inline-block;">
            Upload New
            <input type="file" id="avatar-upload" accept="image/png, image/jpeg" style="display: none;" />
          </label>
          ${user.avatar_url ? `
            <button id="avatar-delete" class="btn-secondary" style="border-color: var(--color-error); color: var(--color-error);">
              Remove
            </button>
          ` : ''}
        </div>
        <div id="avatar-error" style="color: var(--color-error); font-size: 12px; display: none;"></div>
      </div>

      <!-- Display Name Section -->
      <form id="profile-form" style="display: flex; flex-direction: column; gap: var(--spacing-16);">
        <div style="display: flex; flex-direction: column; gap: var(--spacing-4);">
          <label for="username" style="font-size: 12px; font-weight: 600; color: var(--color-secondary); text-transform: uppercase;">Username (Cannot be changed)</label>
          <input type="text" id="username" value="${user.username}" disabled style="padding: 12px; border: none; background: rgba(0,0,0,0.1); border-radius: var(--radius-sm); font-family: var(--font-inter); font-size: 16px; color: var(--color-secondary); width: 100%; box-sizing: border-box;" />
        </div>
        
        <div style="display: flex; flex-direction: column; gap: var(--spacing-4);">
          <label for="display_name" style="font-size: 12px; font-weight: 600; color: var(--color-secondary); text-transform: uppercase;">Display Name</label>
          <input type="text" id="display_name" value="${user.display_name || ''}" placeholder="How others see you" style="padding: 12px; font-size: 16px; outline: none; width: 100%; box-sizing: border-box;" />
        </div>
        
        <div id="profile-status" style="font-size: 14px; display: none; margin-top: 8px;"></div>
        
        <button type="submit" id="save-btn" class="btn-primary" style="margin-top: var(--spacing-8); width: 100%;">
          Save Changes
        </button>
      </form>
    `;

    // Handlers
    document.getElementById('avatar-upload')?.addEventListener('change', async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      const err = document.getElementById('avatar-error')!;
      err.style.display = 'none';

      if (file.size > 2 * 1024 * 1024) {
        err.textContent = 'File too large (max 2MB)';
        err.style.display = 'block';
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      try {
        const upRes = await apiClient('/api/v1/users/me/avatar', {
          method: 'POST',
          requireAuth: true,
          // Need to omit Content-Type so browser sets boundary for multipart
          headers: { 'Content-Type': '' }, 
          body: formData
        });
        
        if (!upRes.ok) throw new Error('Failed to upload');
        const upData = await upRes.json();
        (document.getElementById('avatar-preview') as HTMLImageElement).src = upData.avatar_url;
      } catch (e) {
        err.textContent = 'Upload failed. Feature might not be implemented yet.';
        err.style.display = 'block';
      }
    });

    document.getElementById('profile-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const saveBtn = document.getElementById('save-btn') as HTMLButtonElement;
      const statusDiv = document.getElementById('profile-status')!;
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';
      
      const displayName = (document.getElementById('display_name') as HTMLInputElement).value.trim();

      try {
        const pRes = await apiClient('/api/v1/users/me/display_name', {
          method: 'PATCH',
          requireAuth: true,
          body: JSON.stringify({ display_name: displayName })
        });

        if (!pRes.ok) throw new Error();
        statusDiv.textContent = 'Profile updated!';
        statusDiv.style.color = 'green';
        statusDiv.style.display = 'block';
      } catch (e) {
        statusDiv.textContent = 'Failed to update profile. API might be missing.';
        statusDiv.style.color = 'var(--color-error)';
        statusDiv.style.display = 'block';
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Changes';
      }
    });

  } catch (e) {
    content.innerHTML = '<div style="color: var(--color-error); text-align: center;">Failed to load profile. Please log in again.</div>';
  }
}

registerRoute('/profile', renderProfile);
