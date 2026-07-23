/**
 * Mecanic OS - Business Logic Helper Module
 * Contains pure mathematical and domain business calculations.
 */

// Helper: Calculate total for any budget in db
export function getBudgetGrandTotal(budget, db) {
    if (!db.detalle_productos) db.detalle_productos = db['21 Detalle Presupuesto Producto'] || [];
    if (!db.detalle_mano_obra) db.detalle_mano_obra = db['11 Detalle Mano de Obra'] || [];

    const products = db.detalle_productos.filter(dp => dp['ID_Presupuesto DPP'] === budget['ID Presupuesto']);
    const labor = db.detalle_mano_obra.filter(dm => dm['ID_Presupuesto MO'] === budget['ID Presupuesto']);

    const sumProd = products.reduce((sum, p) => sum + parseFloat(p.PrecioUnitario || 0) * parseInt(p.Cantidad || 1), 0);
    const sumLab = labor.reduce((sum, l) => sum + parseFloat(l.PrecioUnitario || 0) * parseInt(l.Cantidad || 1), 0);
    const subtotal = sumProd + sumLab;
    
    // Manual discount
    let discount = parseFloat(budget.Descuento || 0);
    
    // Dynamic Promotion discount
    if (budget.ID_Promocion) {
        const promo = (db.promociones || []).find(p => p.ID_Promocion === budget.ID_Promocion);
        if (promo) {
            let promoDiscount = 0;
            if (promo.Tipo === 'desc_mano_obra') {
                promoDiscount = sumLab * (parseFloat(promo.Valor || 0) / 100);
            } else if (promo.Tipo === 'desc_productos') {
                promoDiscount = sumProd * (parseFloat(promo.Valor || 0) / 100);
            } else if (promo.Tipo === 'monto_fijo') {
                promoDiscount = parseFloat(promo.Valor || 0);
            }
            discount = Math.max(discount, promoDiscount);
        }
    }
    
    discount = Math.min(discount, subtotal);
    const subtotalConDescuento = Math.max(0, subtotal - discount);
    
    const preciosConIva = db.saas_state && db.saas_state.workshopData && db.saas_state.workshopData.features && db.saas_state.workshopData.features.precios_con_iva === true;
    const taxRate = parseFloat(budget['% Impuesto'] !== undefined ? budget['% Impuesto'] : 0.13);

    let iva = 0;
    let baseParaImpuestos = subtotalConDescuento;
    let grandTotal = 0;

    if (preciosConIva) {
        grandTotal = subtotalConDescuento;
        baseParaImpuestos = subtotalConDescuento / 1.13;
        iva = subtotalConDescuento - baseParaImpuestos;
    } else {
        iva = subtotalConDescuento * taxRate;
        grandTotal = subtotalConDescuento + iva;
        baseParaImpuestos = subtotalConDescuento;
    }

    let retVal = 0;
    let percVal = 0;
    const client = db.clientes.find(c => c.Codigo_Cliente === budget.Codigo_Cliente) || { AplicaRetencion: 0, AplicaPercepcion: 0 };
    if (client.AplicaRetencion > 0 && baseParaImpuestos >= 100.00) {
        retVal = baseParaImpuestos * parseFloat(client.AplicaRetencion);
    }
    if (client.AplicaPercepcion > 0) {
        percVal = baseParaImpuestos * parseFloat(client.AplicaPercepcion);
    }

    const rawTotal = grandTotal + percVal - retVal;
    return Math.round(rawTotal * 100) / 100;
}

// Helper: Calculate client unpaid credit balance
export function getClientPendingBalance(clientCode, db) {
    // 1. Get all budgets for client that are CREDIT, status is FACTURADO (Estado === 3) and NOT marked as paid (Pagado? !== 'SI')
    const unpaidBudgets = db.presupuestos.filter(p => 
        p.Codigo_Cliente === clientCode && 
        (p.Estado === 3 || p.Estado === '3') && 
        p.Condicion === 'CREDITO' && 
        p['Pagado?'] !== 'SI'
    );
    
    // All abonos for this client
    const clientAbonos = (db['30 Abonos Creditos'] || []).filter(ab => ab.Codigo_Cliente === clientCode);
    
    // Sum remaining balances of unpaid budgets
    let totalUnpaidRemaining = 0;
    unpaidBudgets.forEach(b => {
        const budgetId = b['ID Presupuesto'];
        const budgetTotal = getBudgetGrandTotal(b, db);
        
        // Sum abonos linked to this specific budget (by ID_Presupuesto or fallback in Observaciones)
        const linkedAbonos = clientAbonos.filter(ab => 
            ab.ID_Presupuesto === budgetId || 
            (ab.Observaciones && ab.Observaciones.includes(`presupuesto ${budgetId}`))
        );
        const totalLinkedAmount = linkedAbonos.reduce((sum, ab) => sum + parseFloat(ab['Monto Abono'] || ab.Monto || 0), 0);
        
        totalUnpaidRemaining += Math.max(0, budgetTotal - totalLinkedAmount);
    });
    
    // Sum general abonos (not linked to any budget, or linked to a budget that is NOT in unpaidBudgets, meaning it is paid)
    const generalAbonos = clientAbonos.filter(ab => {
        if (ab.ID_Presupuesto) {
            return false;
        }
        if (ab.Observaciones && ab.Observaciones.includes('presupuesto ')) {
            return false;
        }
        return true;
    });
    
    const totalGeneralAbonos = generalAbonos.reduce((sum, ab) => sum + parseFloat(ab['Monto Abono'] || ab.Monto || 0), 0);
    
    return Math.max(0, totalUnpaidRemaining - totalGeneralAbonos);
}

// Helper: Calculate payroll values for El Salvador
export function calculateElSalvadorPeriodPayroll(baseSalary, extraEarnings = 0, periodType = 'M') {
    // Si es quincenal, el salario base se divide entre 2 para el período
    const currentBase = periodType === 'M' ? baseSalary : baseSalary / 2;
    const totalGravado = currentBase + extraEarnings;
    
    // Topes de ISSS según período
    const isssLimit = periodType === 'M' ? 1000 : 500;
    
    const isssEmployee = Math.min(totalGravado, isssLimit) * 0.03;
    const afpEmployee = totalGravado * 0.0725;
    
    const rentBase = totalGravado - isssEmployee - afpEmployee;
    let isr = 0;
    
    if (periodType === 'M') {
        // ISR Mensual
        if (rentBase > 2038.10) {
            isr = (rentBase - 2038.10) * 0.30 + 288.57;
        } else if (rentBase > 895.24) {
            isr = (rentBase - 895.24) * 0.20 + 60.00;
        } else if (rentBase > 472.00) {
            isr = (rentBase - 472.00) * 0.10 + 17.67;
        }
    } else {
        // ISR Quincenal
        if (rentBase > 1019.05) {
            isr = (rentBase - 1019.05) * 0.30 + 144.28;
        } else if (rentBase > 447.62) {
            isr = (rentBase - 447.62) * 0.20 + 30.00;
        } else if (rentBase > 236.00) {
            isr = (rentBase - 236.00) * 0.10 + 8.83;
        }
    }
    
    const totalDeductions = isssEmployee + afpEmployee + isr;
    const netSalary = totalGravado - totalDeductions;
    
    const isssEmployer = Math.min(totalGravado, isssLimit) * 0.075;
    const afpEmployer = totalGravado * 0.0875;
    const insaforpLimit = periodType === 'M' ? 1000 : 500;
    const insaforp = totalGravado >= insaforpLimit ? totalGravado * 0.01 : 0;
    const employerCost = totalGravado + isssEmployer + afpEmployer + insaforp;
    
    return {
        totalGravado,
        isssEmployee,
        afpEmployee,
        isr,
        totalDeductions,
        netSalary,
        isssEmployer,
        afpEmployer,
        insaforp,
        employerCost
    };
}
