/**
 * Mecanic OS - Lectura local (OCR) de Tarjeta de Circulación
 * Procesa las imágenes en el navegador, en memoria. No se suben ni se guardan.
 * Solo se extraen datos del vehículo (nunca datos del propietario).
 */

const TESSERACT_CDN = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
const MAX_SIDE = 2000;

let tesseractLoading = null;

function loadTesseract() {
    if (window.Tesseract) return Promise.resolve(window.Tesseract);
    if (tesseractLoading) return tesseractLoading;
    tesseractLoading = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = TESSERACT_CDN;
        s.onload = () => resolve(window.Tesseract);
        s.onerror = () => { tesseractLoading = null; reject(new Error('No se pudo cargar el motor OCR (revisa la conexión).')); };
        document.head.appendChild(s);
    });
    return tesseractLoading;
}

// Reduce la foto y la pasa a escala de grises con contraste ampliado
async function preprocessImage(file) {
    const url = URL.createObjectURL(file);
    try {
        const img = await new Promise((resolve, reject) => {
            const im = new Image();
            im.onload = () => resolve(im);
            im.onerror = () => reject(new Error('No se pudo leer la imagen.'));
            im.src = url;
        });
        const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.naturalWidth * scale);
        canvas.height = Math.round(img.naturalHeight * scale);
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const px = data.data;
        let min = 255, max = 0;
        for (let i = 0; i < px.length; i += 4) {
            const g = (px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114) | 0;
            px[i] = g;
            if (g < min) min = g;
            if (g > max) max = g;
        }
        const range = Math.max(1, max - min);
        for (let i = 0; i < px.length; i += 4) {
            const v = Math.max(0, Math.min(255, ((px[i] - min) * 255) / range));
            px[i] = px[i + 1] = px[i + 2] = v;
        }
        ctx.putImageData(data, 0, 0);
        return canvas;
    } finally {
        URL.revokeObjectURL(url);
    }
}

// Agrupa palabras en líneas por posición vertical
function groupLines(words) {
    const clean = words
        .filter(w => w.text && w.text.trim() && w.bbox)
        .map(w => ({
            text: w.text.trim(),
            x0: w.bbox.x0, x1: w.bbox.x1,
            y0: w.bbox.y0, y1: w.bbox.y1,
            yc: (w.bbox.y0 + w.bbox.y1) / 2,
            h: w.bbox.y1 - w.bbox.y0
        }))
        .sort((a, b) => a.yc - b.yc);
    const lines = [];
    clean.forEach(w => {
        const last = lines[lines.length - 1];
        if (last && Math.abs(w.yc - last.yc) < Math.max(last.h, w.h) * 0.6) {
            last.words.push(w);
            last.yc = last.words.reduce((s, x) => s + x.yc, 0) / last.words.length;
            last.h = Math.max(last.h, w.h);
        } else {
            lines.push({ words: [w], yc: w.yc, h: w.h });
        }
    });
    lines.forEach(l => l.words.sort((a, b) => a.x0 - b.x0));
    return lines;
}

const normWord = (t) => t.toUpperCase().replace(/[^A-Z0-9ÑÁÉÍÓÚ]/g, '');
const lineText = (l) => l.words.map(w => w.text).join(' ');

function findLabelLine(lines, regex) {
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].words.some(w => regex.test(normWord(w.text)))) return i;
    }
    return -1;
}

function titleCase(s) {
    return s.toLowerCase().replace(/(^|\s)\S/g, c => c.toUpperCase());
}

// VIN: 17 caracteres, sin I, O, Q (se corrigen confusiones típicas del OCR)
function vinCandidates(lines) {
    const out = [];
    lines.forEach(l => l.words.forEach(w => {
        const t = normWord(w.text).replace(/[ÑÁÉÍÓÚ]/g, '').replace(/[OQ]/g, '0').replace(/I/g, '1');
        if (/^[A-HJ-NPR-Z0-9]{17}$/.test(t)) out.push(t);
    }));
    return out;
}

function parseBack(lines) {
    const result = {};
    const warnings = [];

    // Fila de etiquetas AÑO / MARCA / MODELO -> la línea siguiente trae los valores
    const li = findLabelLine(lines, /^MARCA$/);
    if (li >= 0 && lines[li + 1]) {
        const labels = lines[li].words
            .map(w => ({ key: normWord(w.text), x0: w.x0 }))
            .filter(l => /^(A[ÑN]O|MARCA|MODELO|CAPACIDAD)$/.test(l.key))
            .sort((a, b) => a.x0 - b.x0);
        const buckets = {};
        lines[li + 1].words.forEach(w => {
            let owner = labels[0];
            labels.forEach(l => { if (l.x0 <= w.x0 + w.h) owner = l; });
            if (!owner) return;
            const k = /^A[ÑN]O$/.test(owner.key) ? 'ANO' : owner.key;
            (buckets[k] = buckets[k] || []).push(w.text);
        });
        if (buckets.ANO) {
            const m = buckets.ANO.join(' ').match(/(19|20)\d{2}/);
            if (m) result.year = m[0];
        }
        if (buckets.MARCA) result.marca = titleCase(buckets.MARCA.join(' ').replace(/[^A-Za-z0-9ÁÉÍÓÚÑ\- ]/g, '').trim());
        if (buckets.MODELO) result.modelo = titleCase(buckets.MODELO.join(' ').replace(/[^A-Za-z0-9ÁÉÍÓÚÑ\- ]/g, '').trim());
    }

    // Color: la línea siguiente a la etiqueta COLOR
    const ci = findLabelLine(lines, /^COLOR$/);
    if (ci >= 0 && lines[ci + 1]) {
        const c = lineText(lines[ci + 1]).replace(/[^A-Za-zÁÉÍÓÚÑ ]/g, '').trim();
        if (c) result.color = c.toUpperCase();
    }

    // Motor: la línea siguiente a la etiqueta MOTOR
    const mi = findLabelLine(lines, /MOTOR$/);
    if (mi >= 0 && lines[mi + 1]) {
        const m = lineText(lines[mi + 1]).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
        if (m.length >= 5) result.motor = m;
    }

    // Chasis / VIN: aparece dos veces en la tarjeta; sirve para validar la lectura
    const vins = vinCandidates(lines);
    if (vins.length) {
        const counts = {};
        vins.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
        const best = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
        result.vin = best;
        if (counts[best] < 2) warnings.push('El chasis solo se leyó una vez; verifícalo.');
    } else {
        const ki = findLabelLine(lines, /CHASIS$/);
        if (ki >= 0 && lines[ki + 1]) {
            const raw = lineText(lines[ki + 1]).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
            if (raw.length >= 10) { result.vin = raw; warnings.push('El chasis no tiene 17 caracteres válidos; verifícalo.'); }
        }
    }

    return { result, warnings };
}

function parseFront(lines) {
    const text = lines.map(lineText).join('\n').toUpperCase().replace(/[—–]/g, '-');
    // Placa: código alfanumérico seguido de un sufijo -#### en la tarjeta (ej. M345F6-2011)
    const m = text.match(/\b([A-Z]{1,3}[0-9][A-Z0-9]{2,6})\s*-\s*\d{4}\b/);
    return m ? { placa: m[1] } : {};
}

/**
 * Lee las dos caras de la tarjeta y devuelve solo datos del vehículo.
 * @returns {{placa?, marca?, modelo?, year?, color?, motor?, vin?, warnings: string[]}}
 */
export async function scanCirculationCards(frontFile, backFile, onProgress = () => {}) {
    const Tesseract = await loadTesseract();
    onProgress('Preparando motor de lectura...');
    const worker = await Tesseract.createWorker('eng', 1, {
        logger: m => {
            if (m.status === 'recognizing text') onProgress(`Leyendo imagen... ${Math.round((m.progress || 0) * 100)}%`);
        }
    });
    const found = { warnings: [] };
    try {
        await worker.setParameters({ tessedit_pageseg_mode: '11', preserve_interword_spaces: '1' });
        if (frontFile) {
            onProgress('Procesando frente...');
            const canvas = await preprocessImage(frontFile);
            const { data } = await worker.recognize(canvas);
            Object.assign(found, parseFront(groupLines(data.words || [])));
            canvas.width = canvas.height = 0;
        }
        if (backFile) {
            onProgress('Procesando reverso...');
            const canvas = await preprocessImage(backFile);
            const { data } = await worker.recognize(canvas);
            const { result, warnings } = parseBack(groupLines(data.words || []));
            Object.assign(found, result);
            found.warnings.push(...warnings);
            canvas.width = canvas.height = 0;
        }
    } finally {
        await worker.terminate();
    }
    return found;
}
