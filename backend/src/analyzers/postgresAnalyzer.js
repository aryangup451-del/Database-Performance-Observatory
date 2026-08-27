class PostgresAnalyzer {
    static analyze(rawPlan) {
        if (!rawPlan || !rawPlan.Plan) return null;

        const rootPlan = rawPlan.Plan;
        
        let scan_type = rootPlan['Node Type']; // e.g. "Seq Scan", "Index Scan"
        let estimated_rows = rootPlan['Plan Rows'];
        let index_used = rootPlan['Index Name'] || null;

        // Map to standard terminology
        if (scan_type === 'Seq Scan') scan_type = 'Full Table Scan';
        // 'Index Scan' and 'Index Only Scan' are already clear

        return {
            scan_type,
            rows_scanned: estimated_rows,
            index_used
        };
    }
}

module.exports = PostgresAnalyzer;
