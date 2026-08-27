class MySQLAnalyzer {
    static analyze(rawPlan) {
        if (!rawPlan || !rawPlan.query_block) return null;

        let scan_type = 'Unknown';
        let estimated_rows = 0;
        let index_used = null;

        // Simplify for Phase 2: just looking at the primary table access
        const tableNode = rawPlan.query_block.table;
        
        if (tableNode) {
            scan_type = tableNode.access_type || tableNode.type; // e.g. "ALL", "index", "range"
            
            // Map to standard terminology
            if (scan_type === 'ALL') scan_type = 'Full Table Scan';
            else if (scan_type === 'index') scan_type = 'Full Index Scan';
            else if (scan_type === 'ref' || scan_type === 'eq_ref') scan_type = 'Index Lookup';
            else if (scan_type === 'range') scan_type = 'Index Range Scan';

            estimated_rows = tableNode.rows_examined_per_scan || tableNode.rows || 0;
            index_used = tableNode.key || null;
        } else if (rawPlan.query_block.nested_loop) {
            // Very simple fallback for JOINs
            scan_type = 'Nested Loop Join';
            estimated_rows = rawPlan.query_block.nested_loop.reduce((acc, curr) => {
                const node = curr.table;
                return acc + (node ? (node.rows_examined_per_scan || node.rows || 0) : 0);
            }, 0);
        }

        return {
            scan_type,
            rows_scanned: estimated_rows,
            index_used
        };
    }
}

module.exports = MySQLAnalyzer;
