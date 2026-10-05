with open('/Users/luis/.gemini/antigravity/scratch/mecanic-os/frontend/js/utils.js', 'r') as f:
    content = f.read()

start_marker = "// Export report data to Excel natively in the browser"
end_marker = "export function safe("

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    new_func = """// Export report data to Excel natively in the browser (100% Client-Side & Offline Compatible)
export function downloadExcelReport(filename, jsonData) {
    try {
        if (!jsonData || !Array.isArray(jsonData) || jsonData.length === 0) {
            showToast("No hay datos disponibles para exportar", "warning");
            return;
        }

        showToast("Generando reporte para Excel...", "info");

        if (typeof XLSX !== 'undefined') {
            const processedData = jsonData.map(row => {
                const newRow = {};
                for (let key in row) {
                    let val = row[key];
                    if (typeof val === 'string' && key.includes('($)')) {
                        const parsed = parseFloat(val);
                        if (!isNaN(parsed)) {
                            val = parsed;
                        }
                    }
                    newRow[key] = val;
                }
                return newRow;
            });

            const worksheet = XLSX.utils.json_to_sheet(processedData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");
            
            let cleanFilename = filename || 'Reporte';
            cleanFilename = cleanFilename.replace(/\\.xlsx$/i, '').replace(/\\.xls$/i, '').replace(/\\.csv$/i, '');
            
            XLSX.writeFile(workbook, cleanFilename + '.xlsx');
            return;
        }

        console.warn("SheetJS (XLSX) no disponible. Usando fallback CSV.");
        const headers = Object.keys(jsonData[0]);
        let csvContent = headers.join(",") + "\\n";
        
        jsonData.forEach(row => {
            const rowValues = headers.map(h => {
                let cell = row[h] === null || row[h] === undefined ? "" : String(row[h]);
                cell = cell.replace(/"/g, '""');
                return `"${cell}"`;
            });
            csvContent += rowValues.join(",") + "\\n";
        });

        const blob = new Blob(['\\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        
        let cleanFilename = filename || 'Reporte';
        cleanFilename = cleanFilename.replace(/\\.xlsx$/i, '').replace(/\\.xls$/i, '').replace(/\\.csv$/i, '');
        a.download = cleanFilename + '.csv';
        
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100);
        
    } catch (err) {
        console.error("Error exporting to Excel:", err);
        showToast("Error al exportar: " + err.message, "danger");
    }
}

"""
    content = content[:start_idx] + new_func + content[end_idx:]
    with open('/Users/luis/.gemini/antigravity/scratch/mecanic-os/frontend/js/utils.js', 'w') as f:
        f.write(content)
    print("Replaced successfully")
else:
    print(f"Markers not found. start={start_idx}, end={end_idx}")
