/**
 * Correlativo de presupuestos por taller.
 * El último número usado se guarda en db.contadores.presupuestos y NUNCA baja:
 * si un presupuesto se elimina o se rechaza, su número no se vuelve a usar.
 */

function readCounter(db) {
    const stored = parseInt(db && db.contadores && db.contadores.presupuestos) || 0;
    const budgets = (db && db.presupuestos) || [];
    const maxExisting = budgets.reduce((m, b) => Math.max(m, parseInt(b && b.Correlativo) || 0), 0);
    let last = Math.max(stored, maxExisting);
    // Primera vez en un taller con presupuestos previos sin número: continuar desde la cantidad existente
    if (last === 0 && budgets.length > 0) last = budgets.length;
    return last;
}

// Número que tendría el próximo presupuesto (no lo consume)
export function peekNextBudgetCorrelativo(db) {
    return readCounter(db) + 1;
}

// Asigna el siguiente correlativo al presupuesto (si aún no tiene) y lo consume
export function assignBudgetCorrelativo(db, budget) {
    if (!budget) return null;
    if (parseInt(budget.Correlativo) > 0) return budget.Correlativo;
    const next = readCounter(db) + 1;
    if (!db.contadores || typeof db.contadores !== 'object') db.contadores = {};
    db.contadores.presupuestos = next;
    budget.Correlativo = next;
    return next;
}
