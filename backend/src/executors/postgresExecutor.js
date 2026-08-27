const { Pool } = require('pg');

class PostgresExecutor {
    constructor(config) {
        this.config = config;
        this.pool = null;
    }

    async connect() {
        if (!this.pool) {
            this.pool = new Pool(this.config);
        }
    }

    async executeQuery(sql) {
        await this.connect();
        try {
            // PostgreSQL can do EXPLAIN ANALYZE to run and explain at once
            const client = await this.pool.connect();
            try {
                // We use FORMAT JSON to get parsable output
                const result = await client.query(`EXPLAIN (ANALYZE, FORMAT JSON) ${sql}`);
                const explainData = result.rows[0]['QUERY PLAN'][0];
                
                return {
                    database: 'postgresql',
                    execution_time_ms: explainData['Execution Time'],
                    planning_time_ms: explainData['Planning Time'],
                    rows_returned: explainData['Plan']['Actual Rows'],
                    explain_plan: explainData,
                    error: null
                };
            } finally {
                client.release();
            }
        } catch (error) {
            return {
                database: 'postgresql',
                error: error.message
            };
        }
    }
}

module.exports = PostgresExecutor;
