class SQLiteAnalyzer {
    static analyze(explainResult) {
        let scan_type = 'Unknown';
        let rows_scanned = 0;
        let index_used = null;

        // SQLite EXPLAIN QUERY PLAN returns an array of objects like: { id, parent, selectid, detail }
        // Detail contains text like "SCAN TABLE products", "SEARCH TABLE products USING INDEX ..."
        
        if (Array.isArray(explainResult)) {
            for (const step of explainResult) {
                const detail = step.detail ? step.detail.toUpperCase() : '';
                if (detail.includes('SCAN TABLE')) {
                    scan_type = 'Full Table Scan';
                } else if (detail.includes('SEARCH TABLE') && detail.includes('USING INDEX')) {
                    scan_type = 'Index Lookup';
                    const match = step.detail.match(/USING INDEX (.*?)\s/);
                    if (match) index_used = match[1];
                } else if (detail.includes('SEARCH TABLE') && detail.includes('USING INTEGER PRIMARY KEY')) {
                    scan_type = 'Primary Key Lookup';
                    index_used = 'PRIMARY';
                }
            }
        }

        return {
            scan_type,
            rows_scanned, // SQLite EXPLAIN doesn't give row estimates easily
            index_used
        };
    }
}

module.exports = SQLiteAnalyzer;
