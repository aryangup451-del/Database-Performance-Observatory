const mongoose = require('mongoose');

const QueryAnalysisSchema = new mongoose.Schema({
    query_text: { type: String, required: true },
    query_hash: { type: String, required: true, index: true },
    submitted_at: { type: Date, default: Date.now },
    submitted_by: { type: String, default: 'anonymous' },

    results: {
        type: Map,
        of: new mongoose.Schema({
            execution_time_ms: Number,
            planning_time_ms: Number,
            rows_scanned: Number,
            rows_returned: Number,
            index_used: String,
            scan_type: String,
            explain_plan: mongoose.Schema.Types.Mixed, // Raw JSON
            error: String
        }, { _id: false })
    },

    comparison: {
        faster_db: String,
        speed_ratio: Number
    },

    recommendations: [{
        type: { type: String }, // e.g. "create_index"
        database: String,
        suggestion: String
    }],

    tags: [String]
});

// TTL Index for auto-cleanup (e.g., expire after 90 days)
QueryAnalysisSchema.index({ submitted_at: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model('QueryAnalysis', QueryAnalysisSchema);
