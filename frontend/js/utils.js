/**
 * Mecanic OS - Utilities Module
 */

// Show Toast Alert
export function showToast(message, type = 'primary', duration = null) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconClass = 'fa-info-circle';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'warning') iconClass = 'fa-triangle-exclamation';
    if (type === 'danger') iconClass = 'fa-circle-exclamation';
    
    const finalDuration = duration || (type === 'danger' ? 15000 : 4000);
    
    toast.innerHTML = `<i class="fa-solid ${iconClass}"></i><span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'toast-in 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28) reverse';
        setTimeout(() => toast.remove(), 300);
    }, finalDuration);
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
        let val = values[i] === null || values[i] === undefined ? '' : values[i];
        if (Array.isArray(val)) {
            val = val.map(item => item instanceof SafeString ? item.toString() : escapeHtml(item)).join('');
            result += val + strings[i + 1];
        } else if (val instanceof SafeString) {
            result += val.toString() + strings[i + 1];
        } else {
            result += escapeHtml(val) + strings[i + 1];
        }
    }
    return result;
}

export function saveDteLogToFirestore(action, workshopId, docType, requestPayload, responseStatus, responseBody, endpoint) {
    if (typeof dbFirestore === 'undefined' || !dbFirestore) {
        console.warn("Firestore is not initialized on the frontend. Log not saved.");
        return;
    }
    
    let parsedResBody = responseBody;
    if (typeof responseBody === 'string') {
        try {
            parsedResBody = JSON.parse(responseBody);
        } catch (e) {
            // keep as string
        }
    }
    
    dbFirestore.collection('dte_api_logs').add({
        action: action || 'DTE',
        workshopId: workshopId || 'desconocido',
        docType: docType || 'desconocido',
        endpoint: endpoint || '',
        requestPayload: requestPayload || null,
        responseStatus: responseStatus || 0,
        responseBody: parsedResBody || null,
        timestamp: new Date().toISOString()
    })
    .then(() => console.log("DTE log written to Firestore successfully from frontend"))
    .catch(err => console.error("Error writing DTE log to Firestore:", err));
}

// Make a select element searchable with autocomplete input
export function makeSelectSearchable(selectId, placeholderText) {
    const originalSelect = document.getElementById(selectId);
    if (!originalSelect) return null;
    
    // Hide original select
    originalSelect.style.display = 'none';
    
    // Create container
    const container = document.createElement('div');
    container.className = 'searchable-select-container';
    container.style.position = 'relative';
    container.style.width = '100%';
    
    // Create text input
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'searchable-select-input';
    input.placeholder = placeholderText;
    input.style.width = '100%';
    input.style.padding = '0.65rem';
    input.style.borderRadius = '6px';
    input.style.background = 'var(--bg-input)';
    input.style.border = '1px solid var(--border-color)';
    input.style.color = 'var(--text-primary)';
    input.style.fontFamily = 'inherit';
    input.autocomplete = 'off';
    
    // Set initial value
    const selectedIdx = originalSelect.selectedIndex;
    if (selectedIdx >= 0 && originalSelect.options[selectedIdx].value !== '') {
        input.value = originalSelect.options[selectedIdx].text;
    } else {
        input.value = '';
    }
    
    // Chevron icon
    const chevron = document.createElement('i');
    chevron.className = 'fa-solid fa-chevron-down';
    chevron.style.position = 'absolute';
    chevron.style.right = '12px';
    chevron.style.top = '50%';
    chevron.style.transform = 'translateY(-50%)';
    chevron.style.pointerEvents = 'none';
    chevron.style.color = 'var(--text-secondary)';
    chevron.style.fontSize = '0.8rem';
    
    // Dropdown list
    const dropdown = document.createElement('div');
    dropdown.className = 'searchable-select-dropdown';
    dropdown.style.display = 'none';
    dropdown.style.position = 'absolute';
    dropdown.style.top = '100%';
    dropdown.style.left = '0';
    dropdown.style.right = '0';
    dropdown.style.maxHeight = '200px';
    dropdown.style.overflowY = 'auto';
    dropdown.style.background = 'var(--bg-card)';
    dropdown.style.border = '1px solid var(--border-color)';
    dropdown.style.borderRadius = '6px';
    dropdown.style.zIndex = '1000';
    dropdown.style.boxShadow = '0 8px 16px rgba(0,0,0,0.5)';
    dropdown.style.marginTop = '4px';
    
    container.appendChild(input);
    container.appendChild(chevron);
    container.appendChild(dropdown);
    
    // Insert container after original select
    originalSelect.parentNode.insertBefore(container, originalSelect.nextSibling);
    
    // Helper to render matching options
    function populateDropdown(filterText = '') {
        dropdown.innerHTML = '';
        const options = Array.from(originalSelect.options);
        
        // Filter out initial empty placeholder if we have search input
        const filtered = options.filter((opt, idx) => {
            if (idx === 0 && opt.value === '') return false;
            return opt.textContent.toLowerCase().includes(filterText.toLowerCase()) ||
                   opt.value.toLowerCase().includes(filterText.toLowerCase());
        });
        
        if (filtered.length === 0) {
            dropdown.innerHTML = '<div style="padding:0.65rem; color:var(--text-muted); text-align:center; font-size:0.85rem;">Sin resultados</div>';
            return;
        }
        
        filtered.forEach(opt => {
            const item = document.createElement('div');
            item.style.padding = '0.65rem 1rem';
            item.style.cursor = 'pointer';
            item.style.fontSize = '0.9rem';
            item.style.color = 'var(--text-primary)';
            item.style.borderBottom = '1px solid rgba(255,255,255,0.03)';
            item.textContent = opt.textContent;
            
            item.addEventListener('mouseenter', () => item.style.background = 'rgba(255,255,255,0.05)');
            item.addEventListener('mouseleave', () => item.style.background = 'transparent');
            
            item.addEventListener('click', () => {
                input.value = opt.textContent;
                originalSelect.value = opt.value;
                originalSelect.dispatchEvent(new Event('change'));
                dropdown.style.display = 'none';
            });
            dropdown.appendChild(item);
        });
    }
    
    // Open on focus/click
    input.addEventListener('focus', () => {
        if (originalSelect.disabled) return;
        populateDropdown(input.value);
        dropdown.style.display = 'block';
    });
    
    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) {
            dropdown.style.display = 'none';
            // Restore correct value text if invalid
            const curIdx = originalSelect.selectedIndex;
            if (curIdx >= 0 && originalSelect.options[curIdx].value !== '') {
                input.value = originalSelect.options[curIdx].text;
            } else {
                input.value = '';
            }
        }
    });
    
    // Filter on type
    input.addEventListener('input', () => {
        populateDropdown(input.value);
    });
    
    // Sync disabled and changed state from original select
    const observer = new MutationObserver(() => {
        input.disabled = originalSelect.disabled;
        if (originalSelect.disabled) {
            input.style.opacity = '0.5';
            input.value = '';
        } else {
            input.style.opacity = '1';
            const curIdx = originalSelect.selectedIndex;
            if (curIdx >= 0 && originalSelect.options[curIdx].value !== '') {
                input.value = originalSelect.options[curIdx].text;
            } else {
                input.value = '';
            }
        }
    });
    observer.observe(originalSelect, { attributes: true, attributeFilter: ['disabled'] });
    
    // Also listen to options additions/deletions (childList)
    const optionsObserver = new MutationObserver(() => {
        const curIdx = originalSelect.selectedIndex;
        if (curIdx >= 0 && originalSelect.options[curIdx].value !== '') {
            input.value = originalSelect.options[curIdx].text;
        } else {
            input.value = '';
        }
    });
    optionsObserver.observe(originalSelect, { childList: true });
    
    // Listen to manual changes of selection value
    originalSelect.addEventListener('change', () => {
        const curIdx = originalSelect.selectedIndex;
        if (curIdx >= 0 && originalSelect.options[curIdx].value !== '') {
            input.value = originalSelect.options[curIdx].text;
        } else {
            input.value = '';
        }
    });
    
    // Initial sync
    input.disabled = originalSelect.disabled;
    if (originalSelect.disabled) {
        input.style.opacity = '0.5';
    }
    
    return container;
}
