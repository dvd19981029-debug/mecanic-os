/**
 * Mecanic OS - Formato PDF "clasico_mecanicos" (Orden de Trabajo) en jsPDF.
 * Replica la plantilla HTML getClasicoMecanicOSHTML de views/presupuestos.js.
 */
export async function draw(doc, ctx, H) {
    const { ws = {}, budget = {}, client = {}, vehicle = {}, products = [], labor = [], subtotal, iva, retVal, percVal, grandTotal, sumProd, sumLab } = ctx;
    const discount = ctx.discount || 0;
    const options = ctx.options || {};
    const mostrarIva = options.mostrarIva !== undefined ? options.mostrarIva : (ws && ws.mostrar_iva_presupuesto !== 'no');
    const taxRate = options.taxRate !== undefined ? options.taxRate : parseFloat(budget['% Impuesto'] !== undefined ? budget['% Impuesto'] : 0.13);

    const PRIMARY = H.hexToRgb(ws.color_presupuesto || '#1e293b');
    const BORDER = [176, 184, 192];
    const BG_LABEL = [220, 226, 230];
    const TXT = [30, 41, 59];
    const WHITE = [255, 255, 255];
    const M = 12;
    const PW = doc.internal.pageSize.getWidth();
    const PH = doc.internal.pageSize.getHeight();
    const CW = PW - M * 2;
    const money = H.money;
    const c = H.clean;
    const num = (v) => Number(v || 0);

    // ---------- Encabezado ----------
    let y = M;
    const logoW = 57, logoH = 23;
    const logoX = PW - M - logoW;
    const leftW = Math.min(130, logoX - M - 4);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.setTextColor(...PRIMARY);
    const title = c(ws.nombre_comercial || ws.nombre);
    const titleLines = doc.splitTextToSize(title, leftW);
    doc.text(titleLines, M, y + 5.5);
    y += 5.5 + (titleLines.length - 1) * 7 + 3.5;

    const info = [];
    if (ws.nombre_comercial && ws.nombre_comercial !== ws.nombre) info.push(`Razón Social: ${c(ws.nombre)}`);
    const geo = [ws.municipio, ws.departamento, ws.pais].filter(Boolean).join(', ');
    info.push(`Dirección: ${c(ws.direccion || '')}${geo ? ', ' + c(geo) : ''}`);
    info.push(`Tel: ${c(ws.telefono || '')} | Correo: ${c(ws.correo || '')}`);
    info.push(`${ws.tipo_documento || 'NIT'}: ${c(ws.num_documento || ws.nit || '')} ${ws.nrc ? ` | NRC: ${c(ws.nrc)}` : ''}`.trim());
    info.push(`Giro: ${c(ws.actividad_economica || ws.giro || 'Servicios Automotrices')}`);
    doc.setFontSize(9.2);
    let iy = y + 1.5;
    const lh = 4.7;
    info.forEach((line, i) => {
        const wrapped = doc.splitTextToSize(line, leftW);
        wrapped.forEach((w) => {
            if (i === 2 && w.includes('Correo:')) {
                const idx = w.indexOf('Correo:');
                const pre = w.slice(0, idx);
                const mail = w.slice(idx + 8);
                doc.setFont('helvetica', 'normal'); doc.setTextColor(51, 65, 85);
                doc.text(pre + 'Correo: ', M, iy);
                const px = M + doc.getTextWidth(pre + 'Correo:') + 1.2;
                doc.setFont('helvetica', 'bold'); doc.setTextColor(11, 94, 215);
                doc.text(mail, px, iy);
            } else {
                doc.setFont('helvetica', 'normal'); doc.setTextColor(51, 65, 85);
                doc.text(w, M, iy);
            }
            iy += lh;
        });
    });
    const leftEnd = iy;

    // Logo
    const logoImg = ws.logo ? await H.loadImage(ws.logo) : null;
    if (logoImg) {
        H.addImageFit(doc, logoImg, logoX, M, logoW, logoH, 'center');
    } else {
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(...BORDER);
        doc.setLineWidth(0.3);
        doc.roundedRect(logoX, M, logoW, logoH, 2, 2, 'FD');
        doc.setDrawColor(100, 116, 139);
        doc.setLineWidth(0.2);
        doc.setLineDashPattern([0.5, 0.5], 0);
        doc.line(logoX + 2.5, M + logoH - 4.5, logoX + logoW - 2.5, M + logoH - 4.5);
        doc.line(logoX + 2.5, M + logoH - 3.4, logoX + logoW - 2.5, M + logoH - 3.4);
        doc.setLineDashPattern([], 0);
        // Carros simplificados (escala del SVG original: 1px = 0.26mm)
        const cx = logoX + 3.6, cy = M + 5.9;
        doc.setFillColor(100, 116, 139);
        doc.roundedRect(cx, cy + 1.2, 2.6, 2.4, 0.5, 0.5, 'F');
        doc.setFillColor(30, 41, 59);
        doc.roundedRect(cx + 2.3, cy, 3.4, 3.7, 0.6, 0.6, 'F');
        doc.setFillColor(248, 250, 252);
        doc.rect(cx + 3.1, cy + 0.6, 0.9, 1.1, 'F');
        doc.rect(cx + 4.3, cy + 0.6, 0.9, 1.1, 'F');
        doc.setFillColor(30, 41, 59);
        [[cx + 0.9, cy + 3.7], [cx + 2.1, cy + 3.7], [cx + 3.2, cy + 3.9], [cx + 4.8, cy + 3.9]].forEach(([x, yy]) => doc.circle(x, yy, 0.45, 'F'));
        const tx = logoX + 19.7;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
        doc.text(c(ws.logoText || 'TALLER'), tx, M + 6.2);
        doc.setFontSize(6.6);
        doc.setTextColor(100, 116, 139);
        const sa = /c\.v\./i.test(ws.nombre || '') ? 'S.A. DE C.V.' : '';
        if (sa) doc.text(sa, tx, M + 9.6);
        doc.setFontSize(4.4);
        doc.setTextColor(30, 41, 59);
        doc.text(c((ws.logoTagline || '')).toUpperCase(), tx, M + 14.3);
        doc.setFontSize(4);
        doc.setTextColor(100, 116, 139);
        doc.text(c((ws.giro || '').substring(0, 50)).toUpperCase(), tx, M + 16.9);
    }

    y = Math.max(leftEnd, M + logoH) + 2;

    // Titulo del documento
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(13);
    doc.setTextColor(100, 116, 139);
    doc.setCharSpace(0.3);
    const dtW = doc.getTextWidth('ORDEN DE TRABAJO') + 0.3 * 16;
    doc.text('ORDEN DE TRABAJO', PW - M - dtW + 0.3, y + 5);
    doc.setCharSpace(0);
    y += 10;

    // ---------- Tabla meta ----------
    const fecha = (v) => { const d = new Date(v); return isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-SV'); };
    const fechaProm = budget['Fecha Prometida'] ? fecha(budget['Fecha Prometida']) : fecha(budget.Fecha + 5 * 24 * 60 * 60 * 1000);
    const v = (x) => c(x == null || x === '' ? 'N/A' : x);
    const lbl = (t) => ({ content: t, styles: { fillColor: BG_LABEL, fontStyle: 'bold', halign: 'center', fontSize: 8.5, textColor: TXT } });
    const val = (t) => ({ content: t, styles: { fillColor: WHITE, textColor: [15, 23, 42], fontSize: 9.5 } });
    const metaRows = [
        [lbl('CLIENTE'), val(c(budget.Nombre)), lbl('PLACA'), val(v(vehicle.Placas))],
        [lbl('TELÉFONO'), val(v(budget['Telefono 1 '] || client['Telefono 1 '])), lbl('CONDICIÓN'), val(c(budget.Condicion || (client['Credito?'] === 'SI' ? 'CREDITO' : 'CONTADO')))],
        [lbl('FECHA INGRESO'), val(fecha(budget.Fecha)), lbl('FECHA PROMETIDA'), val(fechaProm)],
        [lbl('V I N'), val(v(vehicle['Nª_VIN'])), lbl('MARCA'), val(v(vehicle.Marca))],
        [lbl('ODÓMETRO'), val(c(budget.Kilometraje || vehicle.Odometro || '0')), lbl('MODELO'), val(v(vehicle.Modelo))],
        [lbl('MOTOR'), val(v(vehicle['Nª_Motor'])), lbl('AÑO'), val(v(vehicle['Año']))],
        [lbl('Nº EQUIPO'), val(v(vehicle.N_Equipo)), lbl(''), val('')]
    ];
    const baseTable = {
        theme: 'grid',
        margin: { left: M, right: M, top: M, bottom: M + 6 },
        styles: { font: 'helvetica', fontSize: 9.5, cellPadding: { top: 1.7, bottom: 1.7, left: 2.6, right: 2.6 }, lineColor: BORDER, lineWidth: 0.2, textColor: TXT, valign: 'middle' }
    };
    y = H.autoTable(doc, {
        ...baseTable,
        startY: y,
        body: metaRows,
        columnStyles: { 0: { cellWidth: CW * 0.18 }, 1: { cellWidth: CW * 0.32 }, 2: { cellWidth: CW * 0.18 }, 3: { cellWidth: CW * 0.32 } }
    }) + 5;

    // ---------- Barras de seccion ----------
    const sectionBox = (titleTxt, text, gap) => {
        y = H.autoTable(doc, {
            ...baseTable,
            startY: y,
            head: [[{ content: titleTxt.toUpperCase(), styles: { fillColor: PRIMARY, textColor: WHITE, fontStyle: 'bold', halign: 'center', fontSize: 9.5, cellPadding: 2 } }]],
            body: [[{ content: c(text), styles: { fillColor: WHITE, textColor: TXT, fontSize: 9.5, cellPadding: { top: 3, bottom: 3, left: 4, right: 4 }, minCellHeight: 11 } }]],
            showHead: 'everyPage'
        }) + gap;
    };
    sectionBox('Fallas Detectadas', budget.Fallas_Detectadas || budget['Fallas Detectadas'] || 'Diagnóstico general de taller', 6.5);
    if (budget.Observaciones) {
        y -= 6.5 - 2.6;
        sectionBox('Observaciones / Recomendaciones', budget.Observaciones, 6.5);
    }
    y -= 6.5 - 5; // las tablas de datos van con 5mm de separacion

    // ---------- Tablas de datos ----------
    const colStyles = {
        0: { cellWidth: CW * 0.08, halign: 'center' },
        1: { cellWidth: CW * 0.62 },
        2: { cellWidth: CW * 0.15, halign: 'right' },
        3: { cellWidth: CW * 0.15, halign: 'right' }
    };
    const headCell = (t, align) => ({ content: t.toUpperCase(), styles: { fillColor: PRIMARY, textColor: WHITE, fontStyle: 'bold', halign: align || 'center', fontSize: 9 } });
    const notes = new Map();

    const dataTable = (headTitle, items, emptyMsg, totalLabel, totalVal) => {
        if (y > PH - M - 38) { doc.addPage(); y = M; }
        const body = [];
        if (!items.length) {
            body.push([{ content: emptyMsg, colSpan: 4, styles: { halign: 'center', textColor: [100, 116, 139], cellPadding: 3.2 } }]);
        } else {
            items.forEach((p) => {
                const unitPrice = p.unitPrice !== undefined ? p.unitPrice : parseFloat(p.PrecioUnitario || 0);
                const lineTotal = p.rawLineTotal !== undefined ? p.rawLineTotal : (unitPrice * parseInt(p.Cantidad || 1));
                const hasNote = p.discountAmount > 0 && p.effectiveLineTotal !== undefined;
                const note = hasNote ? `(Desc: -$${num(p.discountAmount).toFixed(2)} -> Neto: $${num(p.effectiveLineTotal).toFixed(2)})` : '';
                const row = [
                    { content: String(p.Cantidad) },
                    { content: c(p.Descripcion || p.description || ''), _note: note },
                    { content: money(unitPrice) },
                    { content: money(lineTotal) }
                ];
                body.push(row);
            });
        }
        body.push([
            { content: totalLabel, colSpan: 3, styles: { fillColor: PRIMARY, textColor: WHITE, fontStyle: 'bold', fontSize: 9 } },
            { content: money(totalVal), styles: { fillColor: PRIMARY, textColor: WHITE, fontStyle: 'bold', halign: 'right', fontSize: 9 } }
        ]);
        y = H.autoTable(doc, {
            ...baseTable,
            startY: y,
            head: [[headCell('Cant'), headCell(headTitle), headCell('P. Unitario'), headCell('Total ($)')]],
            body,
            showHead: 'everyPage',
            styles: { ...baseTable.styles, fontSize: 9, cellPadding: { top: 1.8, bottom: 1.8, left: 2.6, right: 2.6 } },
            columnStyles: colStyles,
            rowPageBreak: 'avoid',
            didParseCell: (d) => {
                if (d.section !== 'body') return;
                const raw = d.cell.raw;
                if (raw && raw._note && d.column.index === 1) {
                    // reservar una linea extra para la nota de descuento
                    d.cell.text = d.cell.text.concat(['']);
                    notes.set(d.cell, raw._note);
                }
            },
            didDrawCell: (d) => {
                const note = notes.get(d.cell);
                if (!note) return;
                const lines = d.cell.text.length;
                const lineH = (d.cell.styles.fontSize * (doc.getLineHeightFactor ? doc.getLineHeightFactor() : 1.15)) / doc.internal.scaleFactor;
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8.5);
                doc.setTextColor(22, 163, 74);
                doc.text(note, d.cell.x + d.cell.padding('left'), d.cell.y + d.cell.padding('top') + (lines - 1) * lineH, { baseline: 'top' });
            }
        }) + 5;
    };

    dataTable('Descripción Repuestos y Lubricantes', products, 'No se cotizan repuestos y lubricantes', 'Total Repuestos y Lubricantes', sumProd);
    dataTable('Descripción Mano de Obra', labor, 'No se cotiza mano de obra', 'Total Mano de obra', sumLab);

    // ---------- Solicitud de Repuestos (cliente) ----------
    const rcs = budget.Repuestos_Cliente;
    if (rcs && rcs.length > 0) {
        y = H.autoTable(doc, {
            ...baseTable,
            startY: y,
            head: [[headCell('Cant'), headCell('Solicitud de Repuestos'), headCell('P. Unitario'), headCell('Total ($)')]],
            body: rcs.map((rc) => [String(rc.Cantidad), c(rc.Descripcion), '-', '-']),
            showHead: 'everyPage',
            styles: { ...baseTable.styles, fontSize: 9, cellPadding: { top: 1.8, bottom: 1.8, left: 2.6, right: 2.6 } },
            columnStyles: colStyles
        }) + 5;
    }

    // ---------- Bloque inferior: autorizacion + totales ----------
    const rows = [];
    const tl = (t, extra) => ({ content: t.toUpperCase(), styles: { fillColor: BG_LABEL, fontStyle: 'bold', halign: 'center', fontSize: 8.5, textColor: [15, 23, 42], ...(extra || {}) } });
    const tv = (t, extra) => ({ content: t, styles: { halign: 'right', fontSize: 9.5, textColor: TXT, fillColor: WHITE, ...(extra || {}) } });
    rows.push([tl('Sumas'), tv(money(subtotal))]);
    if (discount > 0) {
        rows.push([tl('(-) Descuento'), tv('- ' + money(discount), { textColor: [185, 28, 28] })]);
        rows.push([tl('Subtotal Neto'), tv(money(subtotal - discount), { fontStyle: 'bold' })]);
    }
    if (mostrarIva) rows.push([tl(`IVA (${(taxRate * 100).toFixed(0)}%)`), tv(money(iva))]);
    if (percVal > 0) rows.push([tl('(+) IVA Percibido'), tv(money(percVal))]);
    if (retVal > 0) rows.push([tl('(-) IVA Retenido'), tv(money(retVal))]);
    rows.push([tl('Total a Pagar', { fillColor: PRIMARY, textColor: WHITE, fontSize: 8.5 }), tv(money(grandTotal), { fontStyle: 'bold', fontSize: 11 })]);

    const totW = CW * 0.4;
    const rowH = 8;
    const blockH = Math.max(rows.length * rowH + 2, 31);
    y += 1.5; // margin-top 25px (los 5mm previos ya cuentan)
    if (y + blockH > PH - M - 6) { doc.addPage(); y = M; }

    // Caja de autorizacion
    const boxW = CW * 0.55;
    const boxH = 31;
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.4);
    doc.setFillColor(...WHITE);
    doc.roundedRect(M, y, boxW, boxH, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.setCharSpace(0.3);
    doc.text('TRABAJOS AUTORIZADOS POR:', M + 4, y + 8);
    doc.setCharSpace(0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    doc.text(doc.splitTextToSize(c(budget.Nombre), boxW - 8).slice(0, 2), M + 4, y + 16);
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.4);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(M + 4, y + 25, M + 4 + (boxW - 8) * 0.8, y + 25);
    doc.setLineDashPattern([], 0);

    // Totales
    H.autoTable(doc, {
        ...baseTable,
        startY: y,
        margin: { left: PW - M - totW, right: M, top: M, bottom: M },
        tableWidth: totW,
        body: rows,
        pageBreak: 'avoid',
        styles: { ...baseTable.styles, cellPadding: { top: 2.4, bottom: 2.4, left: 2.6, right: 2.6 } },
        columnStyles: { 0: { cellWidth: totW * 0.5 }, 1: { cellWidth: totW * 0.5 } }
    });
}
