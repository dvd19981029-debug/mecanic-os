/**
 * Mecanic OS - Main Application Entry Point
 */

import { initRouter } from './router.js?v=73';
import {
    initFirebase,
    initDatabase,
    initFirebaseAuthListener,
    bindFirebaseEvents,
    updateUserUI,
    updateSidebarBrand,
    startClock
} from '../app.js?v=69';
import { initUserSwitcher } from './views/saas.js?v=73';

async function startApp() {
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
        const viewContainer = document.getElementById('view-container');
        const targetContainer = spinner || viewContainer;
        if (targetContainer) {
            targetContainer.innerHTML = `
                <div style="color: #ff7675; text-align: center; padding: 3rem; font-family: sans-serif;">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                    <h3 style="margin: 0 0 0.5rem 0;">Error de Inicio</h3>
                    <p style="margin: 0 0 1rem 0; font-size: 0.9rem; color: #b2bec3;">${error.message || error}</p>
                    <pre style="text-align: left; background: rgba(0,0,0,0.5); padding: 0.75rem; border-radius: 4px; font-size: 0.75rem; overflow-x: auto; max-width: 600px; margin: 1rem auto; white-space: pre-wrap; word-break: break-all; color: #ff7675;">${error.stack || error}</pre>
                    <p style="margin: 0 0 1rem 0; font-size: 0.8rem; color: #ffeaa7;">Reintentando conexión automáticamente en 5s...</p>
                    <button onclick="window.location.reload()" style="background: #3498db; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; font-weight: bold;">
                        Reintentar Ahora
                    </button>
                </div>
            `;
        }
        setTimeout(() => {
            window.location.reload();
        }, 5000);
    }
    
    try {
        // 2. Startup Navigation Router
        initRouter();
    } catch (routerError) {
        console.error("Mecanic OS Router Error:", routerError);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    startApp();
}

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
