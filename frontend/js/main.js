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
    startClock
} from '../app.js';
import { initUserSwitcher } from './views/saas.js';

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

// Global protection against double submissions and duplicate clicks
document.addEventListener('submit', (e) => {
    const submitBtns = e.target.querySelectorAll('button[type="submit"], input[type="submit"]');
    submitBtns.forEach(btn => {
        if (!btn.disabled) {
            btn.disabled = true;
            setTimeout(() => { btn.disabled = false; }, 1000);
        }
    });
}, true);
