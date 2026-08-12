import './styles/tokens.css';
import { initRouter } from './router';
import './screens/landing';

// Initialize the router to mount the first screen
document.addEventListener('DOMContentLoaded', () => {
  initRouter();
});
