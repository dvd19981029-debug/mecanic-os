/**
 * Mecanic OS - Main Application Entry Point
 */

import { initRouter } from './router.js';
import {
    initFirebase,
    initDatabase,
    initFirebaseAuthListener,
    bindFirebaseEvents,
    updateUserUI,
    updateSidebarBrand,
    startClock,
    initUserSwitcher
} from '../app.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Startup Firebase and Core Operations
    initFirebase();
    
    if (typeof dataService !== 'undefined') {
        await dataService.init();
    }
    
    await initDatabase();
    initFirebaseAuthListener();
    bindFirebaseEvents();
    updateUserUI();
    updateSidebarBrand();
    startClock();
    initUserSwitcher();
    
    // 2. Startup Navigation Router
    initRouter();
});
