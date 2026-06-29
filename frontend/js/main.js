/**
 * Mecanic OS - Main Application Entry Point
 */

import { initRouter } from './router.js?v=21';
import {
    initFirebase,
    initDatabase,
    initFirebaseAuthListener,
    bindFirebaseEvents,
    updateUserUI,
    updateSidebarBrand,
    startClock
} from '../app.js?v=21';
import { initUserSwitcher } from './views/saas.js?v=21';

document.addEventListener('DOMContentLoaded', async () => {
    try {
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
    } catch (error) {
        console.error("Mecanic OS Startup Error:", error);
        const spinner = document.querySelector('.loading-spinner');
        if (spinner) spinner.remove();
    }
    
    try {
        // 2. Startup Navigation Router
        initRouter();
    } catch (routerError) {
        console.error("Mecanic OS Router Error:", routerError);
    }
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
