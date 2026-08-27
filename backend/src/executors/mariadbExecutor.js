const mariadb = require('mariadb');

class MariaDBExecutor {
    constructor(config) {
        this.pool = mariadb.createPool({
            host: config.host,
            port: config.port,
            user: config.user,
            password: config.password,
            database: config.database,
            connectionLimit: 5
        });
    }

    async executeQuery(query) {
        if (!query.toLowerCase().trim().startsWith('select')) {
            return { error: 'Only SELECT queries are allowed.' };
        }

        let conn;
        try {
            conn = await this.pool.getConnection();
            const start = process.hrtime.bigint();
            
            // MariaDB supports EXPLAIN FORMAT=JSON just like MySQL 8
            const explainResult = await conn.query(`EXPLAIN FORMAT=JSON ${query}`);
            
            const actualResult = await conn.query(query);
            
            const end = process.hrtime.bigint();
            const executionTimeMs = Number(end - start) / 1000000.0;

            return {
                execution_time_ms: executionTimeMs,
                rows_returned: actualResult.length,
                explain_plan: typeof explainResult[0] === 'string' ? JSON.parse(explainResult[0]) : (explainResult[0].EXPLAIN ? JSON.parse(explainResult[0].EXPLAIN) : explainResult),
                error: null
            };
        } catch (err) {
            return { error: err.message };
        } finally {
            if (conn) conn.release();
        }
    }
}

module.exports = MariaDBExecutor;
