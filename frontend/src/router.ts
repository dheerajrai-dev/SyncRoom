type RouteHandler = (params: Record<string, string>) => void | Promise<void>;

interface Route {
  pattern: RegExp;
  paramNames: string[];
  handler: RouteHandler;
}

const routes: Route[] = [];

export function registerRoute(path: string, handler: RouteHandler) {
  const paramNames: string[] = [];
  const regexPath = path.replace(/:([^\/]+)/g, (_, paramName) => {
    paramNames.push(paramName);
    return '([^\\/]+)';
  });
  routes.push({
    pattern: new RegExp(`^${regexPath}$`),
    paramNames,
    handler,
  });
}

export async function navigate(path: string) {
  window.history.pushState({}, '', path);
  await handleRoute();
}

async function handleRoute() {
  const path = window.location.pathname;
  for (const route of routes) {
    const match = path.match(route.pattern);
    if (match) {
      const params: Record<string, string> = {};
      route.paramNames.forEach((name, i) => {
        params[name] = match[i + 1];
      });
      document.getElementById('app')!.innerHTML = ''; // Clear current view
      await route.handler(params);
      return;
    }
  }
  
  // 404 Fallback
  document.getElementById('app')!.innerHTML = `
    <div style="padding: var(--spacing-48); text-align: center;">
      <h1 style="font-weight: 800; font-size: var(--text-display);">404 - Not Found</h1>
      <p style="color: var(--color-on-surface-variant); margin-top: var(--spacing-16);">The page you are looking for does not exist.</p>
      <button onclick="window.router.navigate('/')" style="margin-top: var(--spacing-24); background: var(--color-surface-container-lowest); border: 1.5px solid var(--color-primary); color: var(--color-primary); border-radius: var(--radius-sm); padding: var(--spacing-12) var(--spacing-24); cursor: pointer; font-weight: 600;">Go Home</button>
    </div>
  `;
}

// Listen to back/forward navigation
window.addEventListener('popstate', handleRoute);

export function initRouter() {
  handleRoute();
}

// Expose navigate globally for easy inline onclick bindings in HTML templates
(window as any).router = { navigate };
