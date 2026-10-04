/**
 * Mecanic OS - Lectura local (OCR) de Tarjeta de Circulación
 * Procesa las imágenes en el navegador, en memoria. No se suben ni se guardan.
 * Solo se extraen datos del vehículo (nunca datos del propietario).
 */

const TESSERACT_CDN = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
const TARGET_SIDE = 3000; // el texto de la tarjeta es pequeño: se trabaja con imágenes grandes
const ALNUM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const COLORS = ['NEGRO', 'BLANCO', 'ROJO', 'AZUL', 'GRIS', 'PLATA', 'PLATEADO', 'VERDE', 'AMARILLO', 'NARANJA', 'CAFE', 'DORADO', 'BEIGE', 'MORADO', 'ROSADO', 'VINO', 'CELESTE', 'MULTICOLOR', 'GUINDA', 'TURQUESA'];

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

// Ajusta la foto a ~3000 px y la pasa a escala de grises con contraste ampliado
async function preprocessImage(file) {
    const url = URL.createObjectURL(file);
    try {
        const img = await new Promise((resolve, reject) => {
            const im = new Image();
            im.onload = () => resolve(im);
            im.onerror = () => reject(new Error('No se pudo leer la imagen.'));
            im.src = url;
        });
        const scale = TARGET_SIDE / Math.max(img.naturalWidth, img.naturalHeight);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.naturalWidth * scale);
        canvas.height = Math.round(img.naturalHeight * scale);
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.imageSmoothingQuality = 'high';
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

// Recorta una región del canvas (para releer una zona pequeña con más precisión)
function cropCanvas(canvas, r) {
    const left = Math.max(0, Math.round(r.left));
    const top = Math.max(0, Math.round(r.top));
    const width = Math.max(10, Math.min(canvas.width - left, Math.round(r.width)));
    const height = Math.max(10, Math.min(canvas.height - top, Math.round(r.height)));
    const out = document.createElement('canvas');
    out.width = width;
    out.height = height;
    out.getContext('2d').drawImage(canvas, left, top, width, height, 0, 0, width, height);
    return out;
}

// ---------- Utilidades de parseo ----------

const normWord = (t) => (t || '').toUpperCase().replace(/[^A-Z0-9ÑÁÉÍÓÚ]/g, '');
const lineText = (l) => l.words.map(w => w.text).join(' ');
const medianOf = (arr) => { const s = [...arr].sort((a, b) => a - b); return s[Math.floor(s.length / 2)] || 20; };

function toWords(rawWords) {
    return (rawWords || [])
        .filter(w => w.text && w.text.trim() && w.bbox)
        .map(w => ({
            text: w.text.trim(),
            x0: w.bbox.x0, x1: w.bbox.x1, y0: w.bbox.y0, y1: w.bbox.y1,
            yc: (w.bbox.y0 + w.bbox.y1) / 2,
            h: Math.max(8, w.bbox.y1 - w.bbox.y0)
        }));
}

function groupLines(words) {
    const sorted = [...words].sort((a, b) => a.yc - b.yc);
    const lines = [];
    sorted.forEach(w => {
        const last = lines[lines.length - 1];
        if (last && Math.abs(w.yc - last.yc) < Math.max(last.h, w.h) * 0.45) {
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

function titleCase(s) {
    return s.toLowerCase().replace(/(^|\s)\S/g, c => c.toUpperCase());
}

function editDistance(a, b) {
    const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        }
    }
    return dp[a.length][b.length];
}

// Dígito verificador del VIN (posición 9)
const VIN_VALUES = { A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9, S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9 };
const VIN_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
function vinChecksumOk(vin) {
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) return false;
    let sum = 0;
    for (let i = 0; i < 17; i++) {
        const c = vin[i];
        const v = /\d/.test(c) ? parseInt(c, 10) : VIN_VALUES[c];
        sum += v * VIN_WEIGHTS[i];
    }
    const rem = sum % 11;
    return vin[8] === (rem === 10 ? 'X' : String(rem));
}
const VIN_CONFUSIONS = { '8': ['B'], 'B': ['8'], '0': ['D'], 'D': ['0'], '5': ['S'], 'S': ['5'], '2': ['Z'], 'Z': ['2'], '6': ['G'], 'G': ['6'], '1': ['L', 'T'], 'L': ['1'], 'T': ['1'] };
function repairVin(vin) {
    if (vinChecksumOk(vin)) return vin;
    for (let i = 0; i < 17; i++) {
        for (const alt of (VIN_CONFUSIONS[vin[i]] || [])) {
            const cand = vin.slice(0, i) + alt + vin.slice(i + 1);
            if (vinChecksumOk(cand)) return cand;
        }
    }
    return null;
}

const LABEL_WORD = /CHASIS|MOTOR|SERIE|^N$|^NO$|^NR$|ENVIN|^VIN$|^CH$|^EN$/;

// ---------- Reverso ----------

function parseBackWords(rawWords) {
    const words = toWords(rawWords);
    const lines = groupLines(words);
    const fields = {};
    const meta = { vinCandidates: [] };

    // Fila AÑO / MARCA / MODELO: se ancla en el año (no depende de leer las etiquetas)
    const toYear = (t) => {
        const s = normWord(t);
        if (s.length !== 4) return null;
        const d = s.replace(/[OQ]/g, '0').replace(/[IL]/g, '1').replace(/S/g, '5').replace(/Z/g, '2').replace(/B/g, '8');
        return /^(19[89]\d|20[0-3]\d)$/.test(d) ? d : null;
    };
    const anchors = words
        .filter(w => toYear(w.text))
        .sort((a, b) => a.yc - b.yc);
    for (const Y of anchors) {
        const row = words
            .filter(w => Math.abs(w.yc - Y.yc) < Y.h * 0.9 && w.x0 > Y.x1 - 2 && w.x0 - Y.x1 < Y.h * 40)
            .sort((a, b) => a.x0 - b.x0);
        const alphaIdx = row.findIndex(w => (w.text.match(/[A-Za-zÁÉÍÓÚÑ]/g) || []).length >= 3);
        if (alphaIdx < 0) continue;
        const marcaWord = row[alphaIdx];
        const rest = [];
        let stop = null;
        for (const w of row.slice(alphaIdx + 1)) {
            if (/ASS|\d\s*[.,\/]\s*\d|^\d{6,}$|^[A-Z]*\d?[.,\/]\d{2}/i.test(w.text.trim())) { stop = w; break; }
            if (!/[A-Za-z0-9]/.test(w.text)) continue;
            rest.push(w);
        }
        fields.year = toYear(Y.text);
        fields.marca = titleCase(marcaWord.text.replace(/[^A-Za-z0-9ÁÉÍÓÚÑ\-]/g, ''));
        if (rest.length) fields.modelo = titleCase(rest.map(w => w.text.replace(/[^A-Za-z0-9ÁÉÍÓÚÑ\-]/g, '')).filter(Boolean).join(' '));
        const all = [Y, marcaWord, ...rest, ...(stop ? [stop] : [])];
        meta.modeloBox = rest.length ? {
            first: rest[0], last: rest[rest.length - 1], stop,
            minY0: Math.min(...all.map(w => w.y0)),
            maxY1: Math.max(...all.map(w => w.y1))
        } : null;
        break;
    }

    // VIN: palabra (o palabras contiguas de la misma fila) de 17 caracteres
    const cleanVin = (t) => normWord(t).replace(/[ÑÁÉÍÓÚ]/g, '').replace(/[OQ]/g, '0').replace(/I/g, '1');
    const vinOk = (s) => /^[A-HJ-NPR-Z0-9]{17}$/.test(s) && (s.match(/[A-Z]/g) || []).length >= 4 && (s.match(/\d/g) || []).length >= 3;
    const byX = [...words].filter(w => !LABEL_WORD.test(normWord(w.text))).sort((a, b) => a.x0 - b.x0);
    const seen = new Set();
    byX.forEach((w, i) => {
        let s = cleanVin(w.text);
        let last = w;
        for (let k = 0; k < 3; k++) {
            if (vinOk(s) && !seen.has(w.x0 + ':' + w.y0 + ':' + s)) {
                seen.add(w.x0 + ':' + w.y0 + ':' + s);
                meta.vinCandidates.push({ vin: s, y: w.yc });
            }
            if (s.length >= 17) break;
            const next = byX.slice(i + 1).find(n => n.x0 >= last.x1 - 2 && n.x0 - last.x1 < last.h * 1.5 && Math.abs(n.yc - last.yc) < last.h * 0.8);
            if (!next) break;
            s += cleanVin(next.text);
            last = next;
        }
    });
    meta.vinCandidates.sort((a, b) => a.y - b.y);

    // Color: texto sobre la etiqueta "Nº CHASIS" (solo si coincide con colores conocidos)
    const chasisWord = words.find(w => normWord(w.text).includes('CHASIS'));
    const firstVin = meta.vinCandidates[0];
    const refLine = chasisWord
        ? { yc: chasisWord.yc, h: chasisWord.h }
        : (firstVin ? { yc: firstVin.y - 30, h: 20 } : null);
    if (refLine) {
        const colorWords = words
            .filter(w => w.yc < refLine.yc - refLine.h * 0.7 && w.yc > refLine.yc - refLine.h * 4.2)
            .sort((a, b) => a.x0 - b.x0);
        const found = [];
        colorWords.forEach(w => {
            const t = normWord(w.text);
            if (t.length < 3) return;
            const m = COLORS.find(c => editDistance(t, c) <= (c.length >= 5 ? 1 : 0));
            if (m && !found.includes(m)) found.push(m);
        });
        if (found.length) fields.color = found.join(' ');
    }

    // Etiqueta MOTOR (el valor se relee recortando la zona, que es más fiable)
    const motorWord = words.find(w => /MOTOR$/.test(normWord(w.text)) && normWord(w.text).length <= 7);
    if (motorWord) meta.motorLabel = motorWord;

    return { fields, meta };
}

function pickVin(candidates) {
    if (!candidates.length) return { vin: null, warn: null };
    // 1) Alguna lectura con dígito verificador válido (o reparable con 1 sustitución típica)
    for (const c of candidates) {
        const ok = repairVin(c.vin);
        if (ok) return { vin: ok, warn: null };
    }
    // 2) Coincidencia entre las dos apariciones del chasis en la tarjeta
    const counts = {};
    candidates.forEach(c => { counts[c.vin] = (counts[c.vin] || 0) + 1; });
    const best = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
    return { vin: best, warn: counts[best] < 2 ? 'El chasis no se pudo validar; verifícalo.' : null };
}

async function recognizeLine(worker, input, whitelist, psm) {
    await worker.setParameters({ tessedit_pageseg_mode: psm, tessedit_char_whitelist: whitelist });
    const { data } = await worker.recognize(input);
    return (data.text || '').trim();
}

async function readBack(worker, canvas, crop, onProgress) {
    const merged = { fields: {}, meta: { vinCandidates: [] } };
    const mergeIn = (p) => {
        Object.keys(p.fields).forEach(k => { if (p.fields[k] && !merged.fields[k]) merged.fields[k] = p.fields[k]; });
        merged.meta.vinCandidates.push(...p.meta.vinCandidates);
        ['modeloBox', 'motorLabel'].forEach(k => { if (p.meta[k] && !merged.meta[k]) merged.meta[k] = p.meta[k]; });
    };

    const passes = ['6', '11'];
    for (let i = 0; i < passes.length; i++) {
        onProgress(`Leyendo reverso (pasada ${i + 1}/${passes.length})...`);
        await worker.setParameters({ tessedit_pageseg_mode: passes[i], tessedit_char_whitelist: '', preserve_interword_spaces: '1' });
        const { data } = await worker.recognize(canvas);
        mergeIn(parseBackWords(data.words));
        const f = merged.fields;
        if (f.year && f.marca && f.modelo && f.color && merged.meta.vinCandidates.length && merged.meta.motorLabel) break;
    }

    const warnings = [];
    const vinRes = pickVin(merged.meta.vinCandidates);
    if (vinRes.vin) merged.fields.vin = vinRes.vin;
    if (vinRes.warn) warnings.push(vinRes.warn);

    // Relectura de zonas pequeñas (mejora números que se pierden en la lectura general)
    onProgress('Afinando motor y modelo...');
    const mb = merged.meta.modeloBox;
    if (mb) {
        try {
            const left = mb.first.x0 - 10;
            const limit = Math.min(mb.stop ? mb.stop.x0 - 6 : Infinity, mb.last.x1 + mb.first.h * 5);
            const width = limit - left;
            const region = await crop(canvas, { left, top: mb.minY0 - 12, width, height: mb.maxY1 - mb.minY0 + 24 });
            const txt = (await recognizeLine(worker, region, ALNUM + ' ', '8')).toUpperCase().replace(/[^A-Z0-9]/g, '');
            const firstAlnum = normWord(mb.first.text);
            const curAlnum = normWord(merged.fields.modelo || '');
            if (txt && firstAlnum && txt.startsWith(firstAlnum.slice(0, 3)) && txt.length >= curAlnum.length) {
                merged.fields.modelo = titleCase(txt.replace(/^([A-Z]+)(\d)/, '$1 $2'));
            }
        } catch (e) { console.warn('Relectura de modelo omitida:', e); }
    }
    const ml = merged.meta.motorLabel;
    if (ml) {
        try {
            const lh = Math.max(14, Math.min(40, ml.h));
            const votes = {};
            for (const dy of [0.8, 0.55, 1.0]) {
                const region = await crop(canvas, { left: ml.x0 - 40, top: ml.y0 + lh * dy, width: 420, height: lh * 2.5 });
                const t = (await recognizeLine(worker, region, ALNUM, '7')).toUpperCase().replace(/[^A-Z0-9]/g, '');
                if (t.length >= 8 && t.length <= 18) votes[t] = (votes[t] || 0) + 1;
            }
            const best = Object.keys(votes).sort((a, b) => votes[b] - votes[a])[0];
            if (best) merged.fields.motor = best;
        } catch (e) { console.warn('Relectura de motor omitida:', e); }
    }

    return { fields: merged.fields, warnings };
}

// ---------- Frente ----------

function parseFrontWords(rawWords) {
    const lines = groupLines(toWords(rawWords));
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
    const worker = await Tesseract.createWorker('eng');
    const found = { warnings: [] };
    try {
        if (frontFile) {
            onProgress('Leyendo frente...');
            const canvas = await preprocessImage(frontFile);
            await worker.setParameters({ tessedit_pageseg_mode: '11', tessedit_char_whitelist: '', preserve_interword_spaces: '1' });
            const { data } = await worker.recognize(canvas);
            Object.assign(found, parseFrontWords(data.words));
            canvas.width = canvas.height = 0;
        }
        if (backFile) {
            const canvas = await preprocessImage(backFile);
            const { fields, warnings } = await readBack(worker, canvas, cropCanvas, onProgress);
            Object.assign(found, fields);
            found.warnings.push(...warnings);
            canvas.width = canvas.height = 0;
        }
    } finally {
        await worker.terminate();
    }
    return found;
}

// Expuesto solo para pruebas en Node
export const __test = { parseBackWords, parseFrontWords, readBack };
