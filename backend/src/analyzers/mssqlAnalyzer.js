class MSSQLAnalyzer {
    static analyze(explainResult) {
        let scan_type = 'Unknown';
        let rows_scanned = 0;
        let index_used = null;

        if (Array.isArray(explainResult)) {
            for (const row of explainResult) {
                const op = row.PhysicalOp || '';
                const stmt = row.Argument || '';

                if (op === 'Table Scan' || op === 'Clustered Index Scan') {
                    scan_type = 'Full Table Scan';
                    if (row.EstimateRows) rows_scanned += parseFloat(row.EstimateRows);
                } else if (op.includes('Index Seek')) {
                    scan_type = 'Index Lookup';
                    if (stmt.includes('OBJECT:')) {
                        const match = stmt.match(/OBJECT:\(\[.*?\]\.\[.*?\]\.\[(.*?)\]\)/);
                        if (match) index_used = match[1];
                    }
                }
            }
        }

        return {
            scan_type,
            rows_scanned: Math.round(rows_scanned) || 0,
            index_used
        };
    }
}

module.exports = MSSQLAnalyzer;
