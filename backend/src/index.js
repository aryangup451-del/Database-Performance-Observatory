require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const crypto = require('crypto');
const redis = require('redis');

const QueryAnalysis = require('./models/QueryAnalysis');
const MySQLExecutor = require('./executors/mysqlExecutor');
const PostgresExecutor = require('./executors/postgresExecutor');
const MySQLAnalyzer = require('./analyzers/mysqlAnalyzer');
const PostgresAnalyzer = require('./analyzers/postgresAnalyzer');
const SQLiteExecutor = require('./executors/sqliteExecutor');
const SQLiteAnalyzer = require('./analyzers/sqliteAnalyzer');
const MariaDBExecutor = require('./executors/mariadbExecutor');
const MariaDBAnalyzer = require('./analyzers/mariadbAnalyzer');
const MSSQLExecutor = require('./executors/mssqlExecutor');
const MSSQLAnalyzer = require('./analyzers/mssqlAnalyzer');
const OracleExecutor = require('./executors/oracleExecutor');
const OracleAnalyzer = require('./analyzers/oracleAnalyzer');
const IndexRecommender = require('./recommenders/indexRecommender');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Redis Client
const redisClient = redis.createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
redisClient.connect().catch(console.error);

// Initialize Executors using the READ ONLY users
const mysqlExec = new MySQLExecutor({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: process.env.MYSQL_PORT || 3307,
    user: process.env.MYSQL_USER || 'dpo_readonly',
    password: process.env.MYSQL_PASSWORD || 'readonly_password',
    database: process.env.MYSQL_DATABASE || 'dpo'
});

const pgExec = new PostgresExecutor({
    host: process.env.PG_HOST || '127.0.0.1',
    port: process.env.PG_PORT || 5432,
    user: process.env.PG_USER || 'dpo_readonly',
    password: process.env.PG_PASSWORD || 'readonly_password',
    database: process.env.PG_DATABASE || 'dpo'
});

const mariadbExec = new MariaDBExecutor({
    host: process.env.MARIADB_HOST || '127.0.0.1',
    port: process.env.MARIADB_PORT || 3308,
    user: process.env.MARIADB_USER || 'dpo_readonly',
    password: process.env.MARIADB_PASSWORD || 'readonly_password',
    database: process.env.MARIADB_DATABASE || 'dpo'
});

const mssqlExec = new MSSQLExecutor({
    host: process.env.MSSQL_HOST || '127.0.0.1',
    port: process.env.MSSQL_PORT || 1433,
    user: process.env.MSSQL_USER || 'sa',
    password: process.env.MSSQL_PASSWORD || 'SuperStrongP@ssw0rd!',
    database: process.env.MSSQL_DATABASE || 'master' // Fallback DB if DPO isn't seeded
});

const oracleExec = new OracleExecutor({
    host: process.env.ORACLE_HOST || '127.0.0.1',
    port: process.env.ORACLE_PORT || 1521,
    user: process.env.ORACLE_USER || 'system',
    password: process.env.ORACLE_PASSWORD || 'readonly_password',
    database: process.env.ORACLE_DATABASE || 'FREEPDB1'
});

const sqliteExec = new SQLiteExecutor('./sqlite.db'); // In-file or memory

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dpo')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB error:', err));

function blockUnsafeQueries(sql) {
    const uppercase = sql.trim().toUpperCase();
    if (!uppercase.startsWith('SELECT') && !uppercase.startsWith('EXPLAIN') && !uppercase.startsWith('WITH')) {
        throw new Error('Only SELECT queries are allowed.');
    }
}

app.post('/api/analyze', async (req, res) => {
    const { query } = req.body;
    
    if (!query || typeof query !== 'string') return res.status(400).json({ error: 'Valid query string required.' });

    try {
        blockUnsafeQueries(query);
        
        const query_hash = crypto.createHash('md5').update(query.trim().toLowerCase()).digest('hex');
        
        // Check Redis Cache
        const cached = await redisClient.get(`analysis:${query_hash}`);
        if (cached) {
            return res.json(JSON.parse(cached));
        }

        // Run concurrently
        const [mysqlResult, pgResult, sqliteResult, mariadbResult, mssqlResult, oracleResult] = await Promise.all([
            mysqlExec.executeQuery(query),
            pgExec.executeQuery(query),
            sqliteExec.executeQuery(query),
            mariadbExec.executeQuery(query),
            mssqlExec.executeQuery(query),
            oracleExec.executeQuery(query)
        ]);

        // Normalize
        const mysqlNorm = mysqlResult.error ? {} : MySQLAnalyzer.analyze(mysqlResult.explain_plan);
        const pgNorm = pgResult.error ? {} : PostgresAnalyzer.analyze(pgResult.explain_plan);
        const sqliteNorm = sqliteResult.error ? {} : SQLiteAnalyzer.analyze(sqliteResult.explain_plan);
        const mariadbNorm = mariadbResult.error ? {} : MariaDBAnalyzer.analyze(mariadbResult.explain_plan);
        const mssqlNorm = mssqlResult.error ? {} : MSSQLAnalyzer.analyze(mssqlResult.explain_plan);
        const oracleNorm = oracleResult.error ? {} : OracleAnalyzer.analyze(oracleResult.explain_plan);

        // Build Response Document
        const recommendations = IndexRecommender.recommend(query, mysqlNorm, pgNorm);

        // Find fastest logic
        const times = {
            mysql: mysqlResult.execution_time_ms || 999999,
            postgresql: pgResult.execution_time_ms || 999999,
            sqlite: sqliteResult.execution_time_ms || 999999,
            mariadb: mariadbResult.execution_time_ms || 999999,
            mssql: mssqlResult.execution_time_ms || 999999,
            oracle: oracleResult.execution_time_ms || 999999
        };
        
        let faster_db = 'mysql';
        let minTime = times.mysql;
        for (const [db, time] of Object.entries(times)) {
            if (time > 0 && time < minTime) {
                minTime = time;
                faster_db = db;
            }
        }
        
        const sortedTimes = Object.values(times).filter(t => t < 999999).sort((a,b)=>a-b);
        const speed_ratio = sortedTimes.length > 1 ? (sortedTimes[1] / sortedTimes[0]) : 1;

        const analysisDoc = {
            query_text: query,
            query_hash,
            results: {
                mysql: { ...mysqlResult, ...mysqlNorm },
                postgresql: { ...pgResult, ...pgNorm },
                sqlite: { ...sqliteResult, ...sqliteNorm },
                mariadb: { ...mariadbResult, ...mariadbNorm },
                mssql: { ...mssqlResult, ...mssqlNorm },
                oracle: { ...oracleResult, ...oracleNorm }
            },
            comparison: { faster_db, speed_ratio },
            recommendations
        };


        // Save to Mongo
        const savedAnalysis = await QueryAnalysis.create(analysisDoc);
        
        // Cache in Redis for 1 hour
        await redisClient.setEx(`analysis:${query_hash}`, 3600, JSON.stringify(savedAnalysis));

        // Add to Slow Query Leaderboard
        if (!mysqlResult.error && mysqlResult.execution_time_ms > 0) {
            await redisClient.zAdd('leaderboard:slow_queries', [{ score: mysqlResult.execution_time_ms, value: query }]);
        }
        if (!pgResult.error && pgResult.execution_time_ms > 0) {
            await redisClient.zAdd('leaderboard:slow_queries', [{ score: pgResult.execution_time_ms, value: query }]);
        }

        res.json(savedAnalysis);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.get('/api/history', async (req, res) => {
    try {
        const history = await QueryAnalysis.find()
            .sort({ submitted_at: -1 })
            .limit(50);
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/leaderboard', async (req, res) => {
    try {
        // Fetch top 10 slowest queries from Redis
        const slowest = await redisClient.zRangeWithScores('leaderboard:slow_queries', 0, 9, { REV: true });
        res.json(slowest);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/trends', async (req, res) => {
    try {
        // Aggregate which DB was faster
        const trends = await QueryAnalysis.aggregate([
            { $match: { "comparison.faster_db": { $exists: true } } },
            { $group: {
                _id: "$comparison.faster_db",
                count: { $sum: 1 },
                avg_speed_ratio: { $avg: "$comparison.speed_ratio" }
            }},
            { $sort: { count: -1 } }
        ]);
        res.json(trends);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`DPO Backend running on port ${PORT}`);
});
