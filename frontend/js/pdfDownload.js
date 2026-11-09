/**
 * Mecanic OS - Descarga de PDF generado en el navegador (sin cuadro de impresion).
 * Se usa en Safari de escritorio, donde "Guardar como PDF" desde la vista previa dejaba la pagina en blanco.
 */

const HTML2CANVAS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
const JSPDF_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';

export function isSafariDesktop() {
    const ua = navigator.userAgent || '';
    return /Safari/i.test(ua) && !/Chrome|Chromium|CriOS|FxiOS|Edg|OPR|Android|iPhone|iPad|iPod/i.test(ua);
}

function loadScript(src, globalName) {
    if (window[globalName]) return Promise.resolve(window[globalName]);
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => (window[globalName] ? resolve(window[globalName]) : reject(new Error('No se pudo cargar ' + globalName)));
        s.onerror = () => reject(new Error('No se pudo cargar el generador de PDF (revisa tu conexion a internet)'));
        document.head.appendChild(s);
    });
}

/**
 * Renderiza el HTML completo en un iframe oculto y lo descarga como archivo .pdf (tamano carta, varias paginas si hace falta).
 */
export async function downloadHtmlAsPdf(html, fileName) {
    const html2canvas = await loadScript(HTML2CANVAS_URL, 'html2canvas');
    await loadScript(JSPDF_URL, 'jspdf');
    const { jsPDF } = window.jspdf;

    const printCss = '<style>.no-print-toolbar{display:none!important;} html,body{background:#ffffff!important;margin:0!important;padding:0!important;} .page-container{box-shadow:none!important;margin:0 auto!important;border-radius:0!important;}</style>';
    const finalHtml = html.includes('</head>') ? html.replace('</head>', printCss + '</head>') : (printCss + html);

    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText = 'position:fixed;left:-10000px;top:0;width:900px;height:1200px;border:0;visibility:hidden;';
    document.body.appendChild(iframe);

    try {
        await new Promise((resolve) => {
            iframe.onload = resolve;
            iframe.srcdoc = finalHtml;
        });
        const idoc = iframe.contentDocument;
        try { await idoc.fonts.ready; } catch (e) {}
        await new Promise(r => setTimeout(r, 600));

        const target = idoc.querySelector('.page-container') || idoc.body;
        const canvas = await html2canvas(target, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            windowWidth: 900,
            logging: false
        });

        const pdf = new jsPDF({ unit: 'mm', format: 'letter', orientation: 'portrait' });
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const margin = 8;
        const imgW = pageW - margin * 2;
        const pxPerMm = canvas.width / imgW;
        const sliceH = Math.floor((pageH - margin * 2) * pxPerMm);

        let y = 0;
        let first = true;
        while (y < canvas.height) {
            const h = Math.min(sliceH, canvas.height - y);
            const slice = document.createElement('canvas');
            slice.width = canvas.width;
            slice.height = h;
            const ctx = slice.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, slice.width, slice.height);
            ctx.drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);
            if (!first) pdf.addPage();
            pdf.addImage(slice.toDataURL('image/jpeg', 0.95), 'JPEG', margin, margin, imgW, h / pxPerMm);
            first = false;
            y += h;
        }

        pdf.save(fileName.replace(/\.pdf$/i, '') + '.pdf');
    } finally {
        iframe.remove();
    }
}
