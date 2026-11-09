/**
 * Mecanic OS - Formato PDF "Elegante Ejecutivo" (jsPDF + autoTable).
 * Reproduce la plantilla HTML getEleganteEjecutivoHTML de views/presupuestos.js.
 */

const PX = 192 / 740;          // 1px de la plantilla -> mm (contenido de 740px = 192mm)
const PT = PX * 2.8346;        // 1px -> pt de fuente
const MX = 12;                 // margen lateral (mm)
const BOTTOM = 12;             // margen inferior (mm)

const C_BORDER = [226, 232, 240];
const C_TEXT = [51, 65, 85];
const C_LIGHT = [248, 250, 252];
const C_MUTED = [148, 163, 184];
const C_NOTES = [100, 116, 139];
const C_RED = [185, 28, 28];

export async function draw(doc, ctx, H) {
    const { ws = {}, budget = {}, client = {}, vehicle = {}, products = [], labor = [], subtotal = 0, iva = 0,
        retVal = 0, percVal = 0, grandTotal = 0, discount = 0, options = {} } = ctx;
    const { clean, money } = H;

    const mostrarIva = options.mostrarIva !== undefined ? options.mostrarIva : (ws && ws.mostrar_iva_presupuesto !== 'no');
    const taxRate = options.taxRate !== undefined ? options.taxRate : parseFloat(budget['% Impuesto'] !== undefined ? budget['% Impuesto'] : 0.13);

    const primary = H.hexToRgb(ws.color_presupuesto || '#0f172a', [15, 23, 42]);
    const accent = H.hexToRgb(ws.color_presupuesto || '#b45309', [180, 83, 9]);

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const CW = pageW - MX * 2;
    const limit = () => pageH - BOTTOM;

    let y = 10;

    const lhMm = (pt, f = 1.25) => pt * 0.3528 * f;
    const ensure = (h) => { if (y + h > limit()) { doc.addPage(); y = 10; } };

    // Dibuja (o mide con dry=true) "Etiqueta: valor" con ajuste de linea. Devuelve el alto en mm.
    function labelValue(x, yy, w, label, value, sizePx, lhFactor, dry) {
        const pt = sizePx * PT;
        const lh = lhMm(pt, lhFactor);
        doc.setFontSize(pt);
        doc.setFont('helvetica', 'bold');
        const lab = label + ' ';
        const labW = doc.getTextWidth(lab);
        doc.setFont('helvetica', 'normal');
        const words = clean(value).split(' ').filter(Boolean).map(w => w === '§' ? '  ' : w);
        const lines = [];
        let cur = '';
        let avail = w - labW;
        for (const wd of words) {
            const t = cur ? cur + ' ' + wd : wd;
            if (doc.getTextWidth(t) <= avail || !cur) { cur = t; }
            else { lines.push(cur); cur = wd; avail = w; }
        }
        lines.push(cur);
        if (!dry) {
            doc.setTextColor(...C_TEXT);
            doc.setFont('helvetica', 'bold');
            doc.text(lab, x, yy + lh * 0.78);
            doc.setFont('helvetica', 'normal');
            lines.forEach((ln, i) => {
                doc.text(ln, i === 0 ? x + labW : x, yy + lh * 0.78 + i * lh);
            });
        }
        return lines.length * lh;
    }

    // ---------- Encabezado ----------
    const gap = 15 * PX;
    const colW = [288 * PX, 244 * PX, 178 * PX];
    const colX = [MX, MX + colW[0] + gap, MX + colW[0] + colW[1] + gap * 2];

    const razon = (ws.nombre_comercial && ws.nombre_comercial !== ws.nombre) ? ws.nombre : '';
    const nitTxt = `${ws.num_documento || ws.nit || ''}`;
    const addr = (ws.direccion || '') + ((ws.municipio || ws.departamento || ws.pais)
        ? ', ' + [ws.municipio, ws.departamento, ws.pais].filter(Boolean).join(', ') : '');

    const col1 = [];
    if (razon) col1.push(['Razón Social:', razon]);
    col1.push(['NIT:', nitTxt + (ws.nrc ? ' § NRC: ' + ws.nrc : '')]);
    col1.push(['Giro:', ws.actividad_economica || ws.giro || 'Servicios Automotrices']);
    const col2 = [['Dirección:', addr], ['Teléfono:', ws.telefono || ''], ['Correo:', ws.correo || '']];

    const detPx = 11.52, detLh = 1.4;
    const titlePt = 20 * PT;
    const titleText = clean(ws.nombre_comercial || ws.nombre || '');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(titlePt);
    const titleLines = doc.splitTextToSize(titleText, colW[0]);
    const titleH = titleLines.length * lhMm(titlePt, 1.2) + 4 * PX;

    const h1 = titleH + col1.reduce((s, [l, v]) => s + labelValue(0, 0, colW[0], l, v, detPx, detLh, true), 0);
    const h2 = col2.reduce((s, [l, v]) => s + labelValue(0, 0, colW[1], l, v, detPx, detLh, true), 0);

    const logoImg = ws.logo ? await H.loadImage(ws.logo) : null;
    const logoBoxH = 90 * PX;
    let h3 = logoBoxH;
    let logoTextPt = 0, logoLines = [];
    if (!logoImg) {
        logoTextPt = 35.2 * PT;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(logoTextPt);
        let cur = '';
        for (const wd of clean(ws.logoText || 'MECANIC OS').split(' ')) {
            const t = cur ? cur + ' ' + wd : wd;
            if (doc.getTextWidth(t) <= colW[2] || !cur) cur = t; else { logoLines.push(cur); cur = wd; }
        }
        logoLines.push(cur);
        h3 = logoLines.length * lhMm(logoTextPt, 1.1);
    }
    const headH = Math.max(h1, h2, h3);
    const padB = 15 * PX;

    // columnas
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(titlePt);
    doc.setTextColor(...primary);
    titleLines.forEach((ln, i) => doc.text(ln, colX[0], y + lhMm(titlePt, 1.2) * (0.82 + i)));
    let yy = y + titleH;
    col1.forEach(([l, v]) => { yy += labelValue(colX[0], yy, colW[0], l, v, detPx, detLh, false); });
    yy = y;
    col2.forEach(([l, v]) => { yy += labelValue(colX[1], yy, colW[1], l, v, detPx, detLh, false); });

    if (logoImg) {
        H.addImageFit(doc, logoImg, colX[2], y + (headH - logoBoxH) / 2 * 0, colW[2], logoBoxH, 'right');
    } else {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(logoTextPt);
        doc.setTextColor(...primary);
        const llh = lhMm(logoTextPt, 1.1);
        logoLines.forEach((ln, i) => doc.text(ln, colX[2] + colW[2] / 2, y + (headH - logoLines.length * llh) / 2 + llh * (0.8 + i), { align: 'center' }));
    }

    y += headH + padB;
    doc.setDrawColor(...C_BORDER);
    doc.setLineWidth(PX);
    doc.line(MX, y, MX + CW, y);
    y += 14 * PX;

    // ---------- Fila de metadatos ----------
    const metaPadX = 25 * PX, metaPadY = 15 * PX;
    const fecha = new Date(budget.Fecha).toLocaleDateString('es-SV');
    const cond = (budget.Condicion || (client['Credito?'] === 'SI' ? 'CRÉDITO' : 'CONTADO')).toUpperCase();
    const metas = [
        ['PRESUPUESTO ID', String(budget['ID Presupuesto'] || ''), primary],
        ['FECHA EMISIÓN', fecha, primary],
        ['CONDICIÓN', cond, primary],
        ['TOTAL COTIZADO', money(grandTotal), accent]
    ];
    const lblPt = 11.2 * PT, valPt = 15.2 * PT;
    const metaH = metaPadY * 2 + lhMm(lblPt, 1.2) + 4 * PX + lhMm(valPt, 1.2);
    ensure(metaH + 25 * PX);
    doc.setFillColor(...C_LIGHT);
    doc.setDrawColor(...C_BORDER);
    doc.setLineWidth(PX);
    doc.roundedRect(MX, y, CW, metaH, 2.1, 2.1, 'FD');
    // space-between
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(valPt);
    const widths = metas.map(m => {
        doc.setFontSize(valPt); const a = doc.getTextWidth(m[1]);
        doc.setFontSize(lblPt); const b = doc.getTextWidth(m[0]) + m[0].length * 0.08 * lblPt * 0.3528;
        return Math.max(a, b);
    });
    const inner = CW - metaPadX * 2;
    const free = (inner - widths.reduce((a, b) => a + b, 0)) / (metas.length - 1);
    let mx = MX + metaPadX;
    metas.forEach((m, i) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(lblPt);
        doc.setTextColor(...C_MUTED);
        doc.text(m[0], mx, y + metaPadY + lhMm(lblPt, 1.2) * 0.8, { charSpace: 0.08 * lblPt * 0.3528 });
        doc.setFontSize(valPt);
        doc.setTextColor(...m[2]);
        doc.text(m[1], mx, y + metaPadY + lhMm(lblPt, 1.2) + 4 * PX + lhMm(valPt, 1.2) * 0.8);
        mx += widths[i] + free;
    });
    y += metaH + 16 * PX;

    // ---------- Tarjetas Cliente / Vehiculo ----------
    const cardGap = 20 * PX;
    const cardW = (CW - cardGap) / 2;
    const cPad = 15 * PX;
    const cardTitlePt = 13.6 * PT;
    const cInner = cardW - cPad * 2;
    const bodyPx = 11.52, bodyLh = 1.25, itemGap = 4 * PX;

    const nz = (v, d) => (v === undefined || v === null || v === '') ? d : v;
    const cliLines = [
        ['Nombre:', client.Nombre],
        ['Documento:', `${client['Tipo Doc'] || client.Tipo_Documento || 'DUI'}: ${client['Num Doc'] || client.Num_Documento || client.NIT || client.DUI || 'N/A'}`],
        ['Dirección:', client.Direccion || 'Dirección de cliente registrada'],
        ['Teléfono:', budget['Telefono 1 '] || client['Telefono 1 '] || 'N/A'],
        ['Email:', client.Correo || 'N/A']
    ];
    const vehLines = [
        null, // placa / año (linea doble)
        ['Marca / Modelo:', `${vehicle.Marca || 'N/A'} ${vehicle.Modelo || 'N/A'}`],
        ['VIN / Motor:', `${vehicle.Nª_VIN || 'N/A'} / ${vehicle.Nª_Motor || 'N/A'}`],
        ['Nº Equipo:', vehicle.N_Equipo || 'N/A'],
        ['Kilometraje / Odómetro:', `${budget.Kilometraje || vehicle.Odometro || '0'} km`],
        ['Fallas Reportadas:', budget.Fallas_Detectadas || 'Diagnóstico de taller']
    ];
    if (budget.Observaciones) vehLines.push(['Observaciones:', budget.Observaciones]);
    vehLines[0] = ['Placa:', `${vehicle.Placas || 'N/A'} § Año: ${vehicle.Año || 'N/A'}`];

    const bodyH = (lines) => lines.reduce((s, [l, v]) => s + labelValue(0, 0, cInner, l, String(nz(v, '')), bodyPx, bodyLh, true) + itemGap, 0);
    const titleBlock = lhMm(cardTitlePt, 1.2) + 5 * PX + 1.5 * PX + 10 * PX;
    const cardH = cPad * 2 + titleBlock + Math.max(bodyH(cliLines), bodyH(vehLines));
    ensure(cardH);

    const drawCard = (x, title, lines) => {
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(...C_BORDER);
        doc.setLineWidth(PX);
        doc.roundedRect(x, y, cardW, cardH, 2.1, 2.1, 'S');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(cardTitlePt);
        doc.setTextColor(...primary);
        const tl = lhMm(cardTitlePt, 1.2);
        doc.text(title.toUpperCase(), x + cardW / 2, y + cPad + tl * 0.8, { align: 'center', charSpace: 0.05 * cardTitlePt * 0.3528 });
        const ly = y + cPad + tl + 5 * PX;
        doc.setDrawColor(...accent);
        doc.setLineWidth(1.5 * PX);
        doc.line(x + cPad, ly, x + cardW - cPad, ly);
        let by = ly + 1.5 * PX + 10 * PX;
        lines.forEach(([l, v]) => { by += labelValue(x + cPad, by, cInner, l, String(nz(v, '')), bodyPx, bodyLh, false) + itemGap; });
    };
    drawCard(MX, 'Cliente', cliLines);
    drawCard(MX + cardW + cardGap, 'Vehículo', vehLines);
    y += cardH + 18 * PX;

    // ---------- Tablas ----------
    const secPt = 16 * PT;
    const secTitle = (t) => {
        const h = 12 * PX + lhMm(secPt, 1.2) + 10 * PX;
        // titulo + al menos cabecera y una fila
        ensure(h + 20);
        y += 12 * PX;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(secPt);
        doc.setTextColor(...primary);
        doc.text(t.toUpperCase(), MX, y + lhMm(secPt, 1.2) * 0.8, { charSpace: 0.05 * secPt * 0.3528 });
        y += lhMm(secPt, 1.2) + 10 * PX;
    };

    const padX = 8 * PX, padY = 6 * PX;
    const tblW = [0.08, 0.62, 0.15, 0.15].map(f => f * CW);
    const bodyPt = 11.52 * PT, headPt = 10.88 * PT;

    const lineOf = (it) => {
        const unit = it.unitPrice !== undefined ? it.unitPrice : parseFloat(it.PrecioUnitario || 0);
        const qty = parseInt(it.Cantidad || 1);
        const tot = it.effectiveLineTotal !== undefined ? it.effectiveLineTotal : (it.rawLineTotal !== undefined ? it.rawLineTotal : (unit * qty));
        return [String(qty), clean(it.Descripcion || it.description || ''), money(unit), money(tot)];
    };

    const makeTable = (title, descHead, rows, emptyMsg) => {
        secTitle(title);
        const body = rows.length === 0
            ? [[{ content: emptyMsg, colSpan: 4, styles: { halign: 'center', fontStyle: 'italic', textColor: C_MUTED, cellPadding: 12 * PX } }]]
            : rows.map(r => [
                { content: r[0], styles: { halign: 'center', fontStyle: 'bold' } },
                r[1],
                { content: r[2], styles: { halign: 'right' } },
                { content: r[3], styles: { halign: 'right', fontStyle: 'bold' } }
            ]);
        const end = H.autoTable(doc, {
            startY: y,
            margin: { left: MX, right: MX, bottom: BOTTOM },
            head: [[
                { content: 'CANT', styles: { halign: 'center' } },
                descHead.toUpperCase(),
                { content: 'P. UNITARIO', styles: { halign: 'right' } },
                { content: 'TOTAL', styles: { halign: 'right' } }
            ]],
            body,
            theme: 'plain',
            showHead: 'everyPage',
            styles: { font: 'helvetica', fontSize: bodyPt, textColor: C_TEXT, cellPadding: { top: padY, bottom: padY, left: padX, right: padX }, lineWidth: 0, overflow: 'linebreak', valign: 'middle' },
            headStyles: { fontSize: headPt, fontStyle: 'bold', textColor: primary, fillColor: false, halign: 'left' },
            columnStyles: { 0: { cellWidth: tblW[0] }, 1: { cellWidth: tblW[1] }, 2: { cellWidth: tblW[2] }, 3: { cellWidth: tblW[3] } },
            didDrawCell: (d) => {
                const { x, y: cy, width, height } = d.cell;
                if (d.section === 'head') {
                    doc.setDrawColor(...primary);
                    doc.setLineWidth(2 * PX);
                    doc.line(x, cy + height, x + width, cy + height);
                } else if (d.section === 'body') {
                    doc.setDrawColor(...C_BORDER);
                    doc.setLineWidth(PX);
                    doc.line(x, cy + height, x + width, cy + height);
                }
            }
        });
        y = end + 10 * PX;
    };

    makeTable('Repuestos y Lubricantes', 'Descripción del Item', products.map(lineOf), 'Sin repuestos ni lubricantes cotizados');
    makeTable('Mano de Obra y Servicios', 'Descripción del Servicio', labor.map(lineOf), 'Sin mano de obra cotizada');

    const rc = budget.Repuestos_Cliente;
    if (rc && rc.length > 0) {
        makeTable('Solicitud de Repuestos', 'Descripción del Item',
            rc.map(r => [String(r.Cantidad), clean(r.Descripcion), '-', '-']), '');
    }

    // ---------- Totales ----------
    const rows = [['Subtotal', money(subtotal), null]];
    if (discount > 0) {
        rows.push(['(-) Descuento', '- ' + money(discount), C_RED]);
        rows.push(['Subtotal Neto', money(subtotal - discount), 'bold']);
    }
    if (mostrarIva) rows.push([`(+) IVA (${(taxRate * 100).toFixed(0)}%)`, money(iva), null]);
    if (percVal > 0) rows.push(['(+) IVA Percibido', money(percVal), null]);
    if (retVal > 0) rows.push(['(-) IVA Retenido', money(retVal), null]);
    rows.push(['Total a Pagar', money(grandTotal), 'grand']);

    const totW = 320 * PX;
    const totPadX = 8 * PX, totPadY = 5 * PX;
    const rowH = (pt) => lhMm(pt, 1.2) + totPadY * 2 + PX;
    const totH = rows.reduce((s, r) => s + rowH(r[2] === 'grand' ? 15.2 * PT : bodyPt), 0);
    y += 5 * PX;
    ensure(totH + 4);
    const tx = MX + CW - totW;
    rows.forEach(([lab, val, st]) => {
        const grand = st === 'grand';
        const pt = grand ? 15.2 * PT : bodyPt;
        const h = rowH(pt);
        if (grand) {
            doc.setFillColor(...C_LIGHT);
            doc.rect(tx, y, totW, h, 'F');
            doc.setDrawColor(...accent);
            doc.setLineWidth(2 * PX);
            doc.line(tx, y, tx + totW, y);
            doc.line(tx, y + h, tx + totW, y + h);
        } else {
            doc.setDrawColor(...C_BORDER);
            doc.setLineWidth(PX);
            doc.line(tx, y + h, tx + totW, y + h);
        }
        const ty = y + h / 2 + pt * 0.3528 * 0.33;
        doc.setFontSize(pt);
        doc.setFont('helvetica', (grand || true) ? 'bold' : 'normal');
        doc.setTextColor(...primary);
        doc.text(lab, tx + totPadX, ty);
        doc.setFont('helvetica', grand || st === 'bold' ? 'bold' : 'normal');
        doc.setTextColor(...(st && st.length === 3 ? st : (grand ? primary : C_TEXT)));
        doc.text(val, tx + totW - totPadX, ty, { align: 'right' });
        y += h;
    });
    y += 14 * PX;

    // ---------- Notas ----------
    const notePt = 12 * PT;
    const noteLh = lhMm(notePt, 1.4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(notePt);
    const noteText = 'Este presupuesto es válido por un período de 15 días a partir de su emisión. Los trabajos adicionales no contemplados en este documento serán consultados previamente con el cliente.';
    const noteLines = doc.splitTextToSize(noteText, CW);
    const noteH = 15 * PX + noteLh * (1 + noteLines.length);
    ensure(noteH);
    doc.setDrawColor(...C_BORDER);
    doc.setLineWidth(PX);
    doc.line(MX, y, MX + CW, y);
    let ny = y + 15 * PX;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C_NOTES);
    doc.text('Observaciones Generales:', MX, ny + noteLh * 0.75);
    doc.setFont('helvetica', 'normal');
    noteLines.forEach((ln, i) => doc.text(ln, MX, ny + noteLh * (1.75 + i)));

    if (doc.getNumberOfPages() > 1) H.pageNumbers(doc, { y: pageH - 7 });
}
