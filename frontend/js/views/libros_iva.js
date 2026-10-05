import { getDatabase, getBudgetGrandTotal } from '../../app.js?v=88';
import { html, safe, escapeHtml, showToast, downloadExcelReport } from '../utils.js?v=90';

let activeLibroTab = 'ventas';
let currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM

export function renderLibrosIVA(container) {
    const db = getDatabase();
    
    container.innerHTML = html`
        <div class="glass-card" style="width: 100%; max-width: 100%; overflow-x: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem;">
                    <div class="saas-tabs" style="display:flex; gap:0.5rem; overflow-x:auto;">
                        <button class="saas-tab-btn ${activeLibroTab === 'ventas' ? 'active' : ''}" data-tab="ventas" style="padding:0.6rem 1.25rem; border:none; background:none; color:var(--text-secondary); cursor:pointer; font-weight:600; border-radius:6px; transition:all 0.2s;"><i class="fa-solid fa-file-invoice-dollar"></i> Libro de Ventas</button>
                        <button class="saas-tab-btn ${activeLibroTab === 'compras' ? 'active' : ''}" data-tab="compras" style="padding:0.6rem 1.25rem; border:none; background:none; color:var(--text-secondary); cursor:pointer; font-weight:600; border-radius:6px; transition:all 0.2s;"><i class="fa-solid fa-cart-shopping"></i> Libro de Compras</button>
                    </div>
                    <div style="display: flex; gap: 1rem; align-items: center;">
                        <input type="month" id="libro-month-filter" value="${currentMonth}" class="form-control" style="background:var(--bg-input); border:1px solid var(--border-color); color:var(--text-primary); padding: 0.5rem; border-radius: 4px;">
                        <button class="btn btn-secondary" id="btn-exportar-libro" style="padding: 0.5rem;"><i class="fa-solid fa-file-excel"></i> Exportar a Excel</button>
                    </div>
                </div>
                <div id="libro-content-area" class="table-container" style="overflow-x: auto;"></div>
        </div>
    `;

    // Bind events
    container.querySelectorAll('.saas-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            activeLibroTab = btn.getAttribute('data-tab');
            renderLibrosIVA(container);
        });
    });

    const monthInput = document.getElementById('libro-month-filter');
    monthInput.addEventListener('change', (e) => {
        currentMonth = e.target.value;
        renderData(document.getElementById('libro-content-area'), db);
    });

    document.getElementById('btn-exportar-libro').addEventListener('click', () => {
        exportToExcel(db);
    });

    // Render table
    renderData(document.getElementById('libro-content-area'), db);
}

function renderData(parent, db) {
    if (activeLibroTab === 'ventas') {
        renderLibroVentas(parent, db);
    } else {
        renderLibroCompras(parent, db);
    }
}

function renderLibroVentas(parent, db) {
    const allSales = [
        ...(db.presupuestos || []).filter(p => p.Estado == 3 || p.Estado === "FACTURADO" || p.controlNumber),
        ...(db.venta_rapida || db['43 Venta Rapida'] || []).filter(vr => vr.Estado === "FACTURADO" || vr.controlNumber)
    ];

    const ventas = allSales.filter(v => {
        let dateVal = v.Fecha_Facturacion || v.fechaHoraTransaccion || v.fhProcesamiento || v.Fecha;
        if (!dateVal) return false;
        
        let dateStr = '';
        const d = new Date(dateVal);
        if (!isNaN(d.getTime())) {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            dateStr = `${year}-${month}`;
        } else {
            dateStr = String(dateVal);
        }
        return dateStr.startsWith(currentMonth);
    }).sort((a, b) => {
        let dateA = new Date(a.Fecha_Facturacion || a.fechaHoraTransaccion || a.fhProcesamiento || a.Fecha || 0).getTime();
        let dateB = new Date(b.Fecha_Facturacion || b.fechaHoraTransaccion || b.fhProcesamiento || b.Fecha || 0).getTime();
        if (isNaN(dateA)) dateA = 0;
        if (isNaN(dateB)) dateB = 0;
        return dateA - dateB; // Ascendente (1 al 31)
    });

    let sumTotal = 0;
    let sumExentas = 0;
    let sumGravadas = 0;
    let sumIva = 0;
    let sumRet = 0;
    let sumPer = 0;

    const rows = ventas.map(v => {
        const tipoDte = v.tipoDte || (v.Doc_a_Emitir === 'CREDITO FISCAL' || v.tipoDocumento === '03' ? '03' : '01');
        
        let dateVal = v.Fecha_Facturacion || v.fhProcesamiento || v.fechaHoraTransaccion || v.Fecha;
        let date = 'N/A';
        if (dateVal) {
            const d = new Date(dateVal);
            if (!isNaN(d.getTime())) {
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                date = `${year}-${month}-${day}`;
            } else {
                date = String(dateVal).split('T')[0];
            }
        }
        
        const numDoc = v.mhControlNumber || v.controlNumber || v.codigoGeneracion || v.numDoc || 'N/A';
        const clientName = v.Nombre || v.cliente_nombre || v.nombreReceptor || 'Consumidor Final';

        let total = parseFloat(v.montoTotalOperacion || v.totalPagar || v.Total || v.Monto_Total || 0);
        if (total === 0 && v['ID Presupuesto']) {
            total = getBudgetGrandTotal(v, db) || 0;
        }
        
        let iva = 0;
        let gravadas = 0;
        let exentas = 0;
        let retencion = parseFloat(v.retencion || v.ivaRetenido || 0);
        let percepcion = parseFloat(v.percepcion || v.ivaPercibido || 0);

        if (tipoDte === '03') {
            if (v.totalGravada) {
                gravadas = parseFloat(v.totalGravada);
            } else {
                gravadas = total / 1.13;
            }
            iva = parseFloat(v.totalIva || (gravadas * 0.13));
        } else if (tipoDte === '01') {
            gravadas = total / 1.13;
            iva = total - gravadas;
        }

        sumTotal += total;
        sumGravadas += gravadas;
        sumExentas += exentas;
        sumIva += iva;
        sumRet += retencion;
        sumPer += percepcion;

        return `
            <tr style="font-size: 0.8rem;">
                <td style="white-space: nowrap;">${escapeHtml(date)}</td>
                <td>${escapeHtml(tipoDte === '03' ? 'CCF' : 'FACT')}</td>
                <td style="font-size:0.75rem; font-family:monospace;">
                    <div style="max-width:160px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(numDoc)}">${escapeHtml(numDoc)}</div>
                </td>
                <td>
                    <div style="max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(clientName)}">${escapeHtml(clientName)}</div>
                </td>
                <td style="text-align: right; white-space: nowrap;">$${exentas.toFixed(2)}</td>
                <td style="text-align: right; white-space: nowrap;">$${gravadas.toFixed(2)}</td>
                <td style="text-align: right; white-space: nowrap;">$${iva.toFixed(2)}</td>
                <td style="text-align: right; white-space: nowrap;">$${retencion.toFixed(2)}</td>
                <td style="text-align: right; white-space: nowrap;">$${percepcion.toFixed(2)}</td>
                <td style="text-align: right; font-weight: bold; white-space: nowrap;">$${total.toFixed(2)}</td>
            </tr>
        `;
    }).join('');

    parent.innerHTML = html`
        <table style="width: 100%; min-width: 900px; border-collapse: collapse; font-size: 0.85rem;">
            <thead>
                <tr style="border-bottom: 1px solid var(--border-color); text-align: left; font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">
                    <th style="padding: 0.5rem; white-space: nowrap;">Fecha</th>
                    <th style="padding: 0.5rem; white-space: nowrap;">Tipo</th>
                    <th style="padding: 0.5rem; white-space: nowrap;">No. DTE / Control</th>
                    <th style="padding: 0.5rem; white-space: nowrap;">Cliente</th>
                    <th style="padding: 0.5rem; text-align: right; white-space: nowrap;">Exentas</th>
                    <th style="padding: 0.5rem; text-align: right; white-space: nowrap;">Gravadas</th>
                    <th style="padding: 0.5rem; text-align: right; white-space: nowrap;">IVA</th>
                    <th style="padding: 0.5rem; text-align: right; white-space: nowrap;">Retención</th>
                    <th style="padding: 0.5rem; text-align: right; white-space: nowrap;">Percepción</th>
                    <th style="padding: 0.5rem; text-align: right; white-space: nowrap;">Total</th>
                </tr>
            </thead>
            <tbody>
                ${safe(ventas.length === 0 ? '<tr><td colspan="10" style="text-align: center; padding: 1rem; color: var(--text-muted);">No hay ventas registradas en este mes.</td></tr>' : rows)}
            </tbody>
            <tfoot>
                <tr style="font-weight: bold; background: rgba(0,0,0,0.2); border-top: 1px solid var(--border-color);">
                    <td colspan="4" style="text-align: right; padding: 0.5rem; white-space: nowrap;">TOTALES</td>
                    <td style="text-align: right; padding: 0.5rem; color: var(--primary); white-space: nowrap;">$${sumExentas.toFixed(2)}</td>
                    <td style="text-align: right; padding: 0.5rem; color: var(--primary); white-space: nowrap;">$${sumGravadas.toFixed(2)}</td>
                    <td style="text-align: right; padding: 0.5rem; color: var(--primary); white-space: nowrap;">$${sumIva.toFixed(2)}</td>
                    <td style="text-align: right; padding: 0.5rem; color: var(--primary); white-space: nowrap;">$${sumRet.toFixed(2)}</td>
                    <td style="text-align: right; padding: 0.5rem; color: var(--primary); white-space: nowrap;">$${sumPer.toFixed(2)}</td>
                    <td style="text-align: right; padding: 0.5rem; color: var(--success); white-space: nowrap;">$${sumTotal.toFixed(2)}</td>
                </tr>
            </tfoot>
        </table>
    `;
}

function renderLibroCompras(parent, db) {
    const compras = (db.gastos || []).filter(g => {
        let dateStr = g['Fecha Gasto'] || '';
        return dateStr.startsWith(currentMonth);
    }).sort((a, b) => {
        let dateA = new Date(a['Fecha Gasto'] || 0).getTime();
        let dateB = new Date(b['Fecha Gasto'] || 0).getTime();
        if (isNaN(dateA)) dateA = 0;
        if (isNaN(dateB)) dateB = 0;
        return dateA - dateB;
    });

    let sumTotal = 0;
    let sumExentas = 0;
    let sumGravadas = 0;
    let sumIva = 0;
    let sumRet = 0;
    let sumPer = 0;

    const rows = compras.map(g => {
        let date = g['Fecha Gasto'];
        const provId = g.ID_Proveedor;
        const proveedor = provId ? (db.proveedores || []).find(p => p.ID_Proveedor === provId) : null;
        const provName = proveedor ? proveedor.Nombre : (g.Concepto || 'Compra / Gasto');
        const numDoc = (g.Concepto && g.Concepto.includes('Factura ')) ? g.Concepto.match(/Factura\s+([^\s\()]+)/)?.[1] || 'N/A' : 'N/A';
        const tipo = (g.Concepto && g.Concepto.includes('CCF')) ? 'CCF' : 'FACT';

        const total = parseFloat(g['Monto Total'] || 0);
        let gravadas = total / 1.13;
        let iva = total - gravadas;
        let exentas = 0;
        let retencion = 0;
        let percepcion = 0;

        sumTotal += total;
        sumGravadas += gravadas;
        sumExentas += exentas;
        sumIva += iva;
        sumRet += retencion;
        sumPer += percepcion;

        return `
            <tr style="font-size: 0.8rem;">
                <td style="white-space: nowrap;">${escapeHtml(date)}</td>
                <td>${escapeHtml(tipo)}</td>
                <td style="font-size:0.75rem; font-family:monospace;">
                    <div style="max-width:160px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(numDoc)}">${escapeHtml(numDoc)}</div>
                </td>
                <td>
                    <div style="max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(provName)}">${escapeHtml(provName)}</div>
                </td>
                <td style="text-align: right; white-space: nowrap;">$${exentas.toFixed(2)}</td>
                <td style="text-align: right; white-space: nowrap;">$${gravadas.toFixed(2)}</td>
                <td style="text-align: right; white-space: nowrap;">$${iva.toFixed(2)}</td>
                <td style="text-align: right; white-space: nowrap;">$${retencion.toFixed(2)}</td>
                <td style="text-align: right; white-space: nowrap;">$${percepcion.toFixed(2)}</td>
                <td style="text-align: right; font-weight: bold; white-space: nowrap;">$${total.toFixed(2)}</td>
            </tr>
        `;
    }).join('');

    parent.innerHTML = html`
        <table style="width: 100%; min-width: 900px; border-collapse: collapse; font-size: 0.85rem;">
            <thead>
                <tr style="border-bottom: 1px solid var(--border-color); text-align: left; font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">
                    <th style="padding: 0.5rem; white-space: nowrap;">Fecha</th>
                    <th style="padding: 0.5rem; white-space: nowrap;">Tipo</th>
                    <th style="padding: 0.5rem; white-space: nowrap;">No. Documento</th>
                    <th style="padding: 0.5rem; white-space: nowrap;">Proveedor</th>
                    <th style="padding: 0.5rem; text-align: right; white-space: nowrap;">Exentas</th>
                    <th style="padding: 0.5rem; text-align: right; white-space: nowrap;">Gravadas</th>
                    <th style="padding: 0.5rem; text-align: right; white-space: nowrap;">IVA</th>
                    <th style="padding: 0.5rem; text-align: right; white-space: nowrap;">Retención</th>
                    <th style="padding: 0.5rem; text-align: right; white-space: nowrap;">Percepción</th>
                    <th style="padding: 0.5rem; text-align: right; white-space: nowrap;">Total</th>
                </tr>
            </thead>
            <tbody>
                ${safe(compras.length === 0 ? '<tr><td colspan="10" style="text-align: center; padding: 1rem; color: var(--text-muted);">No hay compras/gastos registrados en este mes.</td></tr>' : rows)}
            </tbody>
            <tfoot>
                <tr style="font-weight: bold; background: rgba(0,0,0,0.2); border-top: 1px solid var(--border-color);">
                    <td colspan="4" style="text-align: right; padding: 0.5rem; white-space: nowrap;">TOTALES</td>
                    <td style="text-align: right; padding: 0.5rem; color: var(--primary); white-space: nowrap;">$${sumExentas.toFixed(2)}</td>
                    <td style="text-align: right; padding: 0.5rem; color: var(--primary); white-space: nowrap;">$${sumGravadas.toFixed(2)}</td>
                    <td style="text-align: right; padding: 0.5rem; color: var(--primary); white-space: nowrap;">$${sumIva.toFixed(2)}</td>
                    <td style="text-align: right; padding: 0.5rem; color: var(--primary); white-space: nowrap;">$${sumRet.toFixed(2)}</td>
                    <td style="text-align: right; padding: 0.5rem; color: var(--primary); white-space: nowrap;">$${sumPer.toFixed(2)}</td>
                    <td style="text-align: right; padding: 0.5rem; color: var(--danger); white-space: nowrap;">$${sumTotal.toFixed(2)}</td>
                </tr>
            </tfoot>
        </table>
    `;
}

function exportToExcel(db) {
    if (activeLibroTab === 'ventas') {
        const allSales = [
            ...(db.presupuestos || []).filter(p => p.Estado == 3 || p.Estado === "FACTURADO" || p.controlNumber),
            ...(db.venta_rapida || db['43 Venta Rapida'] || []).filter(vr => vr.Estado === "FACTURADO" || vr.controlNumber)
        ];

        const ventas = allSales.filter(v => {
            let dateVal = v.Fecha_Facturacion || v.fechaHoraTransaccion || v.fhProcesamiento || v.Fecha;
            if (!dateVal) return false;
            
            let dateStr = '';
            const d = new Date(dateVal);
            if (!isNaN(d.getTime())) {
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                dateStr = `${year}-${month}`;
            } else {
                dateStr = String(dateVal);
            }
            return dateStr.startsWith(currentMonth);
        }).sort((a, b) => {
            let dateA = new Date(a.Fecha_Facturacion || a.fechaHoraTransaccion || a.fhProcesamiento || a.Fecha || 0).getTime();
            let dateB = new Date(b.Fecha_Facturacion || b.fechaHoraTransaccion || b.fhProcesamiento || b.Fecha || 0).getTime();
            if (isNaN(dateA)) dateA = 0;
            if (isNaN(dateB)) dateB = 0;
            return dateA - dateB;
        });
        
        if (ventas.length === 0) {
            showToast("No hay ventas para exportar.", "warning");
            return;
        }

        const data = ventas.map(v => {
            const tipoDte = v.tipoDte || (v.Doc_a_Emitir === 'CREDITO FISCAL' || v.tipoDocumento === '03' ? '03' : '01');
            
            let dateVal = v.Fecha_Facturacion || v.fhProcesamiento || v.fechaHoraTransaccion || v.Fecha;
            let date = 'N/A';
            if (dateVal) {
                const d = new Date(dateVal);
                if (!isNaN(d.getTime())) {
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    date = `${year}-${month}-${day}`;
                } else {
                    date = String(dateVal).split('T')[0];
                }
            }
            
            const numDoc = v.mhControlNumber || v.controlNumber || v.codigoGeneracion || v.numDoc || 'N/A';
            const clientName = v.Nombre || v.cliente_nombre || v.nombreReceptor || 'Consumidor Final';

            let total = parseFloat(v.montoTotalOperacion || v.totalPagar || v.Total || v.Monto_Total || 0);
            if (total === 0 && v['ID Presupuesto']) {
                total = getBudgetGrandTotal(v, db) || 0;
            }
            
            let iva = 0;
            let gravadas = 0;
            let exentas = 0;
            let retencion = parseFloat(v.retencion || v.ivaRetenido || 0);
            let percepcion = parseFloat(v.percepcion || v.ivaPercibido || 0);

            if (tipoDte === '03') {
                if (v.totalGravada) {
                    gravadas = parseFloat(v.totalGravada);
                } else {
                    gravadas = total / 1.13;
                }
                iva = parseFloat(v.totalIva || (gravadas * 0.13));
            } else if (tipoDte === '01') {
                gravadas = total / 1.13;
                iva = total - gravadas;
            }

            return {
                "Fecha": date,
                "Tipo": tipoDte === '03' ? 'CCF' : 'FACT',
                "No. Documento": numDoc,
                "Cliente": clientName,
                "Exentas ($)": exentas.toFixed(2),
                "Gravadas ($)": gravadas.toFixed(2),
                "IVA ($)": iva.toFixed(2),
                "Retencion ($)": retencion.toFixed(2),
                "Percepcion ($)": percepcion.toFixed(2),
                "Total ($)": total.toFixed(2)
            };
        });

        downloadExcelReport(`Libro_Ventas_${currentMonth}`, data);
    } else {
        const compras = (db.gastos || []).filter(g => {
            let dateStr = g['Fecha Gasto'] || '';
            return dateStr.startsWith(currentMonth);
        }).sort((a, b) => {
            let dateA = new Date(a['Fecha Gasto'] || 0).getTime();
            let dateB = new Date(b['Fecha Gasto'] || 0).getTime();
            if (isNaN(dateA)) dateA = 0;
            if (isNaN(dateB)) dateB = 0;
            return dateA - dateB;
        });

        if (compras.length === 0) {
            showToast("No hay compras para exportar.", "warning");
            return;
        }

        const data = compras.map(g => {
            let date = g['Fecha Gasto'];
            const provId = g.ID_Proveedor;
            const proveedor = provId ? (db.proveedores || []).find(p => p.ID_Proveedor === provId) : null;
            const provName = proveedor ? proveedor.Nombre : (g.Concepto || 'Compra / Gasto');
            const numDoc = (g.Concepto && g.Concepto.includes('Factura ')) ? g.Concepto.match(/Factura\s+([^\s\()]+)/)?.[1] || 'N/A' : 'N/A';
            const tipo = (g.Concepto && g.Concepto.includes('CCF')) ? 'CCF' : 'FACT';

            const total = parseFloat(g['Monto Total'] || 0);
            let gravadas = total / 1.13;
            let iva = total - gravadas;

            return {
                "Fecha": date,
                "Tipo": tipo,
                "No. Documento": numDoc,
                "Proveedor": provName,
                "Exentas ($)": "0.00",
                "Gravadas ($)": gravadas.toFixed(2),
                "IVA ($)": iva.toFixed(2),
                "Retencion ($)": "0.00",
                "Percepcion ($)": "0.00",
                "Total ($)": total.toFixed(2)
            };
        });
        downloadExcelReport(`Libro_Compras_${currentMonth}`, data);
    }
}
