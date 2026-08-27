const oracledb = require('oracledb');

class OracleExecutor {
    constructor(config) {
        this.config = {
            user: config.user,
            password: config.password,
            connectString: `${config.host}:${config.port}/${config.database}`
        };
    }

    async executeQuery(query) {
        if (!query.toLowerCase().trim().startsWith('select')) {
            return { error: 'Only SELECT queries are allowed.' };
        }

        let conn;
        try {
            conn = await oracledb.getConnection(this.config);
            
            // EXPLAIN PLAN FOR
            await conn.execute(`EXPLAIN PLAN FOR ${query}`);
            const planResult = await conn.execute(`SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY)`);

            // Execute actual query
            const start = process.hrtime.bigint();
            const actualResult = await conn.execute(query);
            const end = process.hrtime.bigint();
            
            const executionTimeMs = Number(end - start) / 1000000.0;

            return {
                execution_time_ms: executionTimeMs,
                rows_returned: actualResult.rows.length,
                explain_plan: planResult.rows,
                error: null
            };
        } catch (err) {
            return { error: err.message };
        } finally {
            if (conn) {
                try { await conn.close(); } catch (e) {}
            }
        }
    }
}

module.exports = OracleExecutor;
