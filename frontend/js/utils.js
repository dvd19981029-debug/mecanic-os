/**
 * Mecanic OS - Utilities Module
 */

// Show Toast Alert
export function showToast(message, type = 'primary') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconClass = 'fa-info-circle';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'warning') iconClass = 'fa-triangle-exclamation';
    if (type === 'danger') iconClass = 'fa-circle-exclamation';
    
    toast.innerHTML = `<i class="fa-solid ${iconClass}"></i><span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'toast-in 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28) reverse';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Escape HTML for security
export function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    if (typeof str !== 'string') str = String(str);
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Hash password with SHA-256
export async function hashPassword(password) {
    if (!password) return '';
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Derives a cryptographic key from a password string using PBKDF2
async function deriveKey(password, salt) {
    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );
    return await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        passwordKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

// Encrypt string with AES-256-GCM (asynchronous)
export async function encryptString(str, key) {
    if (!key) return str;
    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12));
        
        const cryptoKey = await deriveKey(key, salt);
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            cryptoKey,
            data
        );
        
        const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
        combined.set(salt, 0);
        combined.set(iv, salt.length);
        combined.set(new Uint8Array(encrypted), salt.length + iv.length);
        
        let binary = '';
        for (let i = 0; i < combined.length; i++) {
            binary += String.fromCharCode(combined[i]);
        }
        return btoa(binary);
    } catch (e) {
        console.error("Encryption error:", e);
        return str;
    }
}

// Decrypt string with AES-256-GCM (asynchronous)
export async function decryptString(str, key) {
    if (!key) return str;
    try {
        const binary = atob(str);
        const combined = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            combined[i] = binary.charCodeAt(i);
        }
        
        const salt = combined.slice(0, 16);
        const iv = combined.slice(16, 28);
        const encrypted = combined.slice(28);
        
        const cryptoKey = await deriveKey(key, salt);
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            cryptoKey,
            encrypted
        );
        
        const decoder = new TextDecoder();
        return decoder.decode(decrypted);
    } catch (e) {
        console.error("Decryption error:", e);
        return str;
    }
}

// Sanitize Backend URL
export function sanitizeBackendUrl(url) {
    if (!url) return '';
    let clean = url.trim();
    if (clean.endsWith('/')) {
        clean = clean.slice(0, -1);
    }
    if (clean.endsWith('/api/dte/test-connection')) {
        clean = clean.slice(0, -24);
    }
    if (clean.endsWith('/api/dte/invalidate')) {
        clean = clean.slice(0, -19);
    }
    if (clean.endsWith('/api/dte/retrieve')) {
        clean = clean.slice(0, -17);
    }
    if (clean.endsWith('/api/dte')) {
        clean = clean.slice(0, -8);
    }
    if (clean.endsWith('/api')) {
        clean = clean.slice(0, -4);
    }
    if (clean.endsWith('/')) {
        clean = clean.slice(0, -1);
    }
    return clean;
}

// Get Backend URL
export function getBackendUrl(db) {
    const config = db || (typeof window.getDatabase === 'function' ? window.getDatabase() : null);
    let url = (config && config.saas_config && config.saas_config.backendUrl) || '';
    if (!url && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        return 'http://localhost:3005';
    }
    return sanitizeBackendUrl(url);
}

// Export report data to Excel via backend
export function downloadExcelReport(filename, jsonData) {
    const db = typeof window.getDatabase === 'function' ? window.getDatabase() : null;
    const backendUrl = getBackendUrl(db);
    const endpoint = (backendUrl ? sanitizeBackendUrl(backendUrl) : '') + '/api/export/excel';
    
    showToast("Generando reporte Excel...", "info");
    
    fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            filename: filename,
            data: jsonData
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("No se pudo generar el reporte en el servidor");
        }
        return response.blob();
    })
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        showToast("Reporte descargado con éxito", "success");
    })
    .catch(err => {
        console.error("Excel Export Error:", err);
        showToast("Error al exportar a Excel: " + err.message, "danger");
    });
}

// Tagged template literal for secure HTML escaping to prevent XSS
export class SafeString {
    constructor(val) {
        this.val = val;
    }
    toString() {
        return this.val;
    }
}

export function safe(val) {
    return new SafeString(val);
}

export function html(strings, ...values) {
    let result = strings[0];
    for (let i = 0; i < values.length; i++) {
        const val = values[i] === null || values[i] === undefined ? '' : values[i];
        if (val instanceof SafeString) {
            result += val.toString() + strings[i + 1];
        } else {
            result += escapeHtml(val) + strings[i + 1];
        }
    }
    return result;
}
