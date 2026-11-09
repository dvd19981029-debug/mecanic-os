/**
 * Formato "compacto_orden" en jsPDF. Reproduce getCompactoOrdenHTML (views/presupuestos.js).
 */
export async function draw(doc, ctx, H) {
    const { ws = {}, budget = {}, client = {}, vehicle = {}, products = [], labor = [], subtotal = 0, iva = 0,
        retVal = 0, percVal = 0, grandTotal = 0, discount = 0 } = ctx;
    const opts = (typeof ctx.options === 'object' && ctx.options) ? ctx.options : {};
    const c = H.clean;
    const taxRate = opts.taxRate !== undefined ? opts.taxRate : parseFloat(budget['% Impuesto'] !== undefined ? budget['% Impuesto'] : 0.13);
    const mostrarIva = opts.mostrarIva !== undefined ? opts.mostrarIva : (ws.mostrar_iva_presupuesto !== 'no');
    const preciosConIva = opts.preciosConIva !== undefined ? opts.preciosConIva : (ws.features && ws.features.precios_con_iva === true);
    const factorIva = opts.factorIva || ((mostrarIva && preciosConIva) ? (1 + taxRate) : 1);

    let db = { tecnicos: [], promociones: [] };
    try { if (typeof getDatabase === 'function') db = getDatabase() || db; } catch (e) { /* sin db */ }
    const tech = ctx.techName ? { Nombre_Completo: ctx.techName } : ((db.tecnicos || []).find(t => t.Tecnico_ID === budget.Tecnico_Asignado) || { Nombre_Completo: 'Sin Asignar' });
    const advisor = ctx.advisorName ? { Nombre_Completo: ctx.advisorName } : ((db.tecnicos || []).find(t => t.Tecnico_ID === budget.Asesor_Asignado) || { Nombre_Completo: 'Sin Asignar' });

    // Descuento por promocion / proporcional (igual que la plantilla)
    const promo = (db.promociones || []).find(p => p.ID_Promocion === budget.ID_Promocion);
    let prodPct = 0, laborPct = 0, isProportional = true;
    if (promo) {
        if (promo.Tipo === 'desc_mano_obra') { laborPct = parseFloat(promo.Valor || 0) / 100; isProportional = false; }
        else if (promo.Tipo === 'desc_productos') { prodPct = parseFloat(promo.Valor || 0) / 100; isProportional = false; }
    }
    const rawTotal = (opts.rawSubtotal !== undefined && opts.rawSubtotal !== null) ? opts.rawSubtotal : ((ctx.sumProd || 0) + (ctx.sumLab || 0));
    const originalDiscount = opts.originalDiscount || 0;
    const activeDiscount = (mostrarIva && preciosConIva) ? discount : (originalDiscount > 0 ? originalDiscount : discount);
    if (isProportional) {
        const p = rawTotal > 0 ? activeDiscount / rawTotal : 0;
        prodPct = p; laborPct = p;
    }

    const lineCalc = (it, pct) => {
        const unit = it.unitPrice !== undefined ? it.unitPrice : (parseFloat(it.PrecioUnitario || 0) / factorIva);
        const qty = parseInt(it.Cantidad || 1);
        let tot;
        if (it.effectiveLineTotal !== undefined) tot = it.effectiveLineTotal;
        else {
            const base = (parseFloat(it.PrecioUnitario || 0) * qty) - parseFloat(it.Descuento || 0);
            tot = (base - base * pct) / factorIva;
        }
        return { unit, qty, tot };
    };

    const W = doc.internal.pageSize.getWidth();
    const PH = doc.internal.pageSize.getHeight();
    const mx = 14, top = 12, cw = W - mx * 2;
    const PRIMARY = [15, 23, 42], TEXT = [30, 41, 59], MUTED = [71, 85, 105];
    const f2 = n => Number(n || 0).toFixed(2);
    const fecha = budget.Fecha ? new Date(budget.Fecha).toLocaleDateString('es-SV', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
    const nombreWs = c(ws.nombre_comercial || ws.nombre || ws.alias || 'Centro de Servicio Automotriz');

    const logo = ws.logo ? await H.loadImage(ws.logo) : null;

    const txt = (s, x, y, o) => doc.text(String(s), x, y, o);
    const setF = (style, size, color) => { doc.setFont('helvetica', style); doc.setFontSize(size); doc.setTextColor(...color); };
    const wrap = (s, w) => doc.splitTextToSize(String(s), w);

    // ---------- Titulo ----------
    let y = top + 4;
    setF('bold', 12, TEXT);
    txt('PRESUPUESTO / ORDEN DE TRABAJO', mx, y);
    y += 4.8;
    setF('bold', 9, MUTED);
    txt(`# ${c(budget['ID Presupuesto'])} | ${fecha}`, mx, y);

    // ---------- Fila de informacion ----------
    const colL = mx, wL = cw * 0.35;
    const wC = cw * 0.35, colC = mx + cw * 0.5 - wC / 2;
    const wR = cw * 0.30, colR = mx + cw;
    let yTop = y + 3;

    // izquierda: cliente
    let yl = yTop + 1;
    setF('bold', 9, TEXT);
    wrap(c(client.Nombre), wL).forEach(l => { txt(l, colL, yl + 1); yl += 4; });
    yl += 0.3;
    const kv = (label, val, x, yy, w, align) => {
        const lines = wrap(`${label} ${val}`, w);
        lines.forEach((ln, i) => {
            if (align === 'right') {
                if (i === 0) {
                    setF('normal', 8.25, TEXT);
                    const vw = doc.getTextWidth(ln.slice(label.length));
                    txt(ln.slice(label.length), x, yy, { align: 'right' });
                    setF('bold', 8.25, TEXT);
                    txt(label, x - vw, yy, { align: 'right' });
                } else { setF('normal', 8.25, TEXT); txt(ln, x, yy, { align: 'right' }); }
            } else if (i === 0) {
                setF('bold', 8.25, TEXT); txt(label, x, yy);
                const lw = doc.getTextWidth(label + ' ');
                setF('normal', 8.25, TEXT); txt(ln.slice(label.length + 1), x + lw, yy);
            } else { setF('normal', 8.25, TEXT); txt(ln, x, yy); }
            yy += 3.6;
        });
        return yy;
    };
    yl = kv('Documento:', c(client['Num Doc'] || client.Num_Documento || client.NIT || client.DUI || 'N/A'), colL, yl, wL);
    yl = kv('Teléfono:', c(client['Telefono 1 '] || client.Telefono || 'N/A'), colL, yl, wL);
    yl = kv('Dirección:', c(client.Direccion || 'N/A'), colL, yl, wL);
    yl = kv('Número de Orden:', c(budget.Orden_Compra || 'N/A'), colL, yl, wL);

    // centro: logo + taller
    let yc = top + 6;
    const cx = colC + wC / 2;
    if (logo) {
        H.addImageFit(doc, logo, colC + (wC - 63) / 2, yc, 63, 22);
        yc += 24;
        setF('bold', 8.25, PRIMARY);
        wrap(nombreWs, wC).forEach(l => { txt(l, cx, yc + 2, { align: 'center' }); yc += 3.6; });
        yc += 1.5;
    } else {
        setF('bold', 9.75, PRIMARY);
        wrap(nombreWs, wC).forEach(l => { txt(l, cx, yc + 3, { align: 'center' }); yc += 4.2; });
        yc += 1.5;
    }
    setF('normal', 7.5, MUTED);
    const cLines = [];
    if (ws.direccion) wrap(c(ws.direccion), wC).forEach(l => cLines.push(l));
    cLines.push(`Tel: ${c(ws.telefono || '')}`);
    if (ws.correo) cLines.push(`Email: ${c(ws.correo)}`);
    cLines.forEach(l => { txt(l, cx, yc + 2, { align: 'center' }); yc += 3.3; });

    // derecha: vehiculo
    let yr = yTop + 1;
    setF('bold', 9, TEXT);
    const vTitle = `${vehicle.Marca || 'N/A'} ${vehicle.Modelo || ''} ${vehicle.Año ? '(' + vehicle.Año + ')' : ''}`.replace(/\s+/g, ' ').trim();
    wrap(c(vTitle), wR).forEach(l => { txt(l, colR, yr + 1, { align: 'right' }); yr += 4; });
    yr += 0.3;
    yr = kv('Placas:', c(vehicle.Placas || 'N/A'), colR, yr, wR, 'right');
    if (vehicle.Color) yr = kv('Color:', c(vehicle.Color), colR, yr, wR, 'right');
    if (vehicle.N_Equipo) yr = kv('N° Equipo:', c(vehicle.N_Equipo), colR, yr, wR, 'right');
    if (budget.Kilometraje) yr = kv('Kilometraje:', c(budget.Kilometraje), colR, yr, wR, 'right');

    y = Math.max(yl, yc, yr) + 1.5;
    doc.setDrawColor(148, 163, 184); doc.setLineWidth(0.26);
    doc.line(mx, y, mx + cw, y);
    y += 2.5;

    // ---------- Tabla de items ----------
    const body = [], kinds = [];
    const catHeader = t => { body.push([{ content: t, colSpan: 4, styles: { fontStyle: 'bold' } }]); kinds.push('cat'); };
    const catTotal = (label, v) => {
        body.push([{ content: label, colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } }, { content: `$ ${f2(v)}`, styles: { halign: 'right', fontStyle: 'bold' } }]);
        kinds.push('tot');
    };
    const itemRow = (it, r) => {
        body.push([c(it.Descripcion || it.description || ''), { content: String(r.qty), styles: { halign: 'center' } },
            { content: `$ ${f2(r.unit)}`, styles: { halign: 'right' } },
            { content: `$ ${f2(r.tot)}`, styles: { halign: 'right', fontStyle: 'bold' } }]);
        kinds.push('row');
    };
    if (labor.length) {
        catHeader('Mano de Obra y Servicios');
        let t = 0;
        labor.forEach(l => { const r = lineCalc(l, laborPct); t += r.tot; itemRow(l, r); });
        catTotal('Total Mano de obra:', t);
    }
    if (products.length) {
        catHeader('Repuestos, Lubricantes y Refacciones');
        let t = 0;
        products.forEach(p => { const r = lineCalc(p, prodPct); t += r.tot; itemRow(p, r); });
        catTotal('Total Repuestos:', t);
    }
    if (budget.Repuestos_Cliente && budget.Repuestos_Cliente.length > 0) {
        catHeader('Solicitud de Repuestos');
        budget.Repuestos_Cliente.forEach(rc => {
            body.push([c(rc.Descripcion), { content: String(rc.Cantidad), styles: { halign: 'center' } },
                { content: '-', styles: { halign: 'right' } }, { content: '-', styles: { halign: 'right' } }]);
            kinds.push('row');
        });
    }

    const rgbLine = (r, g, b, w, x1, yy, x2) => { doc.setDrawColor(r, g, b); doc.setLineWidth(w); doc.line(x1, yy, x2, yy); };
    let endY = y;
    if (body.length) {
        endY = H.autoTable(doc, {
            startY: y,
            margin: { left: mx, right: mx, top: top, bottom: 12 },
            head: [[
                { content: 'DESCRIPCIÓN', styles: { halign: 'left' } },
                { content: 'CANT.', styles: { halign: 'center' } },
                { content: 'PRECIO UNIT.', styles: { halign: 'right' } },
                { content: 'TOTAL', styles: { halign: 'right' } }
            ]],
            body,
            theme: 'plain',
            showHead: 'everyPage',
            styles: { font: 'helvetica', fontSize: 8.25, textColor: TEXT, cellPadding: { top: 1.1, bottom: 1.1, left: 2, right: 2 }, lineWidth: 0, overflow: 'linebreak' },
            headStyles: { fontStyle: 'bold', fontSize: 7.5, textColor: PRIMARY, cellPadding: { top: 1.2, bottom: 1.2, left: 2, right: 2 } },
            columnStyles: { 0: { cellWidth: cw * 0.55 }, 1: { cellWidth: cw * 0.12 }, 2: { cellWidth: cw * 0.15 }, 3: { cellWidth: cw * 0.18 } },
            willDrawCell(d) {
                if (d.section !== 'body') return;
                const k = kinds[d.row.index];
                if (k === 'cat') { doc.setFillColor(241, 245, 249); doc.rect(d.cell.x, d.cell.y, d.cell.width, d.cell.height, 'F'); d.cell.styles.fontStyle = 'bold'; }
                if (k === 'tot') { doc.setFillColor(248, 250, 252); doc.rect(d.cell.x, d.cell.y, d.cell.width, d.cell.height, 'F'); d.cell.styles.fontStyle = 'bold'; }
            },
            didDrawCell(d) {
                const x1 = d.cell.x, x2 = d.cell.x + d.cell.width, yb = d.cell.y + d.cell.height;
                if (d.section === 'head') { rgbLine(15, 23, 42, 0.65, x1, yb, x2); return; }
                const k = kinds[d.row.index];
                if (k === 'cat') rgbLine(15, 23, 42, 0.4, x1, yb, x2);
                else if (k === 'tot') { rgbLine(15, 23, 42, 0.26, x1, d.cell.y, x2); rgbLine(15, 23, 42, 0.4, x1, yb, x2); }
                else rgbLine(203, 213, 225, 0.2, x1, yb, x2);
            }
        });
    }
    y = endY + 5;

    // ---------- Observaciones + Totales ----------
    const obsText = c(budget[' Observaciones'] || budget.Observaciones || 'Ninguna.');
    const diagText = budget.Diagnostico ? c(budget.Diagnostico) : '';
    const wTot = 74, gap = 5, wObs = cw - wTot - gap;
    setF('normal', 7.5, MUTED);
    const obsLines = wrap(obsText, wObs - 6);
    const diagLines = diagText ? wrap('Diagnóstico: ' + diagText, wObs - 6) : [];
    const obsH = Math.max(16, 3 + 3.6 + obsLines.length * 3.2 + (diagLines.length ? 1.6 + diagLines.length * 3.2 : 0) + 3);

    const totRows = [];
    totRows.push(['Subtotal', `$ ${f2(subtotal)}`]);
    if (discount > 0) {
        totRows.push(['(-) Descuento', `- $ ${f2(discount)}`, 'red']);
        totRows.push(['Subtotal Neto', `$ ${f2(subtotal - discount)}`, 'bold']);
    }
    if (mostrarIva) totRows.push([`(+) IVA (${(taxRate * 100).toFixed(0)}%)`, `$ ${f2(iva)}`]);
    if (percVal > 0) totRows.push(['IVA Percibido', `+ $ ${f2(percVal)}`]);
    if (retVal > 0) totRows.push(['IVA Retenido', `- $ ${f2(retVal)}`]);
    const rowH = 6.2, grandH = 7;
    const totH = totRows.length * rowH + grandH;
    const blockH = Math.max(obsH, totH);

    // firmas al pie: ~ 20mm + pie 8mm
    const sigY0 = PH - 12 - 8 - 12; // linea de firma
    if (y + blockH > sigY0 - 6) { doc.addPage(); y = top + 2; }

    doc.setDrawColor(203, 213, 225); doc.setLineWidth(0.26);
    doc.roundedRect(mx, y, wObs, obsH, 1, 1, 'S');
    setF('bold', 7.5, PRIMARY);
    txt('Observaciones / Recomendaciones:', mx + 3, y + 5);
    setF('normal', 7.5, MUTED);
    let oy = y + 9.2;
    obsLines.forEach(l => { txt(l, mx + 3, oy); oy += 3.2; });
    if (diagLines.length) {
        oy += 1.6;
        diagLines.forEach((l, i) => {
            if (i === 0) {
                setF('bold', 7.5, MUTED); txt('Diagnóstico:', mx + 3, oy);
                const lw = doc.getTextWidth('Diagnóstico: ');
                setF('normal', 7.5, MUTED); txt(l.slice('Diagnóstico: '.length), mx + 3 + lw, oy);
            } else txt(l, mx + 3, oy);
            oy += 3.2;
        });
    }

    const tx = mx + cw - wTot;
    let ty = y;
    totRows.forEach(r => {
        setF(r[2] === 'bold' ? 'bold' : 'bold', 8.25, TEXT);
        txt(r[0], tx + 2, ty + 4.2);
        if (r[2] === 'red') setF('bold', 8.25, [185, 28, 28]); else setF('bold', 8.25, TEXT);
        txt(r[1], tx + wTot - 2, ty + 4.2, { align: 'right' });
        ty += rowH;
        rgbLine(226, 232, 240, 0.26, tx, ty, tx + wTot);
    });
    doc.setFillColor(248, 250, 252);
    doc.rect(tx, ty, wTot, grandH, 'F');
    rgbLine(15, 23, 42, 0.5, tx, ty, tx + wTot);
    rgbLine(15, 23, 42, 0.65, tx, ty + grandH, tx + wTot);
    setF('bold', 9, TEXT);
    txt('Total a Pagar', tx + 2, ty + 4.8);
    txt(`$ ${f2(grandTotal)}`, tx + wTot - 2, ty + 4.8, { align: 'right' });
    y += blockH;

    // ---------- Firmas (al pie de la ultima pagina) ----------
    if (y + 8 > sigY0) { doc.addPage(); }
    const sx = sigY0, sGap = 5.3, sW = (cw - sGap * 2) / 3;
    const sigs = [['Firma Técnico', tech.Nombre_Completo], ['Firma Asesor', advisor.Nombre_Completo], ['Firma Cliente', client.Nombre]];
    sigs.forEach((s, i) => {
        const x0 = mx + i * (sW + sGap);
        rgbLine(71, 85, 105, 0.26, x0, sx, x0 + sW);
        setF('bold', 7.5, [51, 65, 85]);
        txt(s[0], x0 + sW / 2, sx + 4.2, { align: 'center' });
        setF('normal', 7.5, [100, 116, 139]);
        txt(c(s[1] || ''), x0 + sW / 2, sx + 7.8, { align: 'center', maxWidth: sW });
    });

    // ---------- Pie ----------
    const fy = sx + 14;
    rgbLine(226, 232, 240, 0.26, mx, fy - 3.5, mx + cw);
    setF('normal', 6.75, [100, 116, 139]);
    const foot = `${c(ws.direccion || '')} ${ws.telefono ? '• Tel: ' + c(ws.telefono) : ''} ${ws.correo ? '• Email: ' + c(ws.correo) : ''}`.replace(/\s+/g, ' ').trim();
    wrap(foot, cw).slice(0, 2).forEach((l, i) => txt(l, W / 2, fy + i * 3, { align: 'center' }));
}
