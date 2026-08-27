class IndexRecommender {
    static recommend(queryText, mysqlNorm, pgNorm) {
        const recommendations = [];

        // Simple heuristic: If it's a full table scan and rows scanned > 1000, recommend an index.
        // We'll parse the basic WHERE clause from the query text for a simple suggestion.
        
        const uppercaseQuery = queryText.toUpperCase();
        const whereIndex = uppercaseQuery.indexOf('WHERE');
        
        let potentialColumn = null;
        let potentialTable = null;

        if (whereIndex !== -1) {
            // Extract the first condition after WHERE (e.g., WHERE total_amount > 1000)
            const afterWhere = queryText.substring(whereIndex + 5).trim();
            const words = afterWhere.split(/[ \n\r\t]+|<|>|=|!/);
            if (words.length > 0) {
                potentialColumn = words[0].trim();
            }
        }

        // Try to extract table name
        const fromIndex = uppercaseQuery.indexOf('FROM');
        if (fromIndex !== -1) {
            const afterFrom = queryText.substring(fromIndex + 4).trim();
            const words = afterFrom.split(/[ \n\r\t]+/);
            if (words.length > 0) {
                potentialTable = words[0].trim();
            }
        }

        if (mysqlNorm && mysqlNorm.scan_type === 'Full Table Scan' && mysqlNorm.rows_scanned > 100) {
            let suggestion = 'Consider creating an index to avoid a Full Table Scan on MySQL.';
            if (potentialTable && potentialColumn) {
                suggestion = `CREATE INDEX idx_${potentialTable}_${potentialColumn} ON ${potentialTable}(${potentialColumn});`;
            }
            recommendations.push({
                type: 'create_index',
                database: 'mysql',
                suggestion
            });
        }

        if (pgNorm && pgNorm.scan_type === 'Full Table Scan' && pgNorm.rows_scanned > 100) {
             let suggestion = 'Consider creating an index to avoid a Sequential Scan on PostgreSQL.';
             if (potentialTable && potentialColumn) {
                 suggestion = `CREATE INDEX idx_${potentialTable}_${potentialColumn} ON ${potentialTable}(${potentialColumn});`;
             }
             recommendations.push({
                 type: 'create_index',
                 database: 'postgresql',
                 suggestion
             });
        }

        return recommendations;
    }
}

module.exports = IndexRecommender;
