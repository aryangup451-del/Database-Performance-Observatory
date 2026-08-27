const mysql = require('mysql2/promise');

class MySQLExecutor {
    constructor(config) {
        this.config = config;
        this.pool = null;
    }

    async connect() {
        if (!this.pool) {
            this.pool = mysql.createPool(this.config);
        }
    }

    async executeQuery(sql) {
        await this.connect();
        const start = performance.now();
        
        try {
            // First run the EXPLAIN
            const [explainResult] = await this.pool.query(`EXPLAIN FORMAT=JSON ${sql}`);
            
            // Then run the actual query for timing and row counts
            const execStart = performance.now();
            const [rows] = await this.pool.query(sql);
            const execEnd = performance.now();
            
            return {
                database: 'mysql',
                execution_time_ms: execEnd - execStart,
                rows_returned: rows.length,
                explain_plan: JSON.parse(explainResult[0].EXPLAIN),
                error: null
            };
        } catch (error) {
            return {
                database: 'mysql',
                error: error.message
            };
        }
    }
}

module.exports = MySQLExecutor;
