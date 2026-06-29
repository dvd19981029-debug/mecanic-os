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

// Encrypt string with simple XOR (obfuscation for local storage)
export function encryptString(str, key) {
    if (!key) return str;
    let result = '';
    for (let i = 0; i < str.length; i++) {
        const charCode = str.charCodeAt(i);
        const keyChar = key.charCodeAt(i % key.length);
        result += String.fromCharCode(charCode ^ keyChar);
    }
    return btoa(unescape(encodeURIComponent(result)));
}

// Decrypt string with simple XOR
export function decryptString(str, key) {
    if (!key) return str;
    try {
        const decoded = decodeURIComponent(escape(atob(str)));
        let result = '';
        for (let i = 0; i < decoded.length; i++) {
            const charCode = decoded.charCodeAt(i);
            const keyChar = key.charCodeAt(i % key.length);
            result += String.fromCharCode(charCode ^ keyChar);
        }
        return result;
    } catch(e) {
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
