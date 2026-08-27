const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');

class SQLiteExecutor {
    constructor(dbPath = ':memory:') {
        this.db = new sqlite3.Database(dbPath);
        this.allAsync = promisify(this.db.all.bind(this.db));
    }

    async executeQuery(query) {
        if (!query.toLowerCase().trim().startsWith('select')) {
            return { error: 'Only SELECT queries are allowed.' };
        }

        const start = process.hrtime.bigint();
        try {
            // Run EXPLAIN QUERY PLAN
            const explainResult = await this.allAsync(`EXPLAIN QUERY PLAN ${query}`);
            
            // Run actual query
            const actualResult = await this.allAsync(query);
            
            const end = process.hrtime.bigint();
            const executionTimeMs = Number(end - start) / 1000000.0;

            return {
                execution_time_ms: executionTimeMs,
                rows_returned: actualResult.length,
                explain_plan: explainResult,
                error: null
            };
        } catch (err) {
            return {
                error: err.message
            };
        }
    }
}

module.exports = SQLiteExecutor;
