import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { Database, Zap, TrendingUp, Clock, History, Play, AlertTriangle, CheckCircle, Search, LayoutDashboard, Sun, Moon } from 'lucide-react';

const API_BASE = 'http://localhost:3001/api';

const DB_INFO = {
  mysql: { name: 'MySQL', logo: 'https://labs.mysql.com/common/logos/mysql-logo.svg?v2', color: 'from-blue-400 to-blue-600', shadow: 'shadow-blue-900/5' },
  postgresql: { name: 'PostgreSQL', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/29/Postgresql_elephant.svg', color: 'from-indigo-400 to-indigo-600', shadow: 'shadow-indigo-900/5' },
  sqlite: { name: 'SQLite', logo: 'https://upload.wikimedia.org/wikipedia/commons/3/38/SQLite370.svg', color: 'from-sky-400 to-sky-600', shadow: 'shadow-sky-900/5' },
  mariadb: { name: 'MariaDB', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/91/MariaDB_Foundation_logo.svg', color: 'from-blue-300 to-sky-500', shadow: 'shadow-blue-900/5' },
  mssql: { name: 'SQL Server', logo: 'https://upload.wikimedia.org/wikipedia/en/2/28/Microsoft_SQL_Server_Logo.svg', color: 'from-red-400 to-rose-600', shadow: 'shadow-red-900/5' },
  oracle: { name: 'Oracle DB', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/50/Oracle_logo.svg', color: 'from-red-500 to-red-700', shadow: 'shadow-red-900/5' },
  db2: { name: 'IBM DB2', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg', color: 'from-blue-600 to-blue-800', shadow: 'shadow-blue-900/5' },
  cloudsql: { name: 'Cloud SQL', logo: 'https://www.gstatic.com/images/branding/product/2x/cloud_sql_64dp.png', color: 'from-blue-400 to-blue-600', shadow: 'shadow-blue-900/5' },
  snowflake: { name: 'Snowflake', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Snowflake_Logo.svg', color: 'from-sky-300 to-blue-500', shadow: 'shadow-sky-900/5' }
};

function App() {
  const [query, setQuery] = useState('SELECT p1.category, COUNT(*)\nFROM products p1 \nCROSS JOIN products p2 \nWHERE p1.product_id <= 2000 AND p2.product_id <= 2000 \nGROUP BY p1.category;');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('workspace'); 
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const [historyData, setHistoryData] = useState([]);
  const [leaderboardData, setLeaderboardData] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
    }
  }, []);

  const toggleDarkMode = () => {
    const newVal = !isDarkMode;
    setIsDarkMode(newVal);
    localStorage.setItem('theme', newVal ? 'dark' : 'light');
  };

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API_BASE}/analyze`, { query });
      setAnalysis(res.data);
      setActiveTab('workspace');
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      axios.get(`${API_BASE}/history`).then(res => setHistoryData(res.data)).catch(console.error);
    }
    if (activeTab === 'leaderboard') {
      axios.get(`${API_BASE}/leaderboard`).then(res => setLeaderboardData(res.data)).catch(console.error);
    }
  }, [activeTab]);

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen pb-12 flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-300 font-sans selection:bg-indigo-200 dark:selection:bg-indigo-900">
        
        {/* PREMIUM DARK NAVBAR */}
        <header className="bg-slate-900 dark:bg-slate-950 border-b border-slate-800 shadow-lg sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg shadow-inner">
                <Database className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-wide">DPO <span className="font-normal text-slate-400">| Perf Observatory</span></h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <nav className="flex space-x-1 bg-slate-800/50 p-1 rounded-lg border border-slate-700/50 hidden md:flex">
                <button onClick={() => setActiveTab('workspace')} className={`flex items-center px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${activeTab === 'workspace' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}>
                  <LayoutDashboard className="w-4 h-4 mr-2"/> Workspace
                </button>
                <button onClick={() => setActiveTab('history')} className={`flex items-center px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${activeTab === 'history' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}>
                  <History className="w-4 h-4 mr-2"/> History
                </button>
                <button onClick={() => setActiveTab('leaderboard')} className={`flex items-center px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${activeTab === 'leaderboard' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}>
                  <Clock className="w-4 h-4 mr-2"/> Leaderboard
                </button>
              </nav>

              <button 
                onClick={toggleDarkMode} 
                className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                title="Toggle Theme"
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-8">
          
          {/* WORKSPACE TAB */}
          {activeTab === 'workspace' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              
              {/* EDITOR CARD */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800 overflow-hidden ring-1 ring-slate-900/5 dark:ring-slate-100/5 transition-colors">
                <div className="bg-slate-50/80 dark:bg-slate-800/80 px-5 py-3 border-b border-slate-200/60 dark:border-slate-700 flex items-center justify-between transition-colors">
                  <div className="flex items-center text-slate-700 dark:text-slate-300 font-semibold text-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2 shadow-sm"></span>
                    SQL Editor
                  </div>
                </div>
                <div className="p-4 grid grid-cols-1 lg:grid-cols-4 gap-4 bg-white dark:bg-slate-900 transition-colors">
                  <div className="lg:col-span-3 rounded-xl border border-slate-200 dark:border-slate-700 focus-within:border-indigo-400 dark:focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-900/50 transition-all overflow-hidden shadow-inner bg-slate-50 dark:bg-slate-950">
                    <CodeMirror
                      value={query}
                      height="180px"
                      extensions={[sql()]}
                      onChange={(value) => setQuery(value)}
                      theme={isDarkMode ? 'dark' : 'light'}
                      className="p-2"
                    />
                  </div>
                  <div className="lg:col-span-1 flex flex-col justify-center space-y-3">
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/50 text-center transition-colors">
                      <Zap className="w-6 h-6 text-indigo-500 mx-auto mb-2"/>
                      <p className="text-xs text-indigo-900 dark:text-indigo-200 font-medium leading-relaxed">Executes concurrently across multiple engine types.</p>
                    </div>
                    <button 
                      onClick={runAnalysis}
                      disabled={loading}
                      className="w-full relative group overflow-hidden rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold h-14 shadow-md disabled:opacity-70 transition-all hover:shadow-lg hover:bg-slate-800 dark:hover:bg-slate-700 border border-transparent dark:border-slate-700"
                    >
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <span className="relative flex items-center justify-center">
                        {loading ? (
                          <span className="flex items-center"><Search className="w-5 h-5 mr-2 animate-spin"/> Analyzing...</span>
                        ) : (
                          <><Play className="w-5 h-5 mr-2 fill-current"/> Run Analysis</>
                        )}
                      </span>
                    </button>
                  </div>
                </div>
                {error && (
                  <div className="px-5 py-4 bg-red-50 dark:bg-red-900/20 border-t border-red-100 dark:border-red-800/30 text-red-600 dark:text-red-400 text-sm font-medium flex items-center transition-colors">
                    <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0"/> {error}
                  </div>
                )}
              </div>

              {/* RESULTS STATE */}
              {analysis ? (
                <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500 fade-in">
                  
                  {/* WINNER BANNER */}
                  {analysis.comparison && (
                    <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-900/50 p-6 flex items-center justify-between transition-colors">
                      <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-emerald-50 dark:from-emerald-900/20 to-transparent pointer-events-none"></div>
                      <div className="flex items-center space-x-4 relative z-10">
                        <div className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 p-3 rounded-full shadow-sm">
                          <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                          <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight flex items-center transition-colors">
                            <span className="capitalize text-emerald-600 dark:text-emerald-400 mr-2">{DB_INFO[analysis.comparison.faster_db]?.name || analysis.comparison.faster_db}</span> won the race!
                          </h2>
                          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5 transition-colors">
                            Executed <strong className="text-slate-800 dark:text-slate-200 font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded transition-colors">{(analysis.comparison.speed_ratio).toFixed(1)}x</strong> faster than the closest competitor.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* RECOMMENDATIONS GRID */}
                  {analysis?.recommendations && analysis.recommendations.length > 0 && (
                    <div className="bg-gradient-to-br from-amber-50 dark:from-amber-900/20 to-orange-50 dark:to-orange-900/10 rounded-2xl p-6 border border-amber-200/60 dark:border-amber-800/50 shadow-sm transition-colors">
                      <h3 className="text-sm font-bold text-amber-800 dark:text-amber-500 uppercase tracking-wider mb-4 flex items-center transition-colors">
                        <Zap className="w-4 h-4 mr-2 text-amber-600 dark:text-amber-500"/> Optimization Insights
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {analysis.recommendations.map((rec, i) => (
                          <div key={i} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl border border-amber-200/80 dark:border-amber-700/50 p-5 shadow-sm transition-colors">
                            <div className="flex items-center mb-3">
                              <span className="text-xs font-bold text-white bg-amber-500 dark:bg-amber-600 px-2.5 py-1 rounded-full uppercase tracking-wide shadow-sm">
                                {DB_INFO[rec.database]?.name || rec.database} Hint
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 font-medium transition-colors">A full table scan was detected. Applying this index could yield massive speedups:</p>
                            <code className="block bg-slate-900 text-emerald-400 text-sm p-3.5 rounded-lg font-mono overflow-x-auto shadow-inner border border-slate-800">
                              {rec.suggestion}
                            </code>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ENGINE COMPARISON CARDS - DYNAMIC GRID */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {Object.entries(analysis.results || {}).map(([dbKey, result]) => {
                      const info = DB_INFO[dbKey] || { name: dbKey, logo: '', color: 'from-slate-400 to-slate-600', shadow: 'shadow-slate-900/5' };
                      return (
                        <div key={dbKey} className={`bg-white dark:bg-slate-900 rounded-2xl shadow-md ${info.shadow} dark:shadow-none border border-slate-200 dark:border-slate-800 overflow-hidden relative group transition-colors`}>
                          <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${info.color}`}></div>
                          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30 transition-colors">
                            <div className="flex items-center space-x-4">
                              {info.logo ? (
                                <img src={info.logo} alt={info.name} className={`h-8 object-contain w-auto ${isDarkMode && dbKey === 'mysql' ? 'brightness-200 grayscale contrast-200' : ''}`} />
                              ) : (
                                <Database className="h-6 w-6 text-slate-400"/>
                              )}
                              <span className="font-bold text-slate-800 dark:text-slate-100 text-lg transition-colors">{info.name}</span>
                            </div>
                            {result.error ? <AlertTriangle className="text-red-500 w-5 h-5"/> : <CheckCircle className="text-emerald-500 w-5 h-5"/>}
                          </div>
                          <div className="p-6">
                            {result.error ? (
                              <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 p-4 rounded-xl text-red-600 dark:text-red-400 font-mono text-sm shadow-inner transition-colors break-words">
                                {result.error}
                              </div>
                            ) : (
                              <div className="space-y-6">
                                <div className="text-center py-6">
                                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 transition-colors">Execution Time</p>
                                  <div className="text-5xl font-black text-slate-800 dark:text-slate-100 font-mono tracking-tighter transition-colors">
                                    {result.execution_time_ms?.toFixed(2) || '0.00'}<span className="text-xl text-slate-400 dark:text-slate-500 font-normal ml-1">ms</span>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-xl transition-colors">
                                    <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 transition-colors">Scan Strategy</span>
                                    <span className="text-slate-700 dark:text-slate-300 font-semibold text-sm transition-colors truncate block" title={result.scan_type}>{result.scan_type || 'Unknown'}</span>
                                  </div>
                                  <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-xl transition-colors">
                                    <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 transition-colors">Rows Scanned</span>
                                    <span className="text-slate-800 dark:text-slate-200 font-bold font-mono text-lg transition-colors block truncate">{result.rows_scanned?.toLocaleString() || 0}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* EMPTY STATE */
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-16 flex flex-col items-center justify-center text-center mt-6 transition-colors">
                  <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner ring-1 ring-slate-100 dark:ring-slate-700 transition-colors">
                    <Database className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-3 tracking-tight transition-colors">Ready for Telemetry</h3>
                  <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto text-sm leading-relaxed transition-colors">
                    Enter a SQL query in the workspace above. DPO will simultaneously execute it across all connected databases, parsing their EXPLAIN plans to reveal underlying performance characteristics.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* HISTORY TAB */}
          {activeTab === 'history' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in duration-300 transition-colors">
              <div className="bg-slate-900 px-6 py-5 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center"><History className="w-5 h-5 mr-3 text-indigo-400"/> Query History</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800 transition-colors">
                    <tr>
                      <th className="px-6 py-4">Timestamp</th>
                      <th className="px-6 py-4">SQL Query</th>
                      <th className="px-6 py-4 text-center">Fastest Engine</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {historyData.map(h => (
                      <tr key={h._id} className="hover:bg-indigo-50/50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium">{new Date(h.submitted_at).toLocaleString()}</td>
                        <td className="px-6 py-4 font-mono text-[11px] text-slate-600 dark:text-slate-300 truncate max-w-sm" title={h.query_text}>{h.query_text}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800`}>
                            {DB_INFO[h.comparison?.faster_db]?.name || h.comparison?.faster_db || 'N/A'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {historyData.length === 0 && (
                      <tr>
                        <td colSpan="3" className="px-6 py-16 text-center text-slate-400 font-medium">No history recorded yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* LEADERBOARD TAB */}
          {activeTab === 'leaderboard' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in duration-300 transition-colors">
              <div className="bg-slate-900 px-6 py-5 flex items-center justify-between border-b border-slate-800">
                <h2 className="text-lg font-bold text-white flex items-center"><Clock className="w-5 h-5 mr-3 text-red-400"/> System Bottlenecks</h2>
                <span className="text-[10px] font-bold bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-full text-slate-300 uppercase tracking-widest shadow-inner">Redis Ranked ZSET</span>
              </div>
              <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 transition-colors">
                <div className="space-y-4 max-w-4xl mx-auto">
                  {leaderboardData.map((item, idx) => (
                    <div key={idx} className="flex flex-col md:flex-row md:items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                      
                      {/* Rank Ribbon */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors ${idx === 0 ? 'bg-red-500' : idx === 1 ? 'bg-orange-400' : idx === 2 ? 'bg-amber-400' : 'bg-slate-200 dark:bg-slate-600 group-hover:bg-slate-300 dark:group-hover:bg-slate-500'}`}></div>
                      
                      <div className="flex-shrink-0 w-20 text-center mb-4 md:mb-0">
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 block uppercase tracking-widest mb-1 transition-colors">Rank</span>
                        <span className={`text-3xl font-black ${idx === 0 ? 'text-red-500' : idx === 1 ? 'text-orange-400' : idx === 2 ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'}`}>#{idx + 1}</span>
                      </div>
                      
                      <div className="flex-1 px-4 mb-4 md:mb-0">
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 block uppercase tracking-widest mb-2 transition-colors">Query Hash / Statement</span>
                        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto shadow-inner">
                          {item.value}
                        </div>
                      </div>
                      
                      <div className="flex-shrink-0 md:w-36 md:text-right px-2">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block uppercase tracking-widest mb-2 transition-colors">Duration</span>
                        <div className="text-2xl font-black font-mono text-slate-800 dark:text-slate-200 tracking-tighter transition-colors">
                          {item.score.toFixed(1)}<span className="text-sm font-normal text-slate-400 dark:text-slate-500 ml-1 transition-colors">ms</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {leaderboardData.length === 0 && (
                    <div className="text-center py-16 text-slate-400 dark:text-slate-500 font-medium bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 transition-colors">
                      The leaderboard is clean. Execute some heavy queries to populate it!
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
