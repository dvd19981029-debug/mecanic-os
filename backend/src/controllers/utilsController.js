const xlsx = require('xlsx');

/**
 * Loguea excepciones capturadas del navegador para depuración remota.
 */
function logError(req, res) {
    try {
        console.log("\n❌ [BROWSER EXCEPTION] ❌");
        const err = req.body;
        if (err && typeof err === 'object') {
            console.log(`Message: ${err.message}`);
            console.log(`Source: ${err.source} (Line ${err.lineno}, Col ${err.colno})`);
            if (err.stack) console.log(`Stack Trace:\n${err.stack}`);
        } else {
            console.log(err);
        }
        console.log("-------------------------\n");
        return res.send('Logged');
    } catch (err) {
        console.error("Error logging browser exception:", err);
        return res.status(500).send('Error');
    }
}

/**
 * Exporta un conjunto de datos JSON a un archivo de Excel (.xlsx).
 */
function exportExcel(req, res) {
    try {
        const { filename, data } = req.body;
        if (!Array.isArray(data)) {
            return res.status(400).json({ success: false, message: "Debe proveer una lista de datos en formato JSON para exportar." });
        }

        const worksheet = xlsx.utils.json_to_sheet(data);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "Reporte");
        
        const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.attachment(filename || 'reporte.xlsx');
        return res.send(buffer);
    } catch (err) {
        console.error("Excel Export Error:", err);
        return res.status(500).json({ success: false, message: "Error interno del servidor", details: err.message });
    }
}

module.exports = {
    logError,
    exportExcel
};
