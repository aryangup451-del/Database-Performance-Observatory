const sql = require('mssql');

class MSSQLExecutor {
    constructor(config) {
        this.config = {
            user: config.user,
            password: config.password,
            server: config.host,
            port: config.port,
            database: config.database,
            options: {
                encrypt: false,
                trustServerCertificate: true
            }
        };
        this.poolPromise = new sql.ConnectionPool(this.config).connect();
    }

    async executeQuery(query) {
        if (!query.toLowerCase().trim().startsWith('select')) {
            return { error: 'Only SELECT queries are allowed.' };
        }

        try {
            const pool = await this.poolPromise;
            
            // Get Plan
            await pool.request().query('SET SHOWPLAN_ALL ON;');
            const planResult = await pool.request().query(query);
            await pool.request().query('SET SHOWPLAN_ALL OFF;');

            // Execute actual query for timing
            const start = process.hrtime.bigint();
            const actualResult = await pool.request().query(query);
            const end = process.hrtime.bigint();
            
            const executionTimeMs = Number(end - start) / 1000000.0;

            return {
                execution_time_ms: executionTimeMs,
                rows_returned: actualResult.recordset.length,
                explain_plan: planResult.recordset,
                error: null
            };
        } catch (err) {
            return { error: err.message };
        }
    }
}

module.exports = MSSQLExecutor;
