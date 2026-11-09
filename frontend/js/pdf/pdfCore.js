/**
 * Mecanic OS - Nucleo del generador de PDF de presupuestos (jsPDF + jspdf-autotable).
 * Mismo sistema que las cotizaciones de KÖDE/Aromaniak: el PDF se dibuja con comandos de jsPDF y se descarga directo,
 * sin cuadro de impresion (el de Safari guardaba el PDF en blanco).
 *
 * Contrato de cada formato (format_*.js):
 *   export async function draw(doc, ctx, H)
 *   - doc: instancia jsPDF (unit 'mm', format 'letter', ya con la pagina 1 creada)
 *   - ctx: { ws, budget, client, vehicle, products, labor, subtotal, iva, retVal, percVal, grandTotal,
 *            sumProd, sumLab, discount, options, numeroALetras }  (los mismos argumentos de las plantillas HTML)
 *   - H: helpers de este archivo (ver createHelpers)
 */

const V = '1';
let libsPromise = null;

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = () => reject(new Error('No se pudo cargar ' + src));
        document.head.appendChild(s);
    });
}

export function loadPdfLibs() {
    if (!libsPromise) {
        libsPromise = (async () => {
            if (!window.jspdf) await loadScript(new URL('../vendor/jspdf.umd.min.js?v=' + V, import.meta.url).href);
            if (!(window.jspdf && window.jspdf.jsPDF && window.jspdf.jsPDF.API && window.jspdf.jsPDF.API.autoTable)) {
                await loadScript(new URL('../vendor/jspdf.plugin.autotable.min.js?v=' + V, import.meta.url).href);
            }
            return window.jspdf;
        })().catch(err => { libsPromise = null; throw err; });
    }
    return libsPromise;
}

const FORMATS = {
    moderno_facturallama: './format_moderno.js',
    clasico_mecanicos: './format_clasico.js',
    elegante_ejecutivo: './format_elegante.js',
    compacto_orden: './format_compacto.js'
};

/** Quita emojis/simbolos que la fuente estandar del PDF no puede dibujar. */
function clean(s) {
    return String(s == null ? '' : s)
        .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/** $ 1,234.56 */
function money(n) {
    return '$ ' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** '#1e293b' -> [30, 41, 59] */
function hexToRgb(hex, fallback = [30, 41, 59]) {
    const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex || '').trim());
    if (!m) return fallback;
    let h = m[1];
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

const failedImages = [];

function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onloadend = () => resolve(r.result);
        r.onerror = reject;
        r.readAsDataURL(blob);
    });
}

function loadHtmlImage(src, crossOrigin) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        if (crossOrigin) img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('imagen no valida'));
        img.src = src;
    });
}

/** Redibuja la imagen en un canvas y la devuelve como PNG limpio (jsPDF falla con PNG/JPEG poco comunes: entrelazados, 16 bits, CMYK, webp, svg...). */
function normalizeToPng(img, maxSide = 1000) {
    const w0 = img.naturalWidth || img.width || 300;
    const h0 = img.naturalHeight || img.height || 150;
    const k = Math.min(1, maxSide / Math.max(w0, h0));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w0 * k));
    c.height = Math.max(1, Math.round(h0 * k));
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return { dataUrl: c.toDataURL('image/png'), w: c.width, h: c.height, format: 'PNG' };
}

/**
 * Carga una imagen (data URL, URL local o remota) -> { dataUrl, w, h, format } o null.
 * Para URLs remotas sin CORS prueba, en orden: fetch, <img crossOrigin> y un proxy gratuito de imagenes con CORS.
 */
async function loadImage(src) {
    if (!src) return null;
    const attempts = [];
    if (/^data:/i.test(src)) {
        attempts.push(() => loadHtmlImage(src));
    } else {
        attempts.push(async () => {
            const res = await fetch(src);
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return loadHtmlImage(await blobToDataUrl(await res.blob()));
        });
        attempts.push(() => loadHtmlImage(src, true));
        if (/^https?:/i.test(src)) {
            attempts.push(async () => {
                const res = await fetch('https://images.weserv.nl/?output=png&url=' + encodeURIComponent(src));
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return loadHtmlImage(await blobToDataUrl(await res.blob()));
            });
        }
    }
    let lastErr = null;
    for (const attempt of attempts) {
        try {
            return normalizeToPng(await attempt());
        } catch (e) {
            lastErr = e;
        }
    }
    console.warn('PDF: no se pudo cargar la imagen', String(src).slice(0, 120), lastErr && lastErr.message);
    failedImages.push(src);
    return null;
}

/** Mismo QR de WhatsApp que usan las plantillas HTML. Devuelve imagen cargada o null. */
async function loadWhatsappQr(ws) {
    const phone = String((ws && (ws.qr_whatsapp || ws.telefono)) || '').replace(/\D/g, '');
    if (!phone) return null;
    const num = phone.length === 8 ? '503' + phone : phone;
    return loadImage(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent('https://wa.me/' + num)}`);
}

/** Dibuja una imagen dentro de una caja (x,y,w,h) manteniendo proporcion y centrada. */
function addImageFit(doc, img, x, y, boxW, boxH, align = 'center') {
    if (!img) return false;
    const r = Math.min(boxW / img.w, boxH / img.h);
    const w = img.w * r, h = img.h * r;
    const dx = align === 'left' ? 0 : align === 'right' ? boxW - w : (boxW - w) / 2;
    doc.addImage(img.dataUrl, img.format || 'PNG', x + dx, y + (boxH - h) / 2, w, h);
    return true;
}

function createHelpers(jspdf, ctx) {
    return {
        clean,
        money,
        hexToRgb,
        loadImage,
        loadWhatsappQr,
        addImageFit,
        numeroALetras: ctx.numeroALetras || (n => String(n)),
        /** autoTable(doc, opts) -> devuelve la Y final de la tabla */
        autoTable(doc, opts) {
            if (typeof doc.autoTable === 'function') doc.autoTable(opts);
            else if (typeof jspdf.autoTable === 'function') jspdf.autoTable(doc, opts);
            else throw new Error('autoTable no disponible');
            return doc.lastAutoTable ? doc.lastAutoTable.finalY : 0;
        },
        fmtDate(d) {
            const dt = new Date(d);
            return isNaN(dt.getTime()) ? '' : dt.toLocaleDateString('es-SV', { day: '2-digit', month: '2-digit', year: 'numeric' });
        },
        /** Pie "Pagina X de Y" en todas las paginas (llamar al final). */
        pageNumbers(doc, { color = [110, 114, 125], size = 7.5, y, text = '' } = {}) {
            const total = doc.getNumberOfPages();
            const W = doc.internal.pageSize.getWidth();
            const Hh = doc.internal.pageSize.getHeight();
            for (let i = 1; i <= total; i++) {
                doc.setPage(i);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(size);
                doc.setTextColor(...color);
                if (text) doc.text(text, 14, y || Hh - 8);
                doc.text(`Página ${i} de ${total}`, W - 14, y || Hh - 8, { align: 'right' });
            }
        }
    };
}

/** Arma el PDF del presupuesto segun el formato configurado por el taller. */
export async function buildBudgetPdf(ctx) {
    failedImages.length = 0;
    const jspdf = await loadPdfLibs();
    const doc = new jspdf.jsPDF({ unit: 'mm', format: 'letter', orientation: 'portrait' });
    const key = (ctx.ws && ctx.ws.formato_presupuesto) || 'moderno_facturallama';
    const path = FORMATS[key] || FORMATS.moderno_facturallama;
    const mod = await import(path + '?v=' + V);
    await mod.draw(doc, ctx, createHelpers(jspdf, ctx));
    doc.__logoFailed = Boolean(ctx.ws && ctx.ws.logo && failedImages.includes(ctx.ws.logo));
    return doc;
}

/** Descarga el PDF: en el APK (puente nativo) lo guarda en Descargas y abre Compartir; en navegador usa doc.save(). */
export function downloadPdfDoc(doc, fileName) {
    const name = String(fileName || 'Presupuesto').replace(/\.pdf$/i, '') + '.pdf';
    const bridge = window.AndroidPrint;
    const plugin = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AndroidPrint;
    if ((bridge && typeof bridge.shareBase64Pdf === 'function') || (plugin && typeof plugin.shareBase64Pdf === 'function')) {
        const base64 = doc.output('datauristring').split(',')[1];
        if (bridge && typeof bridge.shareBase64Pdf === 'function') bridge.shareBase64Pdf(base64, name);
        else plugin.shareBase64Pdf({ base64, fileName: name });
        return;
    }
    doc.save(name);
}

export async function downloadBudgetPdfFromCtx(ctx, fileName) {
    const doc = await buildBudgetPdf(ctx);
    downloadPdfDoc(doc, fileName);
    return { logoFailed: Boolean(doc.__logoFailed) };
}
