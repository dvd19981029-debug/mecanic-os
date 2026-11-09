/**
 * Mecanic OS - Formato PDF 'moderno_facturallama' (jsPDF + autoTable).
 * Reproduce la plantilla HTML getModernoFacturaLlamaHTML de views/presupuestos.js.
 */

const TXT = [15, 23, 42];       // #0f172a
const BORDER = [203, 213, 225]; // #cbd5e1
const LABEL_BG = [241, 245, 249]; // #f1f5f9
const MUTED = [71, 85, 105];    // #475569
const MARGIN = 12;
const FS = 7.4;                 // fuente base (pt)
const LH = 3.4;                 // alto de linea (mm)

export async function draw(doc, ctx, H) {
    const { ws = {}, budget = {}, client = {}, vehicle = {}, products = [], labor = [] } = ctx;
    const options = ctx.options || {};
    const num = v => Number(v) || 0;
    const subtotal = num(ctx.subtotal), iva = num(ctx.iva), retVal = num(ctx.retVal), percVal = num(ctx.percVal);
    const grandTotal = num(ctx.grandTotal), discount = num(ctx.discount);
    const mostrarIva = options.mostrarIva !== undefined ? options.mostrarIva : (ws.mostrar_iva_presupuesto !== 'no');
    const taxRate = options.taxRate !== undefined ? options.taxRate
        : parseFloat(budget['% Impuesto'] !== undefined ? budget['% Impuesto'] : 0.13);
    const primary = H.hexToRgb(ws.color_presupuesto || '#5a626a', [90, 98, 106]);
    const c = H.clean;

    const PW = doc.internal.pageSize.getWidth();
    const PH = doc.internal.pageSize.getHeight();
    const CW = PW - MARGIN * 2;
    const BOTTOM = PH - 14;

    // ---------- datos ----------
    let tech = 'Sin Asignar', advisor = 'Sin Asignar';
    try {
        const db = typeof getDatabase === 'function' ? getDatabase() : null;
        const find = id => ((db && db.tecnicos) || []).find(t => t.Tecnico_ID === id);
        const t = find(budget.Tecnico_Asignado), a = find(budget.Asesor_Asignado);
        if (t && t.Nombre_Completo) tech = t.Nombre_Completo;
        if (a && a.Nombre_Completo) advisor = a.Nombre_Completo;
    } catch (e) { /* sin base de datos */ }
    if (ctx.techName) tech = ctx.techName;
    if (ctx.advisorName) advisor = ctx.advisorName;

    let horaStr = '12:00:00';
    if (budget.Hora) horaStr = budget.Hora;
    else if (budget.Fecha) {
        const d = new Date(budget.Fecha);
        if (!isNaN(d.getTime()) && !(d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0)) {
            const p2 = n => String(n).padStart(2, '0');
            horaStr = `${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`;
        }
    }
    const fecha = new Date(budget.Fecha).toLocaleDateString('es-SV');

    // Items (misma logica que la plantilla)
    const discPct = subtotal > 0 ? discount / subtotal : 0;
    const mkItem = (p, defUnit) => {
        const price = p.unitPrice !== undefined ? p.unitPrice : parseFloat(p.PrecioUnitario || 0);
        const qty = parseFloat(p.Cantidad || 1);
        const sub = p.rawLineTotal !== undefined ? p.rawLineTotal : price * qty;
        const dsc = p.discountAmount !== undefined ? p.discountAmount : sub * discPct;
        const tot = p.effectiveLineTotal !== undefined ? p.effectiveLineTotal : sub - dsc;
        return { cant: qty.toFixed(2), unidad: p.UnidadMedida || defUnit, desc: c(p.Descripcion || p.description || ''), precio: price, dsc, tot };
    };
    const items = [...products.map(p => mkItem(p, 'Pieza')), ...labor.map(l => mkItem(l, 'Servicio'))];
    const custParts = Array.isArray(budget.Repuestos_Cliente) ? budget.Repuestos_Cliente : [];

    // imagenes
    const logoImg = ws.logo ? await H.loadImage(ws.logo) : null;
    const phone = String(ws.qr_whatsapp || ws.telefono || '').replace(/\D/g, '');
    let qrImg = null;
    if (phone) {
        const wa = phone.length === 8 ? '503' + phone : phone;
        const txt = `Hola, me gustaría consultar/aceptar la cotización ${budget['ID Presupuesto']} del vehículo con placas ${vehicle.Placas || 'N/A'}.`;
        qrImg = await H.loadImage(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`https://wa.me/${wa}?text=${encodeURIComponent(txt)}`)}`)
            || await H.loadWhatsappQr(ws);
    }

    // ---------- utilidades de dibujo ----------
    const font = (style = 'normal', size = FS, color = TXT) => {
        doc.setFont('helvetica', style); doc.setFontSize(size); doc.setTextColor(...color);
    };
    const T = (s, x, y, o = {}) => doc.text(String(s), x, y, { baseline: 'top', ...o });

    /** Parte "Etiqueta: valor" en lineas [[bold, normal], ...] respetando ancho w. */
    const kvLines = (label, value, w, size = FS, vstyle = 'normal') => {
        doc.setFontSize(size);
        doc.setFont('helvetica', 'bold');
        const lw = label ? doc.getTextWidth(label + ' ') : 0;
        doc.setFont('helvetica', vstyle);
        const words = String(value == null ? '' : value).split(/\s+/).filter(Boolean);
        const lines = [];
        let cur = '', avail = w - lw;
        for (const wd of words) {
            const test = cur ? cur + ' ' + wd : wd;
            if (doc.getTextWidth(test) <= avail || !cur) cur = test;
            else { lines.push(cur); cur = wd; avail = w; }
        }
        lines.push(cur);
        return lines.map((t, i) => [i === 0 ? label : '', t]);
    };
    const drawKv = (x, y, w, label, value, o = {}) => {
        const size = o.size || FS;
        const lines = kvLines(label, value, w, size, o.style === 'bold' ? 'bold' : 'normal');
        let yy = y;
        lines.forEach(([b, n], i) => {
            let xx = x;
            if (b) {
                font('bold', size); T(b, xx, yy);
                xx += doc.getTextWidth(b + ' ');
            }
            font(o.style || 'normal', size, o.color || TXT);
            if (n) T(n, xx, yy);
            yy += LH;
        });
        return yy - y;
    };
    /** Etiqueta en negrita y valor debajo (bloque del recuadro DTE). */
    const drawStack = (x, y, w, label, value, o = {}) => {
        font('bold'); T(label, x, y);
        const vs = doc.splitTextToSize(String(value), w);
        font(o.style || 'normal', o.size || FS, o.color || TXT);
        vs.forEach((l, i) => T(l, x, y + LH * (i + 1)));
        return LH * (1 + vs.length);
    };
    const sectionBar = (y, title) => {
        const h = 5.4;
        doc.setFillColor(...primary);
        doc.roundedRect(MARGIN, y, CW, h - 1, 1, 1, 'F');
        doc.rect(MARGIN, y + 1.5, CW, h - 1.5, 'F');
        font('bold', 7.6, [255, 255, 255]);
        T(title.toUpperCase(), MARGIN + CW / 2, y + 1.55, { align: 'center', charSpace: 0.25 });
        return y + h;
    };
    const boxBelow = (y, h) => {
        doc.setDrawColor(...BORDER); doc.setLineWidth(0.25);
        doc.setFillColor(255, 255, 255);
        // contorno sin borde superior
        doc.roundedRect(MARGIN, y - 1, CW, h + 1, 1, 1, 'S');
        doc.setFillColor(...primary);
        doc.rect(MARGIN, y - 1, CW, 1.5, 'F');
    };
    const ensure = (y, h) => {
        if (y + h > BOTTOM) { doc.addPage(); return MARGIN; }
        return y;
    };

    let y = MARGIN;

    // ---------- Encabezado ----------
    const gap = 2.4;
    const unit = (CW - gap * 2) / 3.1;
    const c1w = unit * 1.3, c2w = unit, c3w = unit * 0.8;
    const c2x = MARGIN + c1w + gap, c3x = c2x + c2w + gap;

    font('bold', 15, primary);
    const title = c(ws.nombre_comercial || ws.nombre || '');
    const titleLines = doc.splitTextToSize(title, c1w);
    titleLines.forEach((l, i) => T(l, MARGIN, y + i * 6));
    let y1 = y + titleLines.length * 6 + 0.5;
    y1 += drawKv(MARGIN, y1, c1w, 'Nombre o Razón Social:', c(ws.nombre));
    y1 += drawKv(MARGIN, y1, c1w, 'NIT:', c(ws.num_documento || ws.nit || '') + '    ') ;
    // NRC en la misma linea que NIT
    y1 -= LH;
    {
        font('bold'); const nitW = doc.getTextWidth('NIT: ');
        font('normal'); const vW = doc.getTextWidth(c(ws.num_documento || ws.nit || '') + '    ');
        font('bold'); T('NRC:', MARGIN + nitW + vW, y1);
        const nrcW = doc.getTextWidth('NRC: ');
        font('normal'); T(c(ws.nrc || ''), MARGIN + nitW + vW + nrcW, y1);
        y1 += LH;
    }
    y1 += drawKv(MARGIN, y1, c1w, 'Correo Electrónico:', c(ws.correo));

    let y2 = y;
    y2 += drawKv(c2x, y2, c2w, 'Dirección:', c(ws.direccion || ''));
    y2 += drawKv(c2x, y2, c2w, '', 'MUNICIPIO DE ' + (ws.municipio ? c(ws.municipio).toUpperCase() : ''));
    y2 += drawKv(c2x, y2, c2w, '', 'DEPARTAMENTO DE ' + (ws.departamento ? c(ws.departamento).toUpperCase() : ''));
    y2 += drawKv(c2x, y2, c2w, 'Teléfono:', c(ws.telefono));

    let y3 = y;
    if (logoImg) {
        const bh = 22;
        H.addImageFit(doc, logoImg, c3x, y, c3w, bh, 'center');
        y3 = y + bh;
    } else {
        const bh = 8.5;
        doc.setFillColor(248, 250, 252); doc.setDrawColor(...BORDER); doc.setLineWidth(0.3);
        doc.roundedRect(c3x, y, c3w, bh, 1.4, 1.4, 'FD');
        font('bold', 11, primary);
        T(c(ws.logoText || 'TALLER'), c3x + c3w / 2, y + 1.6, { align: 'center' });
        const tag = c((ws.logoTagline || '').substring(0, 35)).toUpperCase();
        if (tag) { font('bold', 4.6, [100, 116, 139]); T(tag, c3x + c3w / 2, y + 5.8, { align: 'center' }); }
        y3 = y + bh;
    }
    y = Math.max(y1, y2, y3) + 3.2;

    // ---------- Detalles del presupuesto ----------
    y = ensure(y, 50);
    y = sectionBar(y, 'Detalles del Presupuesto / Cotización');
    const qrBox = 24;
    const colX = MARGIN + 2.6 + qrBox + 3;
    const dW = CW - (colX - MARGIN) - 2.6;
    const half = dW * 0.55;
    const x2 = colX + half;
    const top = y + 2.6;
    let a1 = top, a2 = top;
    a1 += drawStack(colX, a1, half, 'N° de Cotización:', c(String(budget['ID Presupuesto'] || '')).toUpperCase(), { style: 'bold', color: primary, size: FS + 0.3 }) + 1.2;
    a2 += drawStack(x2, a2, dW - half, 'Vigencia / Validez:', '15 días calendario') + 1.2;
    a1 += drawStack(colX, a1, half, 'Fecha de Generación:', fecha) + 1.2;
    a2 += drawStack(x2, a2, dW - half, 'Hora de Generación:', horaStr) + 1.2;
    a1 += drawStack(colX, a1, half, 'Técnico Asignado:', c(tech)) + 1.2;
    a2 += drawStack(x2, a2, dW - half, 'Asesor:', c(advisor)) + 1.2;
    if (budget.Orden_Compra) a1 += drawStack(colX, a1, half, 'Orden de Compra:', c(budget.Orden_Compra)) + 1.2;
    const dteH = Math.max(a1, a2, top + qrBox + 5) - y + 1.4;
    boxBelow(y, dteH);
    // QR o recuadro generico
    const qx = MARGIN + 2.6, qy = y + 2.8;
    if (qrImg) {
        doc.setDrawColor(...BORDER); doc.setLineWidth(0.25);
        doc.roundedRect(qx, qy, qrBox, qrBox, 1, 1, 'S');
        H.addImageFit(doc, qrImg, qx + 0.7, qy + 0.7, qrBox - 1.4, qrBox - 1.4);
        font('bold', 4.8, primary);
        T('ESCANEAR WA', qx + qrBox / 2, qy + qrBox + 1.4, { align: 'center', charSpace: 0.1 });
    } else {
        doc.setFillColor(248, 250, 252); doc.setDrawColor(176, 184, 192);
        doc.roundedRect(qx, qy, qrBox, qrBox, 1, 1, 'FD');
        doc.setDrawColor(...primary); doc.setLineWidth(1.4);
        [[3, 3], [qrBox - 9, 3], [3, qrBox - 9]].forEach(([dx, dy]) => doc.rect(qx + dx, qy + dy, 6, 6, 'S'));
        doc.setFillColor(...primary);
        [[10, 10, 6, 6], [13, 4, 3, 3], [4, 12, 4, 2], [qrBox - 7, qrBox - 7, 4, 4], [11, 18, 4, 2]].forEach(([dx, dy, w, h]) => doc.rect(qx + dx, qy + dy, w, h, 'F'));
    }
    y += dteH + 3;

    // ---------- Receptor ----------
    y = ensure(y, 36);
    y = sectionBar(y, 'Receptor / Cliente y Vehículo');
    const rpad = 2.6, rGap = 3.5;
    const ru = (CW - rpad * 2 - rGap) / 2.2;
    const rw1 = ru * 1.2, rw2 = ru;
    const rx2 = MARGIN + rpad + rw1 + rGap;
    let r1 = y + 2.4, r2 = y + 2.4;
    const f = (lbl, val, which) => {
        if (which === 1) r1 += drawKv(MARGIN + rpad, r1, rw1, lbl, c(val));
        else r2 += drawKv(rx2, r2, rw2, lbl, c(val));
    };
    f('Nombre o Razón Social:', client.Nombre, 1);
    f('Tipo de Documento:', client['Tipo Doc'] || client.Tipo_Documento || 'DUI', 1);
    f('N° Documento:', client['Num Doc'] || client.Num_Documento || client.NIT || client.DUI || 'N/A', 1);
    f('Dirección:', client.Direccion || 'Dirección de cliente registrada', 1);
    f('Correo Electrónico:', client.Correo || 'N/A', 1);
    f('Teléfono:', budget['Telefono 1 '] || client['Telefono 1 '] || 'N/A', 1);
    {
        // Placa + Año en la misma linea
        font('bold'); T('Placa:', rx2, r2);
        let xx = rx2 + doc.getTextWidth('Placa: ');
        font('normal'); const pl = c(vehicle.Placas || 'N/A'); T(pl, xx, r2);
        xx += doc.getTextWidth(pl + '      ');
        font('bold'); T('Año:', xx, r2);
        xx += doc.getTextWidth('Año: ');
        font('normal'); T(c(vehicle.Año || 'N/A'), xx, r2);
        r2 += LH;
    }
    f('Marca / Modelo:', `${vehicle.Marca || 'N/A'} ${vehicle.Modelo || 'N/A'}`, 2);
    f('VIN / Motor:', `${vehicle.Nª_VIN || 'N/A'} / ${vehicle.Nª_Motor || 'N/A'}`, 2);
    f('Nº Equipo:', vehicle.N_Equipo || 'N/A', 2);
    f('Odómetro / Recorrido:', `${budget.Kilometraje || vehicle.Odometro || '0'} km`, 2);
    const recH = Math.max(r1, r2) - y + 1.8;
    boxBelow(y, recH);
    y += recH + 3;

    // ---------- Cuerpo del documento ----------
    y = ensure(y, 30);
    y = sectionBar(y, 'Cuerpo del Documento');
    const cw = [0.04, 0.06, 0.08, 0.52, 0.10, 0.10, 0.10].map(p => p * CW);
    const mny = n => H.money(n);
    const body = [];
    if (items.length === 0 && custParts.length === 0) {
        body.push([{ content: 'No se registran items cotizados', colSpan: 7, styles: { halign: 'center', textColor: [100, 116, 139], cellPadding: 3 } }]);
    } else {
        items.forEach((it, i) => body.push([String(i + 1), it.cant, c(it.unidad), it.desc, mny(it.precio), mny(it.dsc), mny(it.tot)]));
        if (custParts.length) {
            body.push([{ content: 'SOLICITUD DE REPUESTOS', colSpan: 7, styles: { fontStyle: 'bold', fillColor: [248, 250, 252], halign: 'left', fontSize: 7.4, cellPadding: { top: 1.8, bottom: 1.8, left: 3, right: 2 }, lineColor: [203, 213, 225] } }]);
            custParts.forEach((rc, idx) => body.push([String(items.length + idx + 1), String(rc.Cantidad), 'Pieza (C)', c(rc.Descripcion), '-', '-', '-']));
        }
    }
    const endY = H.autoTable(doc, {
        startY: y,
        margin: { left: MARGIN, right: MARGIN, bottom: 14 },
        head: [['N°', 'Cant.', 'Unidad', 'Descripción', 'Precio Unitario', 'Descuento', mostrarIva ? 'Ventas Gravadas' : 'Total ($)']],
        body,
        theme: 'grid',
        tableWidth: CW,
        styles: { font: 'helvetica', fontSize: 6.9, textColor: TXT, cellPadding: { top: 0.9, bottom: 0.9, left: 1.6, right: 1.6 }, lineColor: BORDER, lineWidth: 0.2, valign: 'middle', overflow: 'linebreak' },
        headStyles: { fillColor: primary, textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', fontSize: 7, cellPadding: 1.3 },
        columnStyles: {
            0: { cellWidth: cw[0], halign: 'center' }, 1: { cellWidth: cw[1], halign: 'center' }, 2: { cellWidth: cw[2], halign: 'center' },
            3: { cellWidth: cw[3], halign: 'left' }, 4: { cellWidth: cw[4], halign: 'center' }, 5: { cellWidth: cw[5], halign: 'center' }, 6: { cellWidth: cw[6], halign: 'center' }
        },
        showHead: 'everyPage'
    });
    y = endY + 3;

    // ---------- Bloque inferior ----------
    const gw = 3.5;
    const bu = (CW - gw) / 2.3;
    const lw = bu * 1.3, rwid = bu;
    const rxx = MARGIN + lw + gw;

    // alturas del lado izquierdo
    const totalLetras = String(H.numeroALetras(grandTotal) || '').toUpperCase();
    const conditionStr = String(budget.Condicion || (client['Credito?'] === 'SI' ? 'CRÉDITO' : 'CONTADO')).toUpperCase();
    const fallas = c(budget.Fallas_Detectadas || budget['Fallas Detectadas'] || 'Servicio y mantenimiento técnico automotriz.');
    const obs = budget.Observaciones ? c(budget.Observaciones) : '';
    const nwid = lw - 4.4;
    const fallasL = doc.splitTextToSize(fallas, nwid);
    const obsL = obs ? doc.splitTextToSize(obs, nwid) : [];
    const letrasLinesH = kvLines('Total en Letras:', totalLetras, lw, FS, 'bold').length * LH;
    const notesH = 2.2 + LH + fallasL.length * LH + 1.5 + (obs ? 2.2 + LH + 0.6 + LH * obsL.length : 0) + 0.5;
    const extH = 21;
    const leftH = letrasLinesH + 1.8 + LH + 1.8 + LH + 1.8 + Math.max(notesH, 11) + 2.8 + extH;

    const rows = [['Sumatoria de Ventas', subtotal]];
    if (discount > 0) rows.push(['Monto Global de Descuento', discount]);
    rows.push(['Sub Total', subtotal - discount]);
    if (mostrarIva) rows.push([`(+) IVA (${(taxRate * 100).toFixed(0)}%)`, iva]);
    if (percVal > 0) rows.push(['(+) IVA Percibido', percVal]);
    if (retVal > 0) rows.push(['(-) IVA Retenido', retVal]);
    const rowH = 5.3, grandH = 5.8;
    const rightH = rows.length * rowH + grandH;

    y = ensure(y, Math.max(leftH, rightH) + 1);

    // izquierda
    let ly = y;
    ly += drawKv(MARGIN, ly, lw, 'Total en Letras:', totalLetras, { style: 'bold' }) + 1.8;
    ly += drawKv(MARGIN, ly, lw, 'Condición de la Operación:', conditionStr) + 1.8;
    font('bold'); T('Observaciones / Diagnóstico:', MARGIN, ly); ly += LH + 1.8;
    const nh = Math.max(notesH, 11);
    doc.setFillColor(250, 251, 252); doc.setDrawColor(...BORDER); doc.setLineWidth(0.25);
    doc.roundedRect(MARGIN, ly, lw, nh, 1, 1, 'FD');
    let ny = ly + 2.2;
    font('bold'); T('Fallas Detectadas / Diagnóstico Final:', MARGIN + 2.2, ny); ny += LH;
    font('italic', FS + 0.3, MUTED);
    fallasL.forEach(l => { T(l, MARGIN + 2.2, ny); ny += LH; });
    if (obs) {
        ny += 1.5;
        doc.setDrawColor(...BORDER); doc.setLineDashPattern([0.8, 0.8], 0);
        doc.line(MARGIN + 2.2, ny, MARGIN + lw - 2.2, ny); doc.setLineDashPattern([], 0);
        ny += 2.2;
        font('bold'); T('Observaciones / Recomendaciones adicionales:', MARGIN + 2.2, ny); ny += LH + 0.6;
        font('italic', FS + 0.3, MUTED);
        obsL.forEach(l => { T(l, MARGIN + 2.2, ny); ny += LH; });
    }
    ly += nh + 2.8;

    // extension / firmas
    doc.setDrawColor(...BORDER); doc.setLineWidth(0.25);
    doc.roundedRect(MARGIN, ly, lw, extH, 1, 1, 'S');
    doc.setFillColor(...primary);
    doc.roundedRect(MARGIN, ly, lw, 4.6, 1, 1, 'F');
    doc.rect(MARGIN, ly + 2.3, lw, 2.3, 'F');
    font('bold', 7.2, [255, 255, 255]);
    T('Extensión', MARGIN + lw / 2, ly + 1.1, { align: 'center' });
    const ew = (lw - 5.4 - 2.6) / 2;
    [0, 1].forEach(i => {
        const ex = MARGIN + 2.6 + i * (ew + 2.6);
        font('bold', 6.8); T(i === 0 ? 'Nombre Entrega:' : 'Nombre Recibe:', ex, ly + 6.2);
        doc.setDrawColor(176, 184, 192); doc.setLineWidth(0.2); doc.setLineDashPattern([0.7, 0.7], 0);
        doc.line(ex, ly + 13.2, ex + ew, ly + 13.2); doc.setLineDashPattern([], 0);
        font('normal', 6.6); T('N° Documento:', ex, ly + 14.8);
    });

    // derecha: totales
    let ry = y;
    const labW = rwid * 0.58;
    doc.setLineWidth(0.2); doc.setDrawColor(...BORDER);
    rows.forEach(([lbl, val]) => {
        doc.setFillColor(...LABEL_BG);
        doc.rect(rxx, ry, labW, rowH, 'FD');
        doc.setFillColor(255, 255, 255);
        doc.rect(rxx + labW, ry, rwid - labW, rowH, 'FD');
        font('bold', 6.7, [51, 65, 85]); T(lbl, rxx + 1.9, ry + 1.5);
        font('bold', FS + 0.3); T(H.money(val), rxx + labW + (rwid - labW) / 2, ry + 1.45, { align: 'center' });
        ry += rowH;
    });
    doc.setFillColor(...primary);
    doc.rect(rxx, ry, rwid, grandH, 'FD');
    font('bold', 8.2, [255, 255, 255]);
    T('Total a Pagar', rxx + 1.9, ry + 1.5);
    T(H.money(grandTotal), rxx + labW + (rwid - labW) / 2, ry + 1.5, { align: 'center' });

    if (doc.getNumberOfPages() > 1) H.pageNumbers(doc, { y: PH - 7 });
}
