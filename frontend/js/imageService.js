/**
 * Mecanic OS - Image Processing & Storage Service
 * Compresión inteligente en el navegador y almacenamiento en Firebase Storage
 */

import { showToast, escapeHtml } from './utils.js?v=90';

/**
 * Comprime una imagen en el cliente utilizando Canvas API antes de subirla
 * @param {File|Blob} file 
 * @param {Object} options 
 * @returns {Promise<{ blob: Blob, originalSize: number, compressedSize: number, width: number, height: number }>}
 */
export async function compressImage(file, options = {}) {
    const {
        maxWidth = 1920,
        maxHeight = 1080,
        quality = 0.82,
        mimeType = 'image/jpeg'
    } = options;

    const originalSize = file.size;

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = (e) => {
            const img = new Image();
            img.onerror = reject;
            img.onload = () => {
                let { width, height } = img;

                // Calcular nuevas dimensiones manteniendo relación de aspecto
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                // Mejorar suavizado de escalado
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error("Fallo al comprimir la imagen en Canvas"));
                            return;
                        }
                        resolve({
                            blob,
                            originalSize,
                            compressedSize: blob.size,
                            width,
                            height
                        });
                    },
                    mimeType,
                    quality
                );
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

/**
 * Sube una imagen a Firebase Storage (o fallback a base64 si no hay conexión a Storage)
 * @param {Blob} blob 
 * @param {Object} meta 
 * @returns {Promise<{ url: string, name: string, date: string, size: number }>}
 */
export async function uploadImageToStorage(blob, meta = {}) {
    const workshopUid = meta.workshopUid || localStorage.getItem('mecanic_os_workshop_uid') || 'general';
    const folder = meta.folder || 'fotos';
    const originalName = meta.name || 'foto.jpg';
    const timestamp = Date.now();
    const cleanExt = originalName.toLowerCase().endsWith('.png') ? 'png' : 'jpg';
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const storagePath = `workshops/${workshopUid}/${folder}/${timestamp}_${randomSuffix}.${cleanExt}`;

    // 1. Intentar subir a Firebase Storage si está inicializado
    if (typeof firebase !== 'undefined' && firebase.storage) {
        try {
            const storage = firebase.storage();
            const storageRef = storage.ref(storagePath);
            const uploadTask = await storageRef.put(blob, {
                contentType: blob.type || 'image/jpeg',
                customMetadata: {
                    workshopUid: workshopUid,
                    uploadedAt: new Date().toISOString(),
                    originalName: originalName
                }
            });
            const downloadUrl = await uploadTask.ref.getDownloadURL();
            return {
                url: downloadUrl,
                path: storagePath,
                name: originalName,
                date: new Date().toISOString(),
                size: blob.size
            };
        } catch (storageErr) {
            console.warn("Firebase Storage no disponible o sin permisos. Aplicando fallback:", storageErr);
        }
    }

    // 2. Fallback: Convertir el blob comprimido a Data URL para no perder la fotografía
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            resolve({
                url: reader.result,
                path: 'local/' + storagePath,
                name: originalName,
                date: new Date().toISOString(),
                size: blob.size
            });
        };
        reader.readAsDataURL(blob);
    });
}

/**
 * Abre un modal Lightbox para ver la imagen a pantalla completa con zoom
 * @param {string} imageUrl 
 * @param {string} caption 
 */
export function openImageLightbox(imageUrl, caption = 'Fotografía del Vehículo') {
    let modal = document.getElementById('mecanic-image-lightbox');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'mecanic-image-lightbox';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.88);
            backdrop-filter: blur(4px);
            z-index: 999999;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 1.5rem;
            box-sizing: border-box;
        `;
        document.body.appendChild(modal);

        // Cerrar con tecla Escape
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display !== 'none') {
                modal.style.display = 'none';
            }
        });
    }

    modal.innerHTML = `
        <div style="position: relative; max-width: 90vw; max-height: 90vh; display: flex; flex-direction: column; align-items: center;">
            <button id="close-lightbox-btn" style="position: absolute; top: -45px; right: 0; background: rgba(255,255,255,0.2); border: none; color: #fff; width: 38px; height: 38px; border-radius: 50%; font-size: 1.2rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s;">
                <i class="fa-solid fa-xmark"></i>
            </button>
            <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(caption)}" style="max-width: 90vw; max-height: 80vh; object-fit: contain; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.15);">
            <div style="color: #f1f5f9; font-size: 0.9rem; margin-top: 0.75rem; text-align: center; background: rgba(0,0,0,0.5); padding: 0.4rem 1rem; border-radius: 20px;">
                <i class="fa-solid fa-camera"></i> ${escapeHtml(caption)}
            </div>
        </div>
    `;

    modal.style.display = 'flex';
    modal.onclick = (e) => {
        if (e.target === modal || e.target.closest('#close-lightbox-btn')) {
            modal.style.display = 'none';
        }
    };
}

/**
 * Crea e inicializa el componente de carga de fotos con compresión en un contenedor DOM
 * @param {Object} config
 * @returns {Object} { getPhotos: () => Array, setPhotos: (arr) => void }
 */
export function createPhotoUploader(config) {
    const {
        container,
        initialPhotos = [],
        folder = 'inspecciones',
        maxPhotos = 12,
        onChange = null
    } = config;

    if (!container) return { getPhotos: () => [], setPhotos: () => {} };

    let photos = Array.isArray(initialPhotos) ? [...initialPhotos] : [];
    let isProcessing = false;

    function render() {
        container.innerHTML = `
            <div class="photo-uploader-component" style="background: var(--bg-input, rgba(0,0,0,0.15)); border: 1px dashed var(--border-color); border-radius: 8px; padding: 1.25rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.75rem;">
                    <div>
                        <strong style="display: block; font-size: 0.95rem; color: var(--text-primary);"><i class="fa-solid fa-camera"></i> Fotografías del Vehículo (${photos.length}/${maxPhotos})</strong>
                        <span style="font-size: 0.75rem; color: var(--text-secondary);">Fotos de daños, odómetro, estado o evidencia. Se optimizan automáticamente.</span>
                    </div>
                    <div>
                        <input type="file" id="input-camera-files" accept="image/*" capture="environment" multiple style="display: none;">
                        <button type="button" class="btn btn-secondary btn-sm" id="btn-trigger-camera" ${photos.length >= maxPhotos || isProcessing ? 'disabled' : ''} style="padding: 0.45rem 0.85rem; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 0.4rem;">
                            <i class="fa-solid fa-camera"></i> Tomar / Subir Fotos
                        </button>
                    </div>
                </div>

                ${isProcessing ? `
                    <div style="display: flex; align-items: center; gap: 0.75rem; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); padding: 0.75rem 1rem; border-radius: 6px; margin-bottom: 1rem; color: var(--primary);">
                        <i class="fa-solid fa-spinner fa-spin" style="font-size: 1.2rem;"></i>
                        <span style="font-size: 0.85rem; font-weight: 500;" id="uploader-progress-text">Optimizando y subiendo fotografías...</span>
                    </div>
                ` : ''}

                <!-- Cuadrícula de fotos -->
                <div class="photo-thumbnails-grid" style="display: flex; flex-wrap: wrap; gap: 0.75rem;">
                    ${photos.length === 0 && !isProcessing ? `
                        <div style="width: 100%; text-align: center; padding: 1.5rem 1rem; color: var(--text-secondary); font-size: 0.85rem; font-style: italic;">
                            <i class="fa-solid fa-image" style="font-size: 2rem; display: block; margin-bottom: 0.5rem; opacity: 0.5;"></i>
                            No se han adjuntado fotos todavía. Usa el botón superior para capturar o seleccionar.
                        </div>
                    ` : ''}

                    ${photos.map((photo, index) => `
                        <div class="photo-thumb-item" style="position: relative; width: 90px; height: 90px; border-radius: 6px; overflow: hidden; border: 1px solid var(--border-color); background: #000; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
                            <img src="${escapeHtml(photo.url)}" alt="${escapeHtml(photo.name || 'Foto')}" data-index="${index}" class="thumb-img-clickable" style="width: 100%; height: 100%; object-fit: cover; cursor: pointer; transition: transform 0.2s;" title="Clic para ampliar">
                            <button type="button" data-index="${index}" class="btn-delete-thumb" style="position: absolute; top: 3px; right: 3px; background: rgba(239, 68, 68, 0.85); color: #fff; border: none; width: 22px; height: 22px; border-radius: 50%; font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0;" title="Eliminar foto">
                                <i class="fa-solid fa-xmark"></i>
                            </button>
                            <span style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.6); color: #fff; font-size: 0.65rem; padding: 1px 4px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                #${index + 1}
                            </span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Eventos
        const triggerBtn = container.querySelector('#btn-trigger-camera');
        const fileInput = container.querySelector('#input-camera-files');

        if (triggerBtn && fileInput) {
            triggerBtn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', async (e) => {
                const files = Array.from(e.target.files || []);
                if (files.length === 0) return;

                if (photos.length + files.length > maxPhotos) {
                    showToast(`Puedes subir un máximo de ${maxPhotos} fotos. Se procesarán las primeras disponibles.`, "warning");
                }

                const filesToProcess = files.slice(0, maxPhotos - photos.length);
                isProcessing = true;
                render();

                try {
                    for (let i = 0; i < filesToProcess.length; i++) {
                        const file = filesToProcess[i];
                        const progressEl = container.querySelector('#uploader-progress-text');
                        if (progressEl) {
                            progressEl.textContent = `Procesando foto ${i + 1} de ${filesToProcess.length} (${file.name})...`;
                        }

                        // 1. Compresión inteligente en el navegador
                        const { blob, originalSize, compressedSize } = await compressImage(file, {
                            maxWidth: 1920,
                            maxHeight: 1080,
                            quality: 0.82
                        });

                        const origKb = Math.round(originalSize / 1024);
                        const compKb = Math.round(compressedSize / 1024);
                        console.log(`Foto optimizada: ${file.name} de ${origKb}KB -> ${compKb}KB`);

                        // 2. Subida a almacenamiento
                        const uploaded = await uploadImageToStorage(blob, {
                            folder,
                            name: file.name
                        });

                        photos.push(uploaded);
                    }
                    showToast(`${filesToProcess.length} foto(s) optimizada(s) y agregada(s)`, "success");
                } catch (err) {
                    console.error("Error procesando fotos:", err);
                    showToast("Ocurrió un error al procesar alguna de las imágenes", "danger");
                } finally {
                    isProcessing = false;
                    render();
                    if (typeof onChange === 'function') {
                        onChange([...photos]);
                    }
                }
            });
        }

        // Clic en miniaturas para ampliar
        container.querySelectorAll('.thumb-img-clickable').forEach(img => {
            img.addEventListener('click', () => {
                const idx = parseInt(img.getAttribute('data-index'), 10);
                const p = photos[idx];
                if (p) {
                    openImageLightbox(p.url, `Fotografía #${idx + 1}: ${p.name || 'Vehículo'}`);
                }
            });
        });

        // Eliminar miniatura
        container.querySelectorAll('.btn-delete-thumb').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.getAttribute('data-index'), 10);
                photos.splice(idx, 1);
                render();
                if (typeof onChange === 'function') {
                    onChange([...photos]);
                }
            });
        });
    }

    render();

    return {
        getPhotos: () => [...photos],
        setPhotos: (newPhotos) => {
            photos = Array.isArray(newPhotos) ? [...newPhotos] : [];
            render();
        }
    };
}

/**
 * Renderiza el HTML de una galería de fotos para vistas de sólo lectura / detalles
 * @param {Array} photos 
 * @returns {string}
 */
export function renderPhotoGalleryHtml(photos) {
    if (!Array.isArray(photos) || photos.length === 0) {
        return `<p style="color: var(--text-secondary); font-size: 0.85rem; font-style: italic; margin: 0.5rem 0;">No se registraron fotografías de respaldo.</p>`;
    }

    return `
        <div class="readonly-photo-gallery" style="display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 0.75rem;">
            ${photos.map((p, idx) => `
                <div style="position: relative; width: 100px; height: 100px; border-radius: 6px; overflow: hidden; border: 1px solid var(--border-color); background: #000; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                    <img src="${escapeHtml(p.url)}" alt="${escapeHtml(p.name || 'Foto')}" class="view-lightbox-trigger" data-url="${escapeHtml(p.url)}" data-caption="Foto #${idx + 1} - ${escapeHtml(p.name || '')}" style="width: 100%; height: 100%; object-fit: cover; cursor: pointer; transition: transform 0.2s;" title="Clic para ver en grande">
                    <span style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.65); color: #fff; font-size: 0.65rem; padding: 1px 4px; text-align: center;">
                        #${idx + 1}
                    </span>
                </div>
            `).join('')}
        </div>
    `;
}

/**
 * Renderiza la sección de fotos para la hoja impresa / PDF
 * @param {Array} photos 
 * @returns {string}
 */
export function renderPhotoPrintHtml(photos) {
    if (!Array.isArray(photos) || photos.length === 0) {
        return '';
    }

    return `
        <div style="margin-top: 20px; page-break-inside: avoid;">
            <div style="font-size: 13px; font-weight: 700; color: #1e3a8a; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 12px; text-transform: uppercase;">
                Registro Fotográfico de Evidencia (${photos.length} fotos)
            </div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
                ${photos.slice(0, 6).map((p, idx) => `
                    <div style="border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; text-align: center; background: #fff; padding: 4px;">
                        <img src="${escapeHtml(p.url)}" alt="Foto #${idx + 1}" style="width: 100%; height: 140px; object-fit: cover; border-radius: 4px; display: block;">
                        <div style="font-size: 10px; color: #475569; margin-top: 4px; font-weight: 600;">
                            Foto #${idx + 1} ${p.date ? '(' + new Date(p.date).toLocaleDateString('es-SV') + ')' : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

/**
 * Conecta los eventos de clic de los elementos .view-lightbox-trigger dentro de un contenedor
 * @param {HTMLElement} container 
 */
export function bindLightboxTriggers(container) {
    if (!container) return;
    container.querySelectorAll('.view-lightbox-trigger').forEach(el => {
        el.addEventListener('click', () => {
            const url = el.getAttribute('data-url');
            const caption = el.getAttribute('data-caption') || 'Fotografía';
            if (url) {
                openImageLightbox(url, caption);
            }
        });
    });
}
