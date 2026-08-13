import { registerRoute, navigate } from '../../router';
import { apiClient } from '../../api-client';
// @ts-ignore
import * as animejs from 'animejs';
const anime = (animejs as any).default || animejs;

let currentQuery = '';
let currentOffset = 0;
const LIMIT = 12;
let isLoading = false;
let isInitialLoad = true;

export function renderDashboard() {
  const app = document.getElementById('app')!;
  currentQuery = '';
  currentOffset = 0;
  isInitialLoad = true;
  isLoading = false;
  
  app.innerHTML = `
    <div id="dashboard-container" style="min-height: 100vh; display: flex; flex-direction: column; background: transparent; opacity: 0;">
      
      <!-- Top Navigation -->
      <header class="glass-panel" style="height: 64px; border-bottom: var(--glass-border); display: flex; align-items: center; padding: 0 var(--spacing-24); justify-content: space-between; z-index: 10;">
        <h1 style="font-size: 20px; font-weight: 600; color: var(--color-on-surface); margin: 0;">SYNCROOM DASHBOARD</h1>
        
        <div style="display: flex; gap: var(--spacing-16); align-items: center;">
          <a href="javascript:void(0)" onclick="window.router.navigate('/profile')" style="color: var(--color-secondary); font-weight: 700; text-decoration: none; font-size: 14px;">PROFILE</a>
          <button id="logout-btn" class="btn-ghost">Log Out</button>
        </div>
      </header>

      <!-- Main Content -->
      <main style="flex: 1; padding: var(--spacing-48) var(--spacing-24); max-width: 1200px; margin: 0 auto; width: 100%; box-sizing: border-box;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-32); flex-wrap: wrap; gap: 16px;">
          <h2 style="font-size: 24px; font-weight: 800; margin: 0; color: var(--color-on-surface);">SAVED ROOMS</h2>
          <div style="display: flex; gap: var(--spacing-16); align-items: center;">
            <div style="position: relative;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--color-secondary); pointer-events: none;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input type="text" id="search-input" placeholder="Search rooms..." style="padding: 10px 12px 10px 36px; font-size: 14px; width: 250px;" />
            </div>
            <button onclick="window.router.navigate('/create')" class="btn-primary" style="padding: 10px 20px;">
              Create New Room
            </button>
          </div>
        </div>

        <div id="dashboard-content">
          <!-- Skeletons -> fast CSS -->
        </div>
        <div id="load-more-container" style="text-align: center; margin-top: var(--spacing-32); display: none;">
          <button id="load-more-btn" class="btn-secondary">
            Load More
          </button>
        </div>
      </main>
    </div>
  `;

  setTimeout(() => {
    anime({
      targets: '#dashboard-container',
      opacity: [0, 1],
      duration: 800,
      easing: 'easeOutQuart'
    });
  }, 50);

  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    await apiClient('/api/v1/auth/logout', { method: 'POST', requireAuth: true });
    navigate('/');
  });

  const searchInput = document.getElementById('search-input') as HTMLInputElement;
  let debounceTimer: ReturnType<typeof setTimeout>;
  searchInput?.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      currentQuery = (e.target as HTMLInputElement).value;
      currentOffset = 0;
      isInitialLoad = false;
      loadRooms(true);
    }, 300);
  });

  document.getElementById('load-more-btn')?.addEventListener('click', () => {
    if (!isLoading) {
      isInitialLoad = false;
      loadRooms(false);
    }
  });

  loadRooms(true);
}

async function loadRooms(clearExisting: boolean) {
  const content = document.getElementById('dashboard-content');
  const loadMoreContainer = document.getElementById('load-more-container');
  const loadMoreBtn = document.getElementById('load-more-btn') as HTMLButtonElement;
  if (!content) return;

  if (clearExisting && isInitialLoad) {
    // Show nothing for 150ms before showing skeletons
    content.innerHTML = '';
    setTimeout(() => {
      if (content.innerHTML === '') {
        content.innerHTML = `
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--spacing-24);">
            ${Array(6).fill(0).map(() => `
              <div class="glass-panel" style="padding: var(--spacing-24); height: 120px; animation: pulse 1.5s infinite ease-in-out;">
              </div>
            `).join('')}
          </div>
          <style>
            @keyframes pulse {
              0% { opacity: 0.6; }
              50% { opacity: 0.3; }
              100% { opacity: 0.6; }
            }
          </style>
        `;
      }
    }, 150);
  }

  isLoading = true;
  if (loadMoreBtn && !clearExisting) {
    loadMoreBtn.textContent = 'Loading...';
    loadMoreBtn.disabled = true;
  }

  try {
    const url = new URL('/api/v1/dashboard/rooms', window.location.origin);
    if (currentQuery) url.searchParams.append('q', currentQuery);
    url.searchParams.append('skip', currentOffset.toString());
    url.searchParams.append('limit', LIMIT.toString());

    const response = await apiClient(url.pathname + url.search, { requireAuth: true });
    if (!response.ok) throw new Error('Failed to load rooms');

    const data = await response.json();
    const rooms = data.rooms;
    
    // Check if we have more pages
    const hasMore = rooms.length === LIMIT;
    if (loadMoreContainer) {
      loadMoreContainer.style.display = hasMore ? 'block' : 'none';
    }
    if (loadMoreBtn) {
      loadMoreBtn.textContent = 'Load More';
      loadMoreBtn.disabled = false;
    }

    if (rooms.length === 0 && clearExisting) {
      if (currentQuery) {
        content.innerHTML = `
          <div style="text-align: center; padding: var(--spacing-48) 0; color: var(--color-secondary);">
            No results found for "${currentQuery}".
          </div>
        `;
      } else {
        content.innerHTML = `
          <div class="glass-panel" style="text-align: center; padding: var(--spacing-48) 0; border-radius: var(--radius-md);">
            <h3 style="margin-bottom: var(--spacing-8); font-size: 20px; font-weight: 600; color: var(--color-on-surface);">NO SAVED ROOMS YET</h3>
            <p style="color: var(--color-secondary); margin-bottom: var(--spacing-24); font-size: 14px;">Rooms you save at the end of a session will appear here.</p>
            <button onclick="window.router.navigate('/create')" class="btn-primary">
              Create New Room
            </button>
          </div>
        `;
      }
      isLoading = false;
      return;
    }

    const cardsHtml = rooms.map((room: any) => `
      <div class="room-card glass-panel" style="${isInitialLoad ? 'opacity: 0; transform: translateY(12px);' : ''} border-radius: var(--radius-md); padding: var(--spacing-24); display: flex; flex-direction: column; transition: transform var(--duration-fast) var(--ease-standard); cursor: default;" onmouseover="this.style.transform='translateY(-4px)';" onmouseout="this.style.transform='translateY(0)';">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--spacing-16);">
          <h3 style="margin: 0; font-size: 20px; font-weight: 600; word-break: break-word;">${(room.room_name || 'Untitled Room').toUpperCase()}</h3>
          <span style="font-family: var(--font-mono); font-size: 12px; background: rgba(0,0,0,0.05); color: var(--color-success); padding: 4px 8px; border-radius: 4px; font-weight: 600;">${room.room_code}</span>
        </div>
        <div style="color: var(--color-secondary); font-size: 14px; margin-bottom: var(--spacing-24); flex: 1;">
          Saved on ${new Date(room.created_at).toLocaleDateString()}
        </div>
        <button onclick="window.router.navigate('/dashboard/room/${room.id}')" class="btn-primary" style="width: 100%; padding: 10px;">
          View History
        </button>
      </div>
    `).join('');

    let grid = document.getElementById('rooms-grid');
    if (clearExisting || !grid) {
      content.innerHTML = `<div id="rooms-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--spacing-24);">${cardsHtml}</div>`;
    } else {
      grid.insertAdjacentHTML('beforeend', cardsHtml);
    }

    if (isInitialLoad) {
      const matchMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (matchMedia.matches) {
        document.querySelectorAll('.room-card').forEach(el => {
          (el as HTMLElement).style.opacity = '1';
          (el as HTMLElement).style.transform = 'translateY(0)';
        });
      } else {
        anime({
          targets: '.room-card',
          opacity: [0, 1],
          translateY: [20, 0],
          delay: anime.stagger(60, { start: 0, direction: 'normal' }),
          duration: 400,
          easing: 'easeOutExpo'
        });
      }
    }

    currentOffset += rooms.length;
  } catch (e: any) {
    if (clearExisting) {
      content.innerHTML = `
        <div style="color: var(--color-error); text-align: center; padding: var(--spacing-24);">
          Failed to load rooms. Please try again.
        </div>
      `;
    }
  } finally {
    isLoading = false;
  }
}

registerRoute('/dashboard', renderDashboard);
