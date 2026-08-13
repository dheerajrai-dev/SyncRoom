import './styles/tokens.css';
import { initRouter } from './router';
import './screens/landing';
import './screens/create-room';
import './screens/join-room';
import './screens/waiting';
import './screens/denied';
import './screens/workspace';
import './screens/login';
import './screens/register';
import './screens/dashboard';
import './screens/room-history';
import './screens/profile';

// Initialize the router to mount the first screen
document.addEventListener('DOMContentLoaded', () => {
  initRouter();
});
