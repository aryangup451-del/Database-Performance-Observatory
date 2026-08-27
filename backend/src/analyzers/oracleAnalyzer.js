class OracleAnalyzer {
    static analyze(explainResult) {
        let scan_type = 'Unknown';
        let rows_scanned = 0;
        let index_used = null;

        if (Array.isArray(explainResult)) {
            for (const row of explainResult) {
                const planLine = row.PLAN_TABLE_OUTPUT || '';
                
                if (planLine.includes('TABLE ACCESS FULL')) {
                    scan_type = 'Full Table Scan';
                } else if (planLine.includes('INDEX UNIQUE SCAN') || planLine.includes('INDEX RANGE SCAN')) {
                    scan_type = 'Index Lookup';
                }
            }
        }

        return {
            scan_type,
            rows_scanned,
            index_used
        };
    }
}

module.exports = OracleAnalyzer;
