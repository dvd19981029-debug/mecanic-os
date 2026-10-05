import { getDatabase } from '../../app.js?v=88';
import { html, safe, escapeHtml, showToast, downloadExcelReport } from '../utils.js?v=90';

let activeLibroTab = 'ventas';
let currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM

export function renderLibrosIVA(container) {
    const db = getDatabase();
    
    container.innerHTML = html`
        <div class="view-split" style="flex-direction: column;">
            <div class="glass-card">
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
    const ventas = (db.ventas || []).filter(v => {
        if (!v.fechaHoraTransaccion && !v.fhProcesamiento && !v.Fecha) return false;
        let dateStr = v.fhProcesamiento || v.fechaHoraTransaccion || v.Fecha;
        return dateStr.startsWith(currentMonth);
    });

    let sumTotal = 0;
    let sumExentas = 0;
    let sumGravadas = 0;
    let sumIva = 0;
    let sumRet = 0;
    let sumPer = 0;

    const rows = ventas.map(v => {
        const tipoDte = v.tipoDte || (v.tipoDocumento === '03' ? '03' : '01');
        let date = v.fhProcesamiento || v.fechaHoraTransaccion || v.Fecha;
        date = date ? date.split('T')[0] : 'N/A';
        const numDoc = v.codigoGeneracion || v.numDoc || 'N/A';
        const clientName = v.cliente_nombre || v.nombreReceptor || v.Nombre || 'Consumidor Final';

        const total = parseFloat(v.montoTotalOperacion || v.totalPagar || v.Total || 0);
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
            <tr>
                <td>${escapeHtml(date)}</td>
                <td>${escapeHtml(tipoDte === '03' ? 'CCF' : 'FACT')}</td>
                <td style="font-size:0.8rem; font-family:monospace;">${escapeHtml(numDoc)}</td>
                <td>${escapeHtml(clientName)}</td>
                <td style="text-align: right;">$${exentas.toFixed(2)}</td>
                <td style="text-align: right;">$${gravadas.toFixed(2)}</td>
                <td style="text-align: right;">$${iva.toFixed(2)}</td>
                <td style="text-align: right;">$${retencion.toFixed(2)}</td>
                <td style="text-align: right;">$${percepcion.toFixed(2)}</td>
                <td style="text-align: right; font-weight: bold;">$${total.toFixed(2)}</td>
            </tr>
        `;
    }).join('');

    parent.innerHTML = html`
        <table style="width: 100%; min-width: 800px; border-collapse: collapse;">
            <thead>
                <tr style="border-bottom: 1px solid var(--border-color); text-align: left;">
                    <th style="padding: 0.5rem;">Fecha</th>
                    <th style="padding: 0.5rem;">Tipo</th>
                    <th style="padding: 0.5rem;">No. DTE / Control</th>
                    <th style="padding: 0.5rem;">Cliente</th>
                    <th style="padding: 0.5rem; text-align: right;">Ventas Exentas</th>
                    <th style="padding: 0.5rem; text-align: right;">Ventas Gravadas</th>
                    <th style="padding: 0.5rem; text-align: right;">IVA (13%)</th>
                    <th style="padding: 0.5rem; text-align: right;">Retención (1%)</th>
                    <th style="padding: 0.5rem; text-align: right;">Percepción (1%)</th>
                    <th style="padding: 0.5rem; text-align: right;">Total</th>
                </tr>
            </thead>
            <tbody>
                ${safe(ventas.length === 0 ? '<tr><td colspan="10" style="text-align: center; padding: 1rem; color: var(--text-muted);">No hay ventas registradas en este mes.</td></tr>' : rows)}
            </tbody>
            <tfoot>
                <tr style="font-weight: bold; background: rgba(0,0,0,0.2); border-top: 1px solid var(--border-color);">
                    <td colspan="4" style="text-align: right; padding: 0.5rem;">TOTALES</td>
                    <td style="text-align: right; padding: 0.5rem; color: var(--primary);">$${sumExentas.toFixed(2)}</td>
                    <td style="text-align: right; padding: 0.5rem; color: var(--primary);">$${sumGravadas.toFixed(2)}</td>
                    <td style="text-align: right; padding: 0.5rem; color: var(--primary);">$${sumIva.toFixed(2)}</td>
                    <td style="text-align: right; padding: 0.5rem; color: var(--primary);">$${sumRet.toFixed(2)}</td>
                    <td style="text-align: right; padding: 0.5rem; color: var(--primary);">$${sumPer.toFixed(2)}</td>
                    <td style="text-align: right; padding: 0.5rem; color: var(--success);">$${sumTotal.toFixed(2)}</td>
                </tr>
            </tfoot>
        </table>
    `;
}

function renderLibroCompras(parent, db) {
    const compras = (db.gastos || []).filter(g => {
        let dateStr = g['Fecha Gasto'] || '';
        return dateStr.startsWith(currentMonth);
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
            <tr>
                <td>${escapeHtml(date)}</td>
                <td>${escapeHtml(tipo)}</td>
                <td style="font-size:0.8rem; font-family:monospace;">${escapeHtml(numDoc)}</td>
                <td>${escapeHtml(provName)}</td>
                <td style="text-align: right;">$${exentas.toFixed(2)}</td>
                <td style="text-align: right;">$${gravadas.toFixed(2)}</td>
                <td style="text-align: right;">$${iva.toFixed(2)}</td>
                <td style="text-align: right;">$${retencion.toFixed(2)}</td>
                <td style="text-align: right;">$${percepcion.toFixed(2)}</td>
                <td style="text-align: right; font-weight: bold;">$${total.toFixed(2)}</td>
            </tr>
        `;
    }).join('');

    parent.innerHTML = html`
        <table style="width: 100%; min-width: 800px; border-collapse: collapse;">
            <thead>
                <tr style="border-bottom: 1px solid var(--border-color); text-align: left;">
                    <th style="padding: 0.5rem;">Fecha</th>
                    <th style="padding: 0.5rem;">Tipo</th>
                    <th style="padding: 0.5rem;">No. Documento</th>
                    <th style="padding: 0.5rem;">Proveedor</th>
                    <th style="padding: 0.5rem; text-align: right;">Compras Exentas</th>
                    <th style="padding: 0.5rem; text-align: right;">Compras Gravadas</th>
                    <th style="padding: 0.5rem; text-align: right;">IVA (13%)</th>
                    <th style="padding: 0.5rem; text-align: right;">Retención (1%)</th>
                    <th style="padding: 0.5rem; text-align: right;">Percepción (1%)</th>
                    <th style="padding: 0.5rem; text-align: right;">Total</th>
                </tr>
            </thead>
            <tbody>
                ${safe(compras.length === 0 ? '<tr><td colspan="10" style="text-align: center; padding: 1rem; color: var(--text-muted);">No hay compras/gastos registrados en este mes.</td></tr>' : rows)}
            </tbody>
            <tfoot>
                <tr style="font-weight: bold; background: rgba(0,0,0,0.2); border-top: 1px solid var(--border-color);">
                    <td colspan="4" style="text-align: right; padding: 0.5rem;">TOTALES</td>
                    <td style="text-align: right; padding: 0.5rem; color: var(--primary);">$${sumExentas.toFixed(2)}</td>
                    <td style="text-align: right; padding: 0.5rem; color: var(--primary);">$${sumGravadas.toFixed(2)}</td>
                    <td style="text-align: right; padding: 0.5rem; color: var(--primary);">$${sumIva.toFixed(2)}</td>
                    <td style="text-align: right; padding: 0.5rem; color: var(--primary);">$${sumRet.toFixed(2)}</td>
                    <td style="text-align: right; padding: 0.5rem; color: var(--primary);">$${sumPer.toFixed(2)}</td>
                    <td style="text-align: right; padding: 0.5rem; color: var(--danger);">$${sumTotal.toFixed(2)}</td>
                </tr>
            </tfoot>
        </table>
    `;
}

function exportToExcel(db) {
    if (activeLibroTab === 'ventas') {
        const ventas = (db.ventas || []).filter(v => {
            if (!v.fechaHoraTransaccion && !v.fhProcesamiento && !v.Fecha) return false;
            let dateStr = v.fhProcesamiento || v.fechaHoraTransaccion || v.Fecha;
            return dateStr.startsWith(currentMonth);
        });
        
        if (ventas.length === 0) {
            showToast("No hay ventas para exportar.", "warning");
            return;
        }

        const data = ventas.map(v => {
            const tipoDte = v.tipoDte || (v.tipoDocumento === '03' ? '03' : '01');
            let date = v.fhProcesamiento || v.fechaHoraTransaccion || v.Fecha;
            date = date ? date.split('T')[0] : 'N/A';
            const numDoc = v.codigoGeneracion || v.numDoc || 'N/A';
            const clientName = v.cliente_nombre || v.nombreReceptor || v.Nombre || 'Consumidor Final';

            const total = parseFloat(v.montoTotalOperacion || v.totalPagar || v.Total || 0);
            let iva = 0;
            let gravadas = 0;
            let exentas = 0;
            let retencion = parseFloat(v.retencion || v.ivaRetenido || 0);
            let percepcion = parseFloat(v.percepcion || v.ivaPercibido || 0);

            if (tipoDte === '03') {
                if (v.totalGravada) gravadas = parseFloat(v.totalGravada);
                else gravadas = total / 1.13;
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
