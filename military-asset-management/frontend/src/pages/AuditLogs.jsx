import React, { useState, useEffect } from 'react';
import { auditAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { ChevronLeft, ChevronRight, Eye, RefreshCw, Calendar, Tag } from 'lucide-react';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 20
  });

  const [selectedLog, setSelectedLog] = useState(null); // For details modal

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await auditAPI.getAll(filters);
      setLogs(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(err.response?.data?.error || 'Failed to fetch audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page]); // Refetch when page changes

  const handleApplyFilters = () => {
    setFilters(prev => ({ ...prev, page: 1 }));
    // If page is already 1, useEffect won't trigger automatically, so manual fetch is needed
    if (filters.page === 1) {
      fetchLogs();
    }
  };

  const handleClearFilters = () => {
    setFilters({
      action: '',
      entityType: '',
      startDate: '',
      endDate: '',
      page: 1,
      limit: 20
    });
    // Triggers manual fetch since page might still be 1
    setTimeout(fetchLogs, 0);
  };

  const totalPages = Math.ceil(total / filters.limit) || 1;

  // Helpers to format database strings into readable chips
  const getActionBadgeColor = (action) => {
    switch (action) {
      case 'CREATE_PURCHASE':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'CREATE_TRANSFER':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'CREATE_ASSIGNMENT':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'CREATE_EXPENDITURE':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Audit Logs</h1>
          <p className="text-sm text-[var(--text-secondary)]">Immutable ledger of all military asset modifications and operations.</p>
        </div>
        <button 
          onClick={fetchLogs} 
          disabled={loading}
          className="btn-secondary flex items-center space-x-2 py-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 flex flex-col lg:flex-row gap-4 items-end">
        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Action Type</label>
            <select 
              className="input-field"
              value={filters.action}
              onChange={e => setFilters({ ...filters, action: e.target.value })}
            >
              <option value="">All Actions</option>
              <option value="CREATE_PURCHASE">Purchase Logged</option>
              <option value="CREATE_TRANSFER">Transfer Initiated</option>
              <option value="CREATE_ASSIGNMENT">Assignment Logged</option>
              <option value="CREATE_EXPENDITURE">Expenditure Logged</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Log Category</label>
            <select 
              className="input-field"
              value={filters.entityType}
              onChange={e => setFilters({ ...filters, entityType: e.target.value })}
            >
              <option value="">All Categories</option>
              <option value="purchases">Purchases (Table)</option>
              <option value="transfers">Transfers (Table)</option>
              <option value="assignments">Assignments (Table)</option>
              <option value="expenditures">Expenditures (Table)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Start Date</label>
            <input 
              type="date" 
              className="input-field"
              value={filters.startDate}
              onChange={e => setFilters({ ...filters, startDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">End Date</label>
            <input 
              type="date" 
              className="input-field"
              value={filters.endDate}
              onChange={e => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>
        </div>
        <div className="flex gap-2 w-full lg:w-auto">
          <button onClick={handleApplyFilters} className="btn-primary py-2 flex-1 lg:flex-initial">Apply Filters</button>
          <button onClick={handleClearFilters} className="btn-secondary py-2 flex-1 lg:flex-initial">Clear</button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)] text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Log Category</th>
                  <th className="p-4">Reference ID</th>
                  <th className="p-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-sm">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-[var(--text-secondary)]">
                      No matching audit logs found.
                    </td>
                  </tr>
                ) : (
                  logs.map(log => (
                    <tr key={log.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                      <td className="p-4 text-[var(--text-secondary)]">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="p-4 font-medium text-white">
                        {log.username || `System (User #${log.user_id})`}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 border text-xs font-semibold rounded-full ${getActionBadgeColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 text-[var(--text-secondary)]">
                        <span className="flex items-center space-x-1.5">
                          <Tag className="w-3.5 h-3.5" />
                          <span>{log.entity_type}</span>
                        </span>
                      </td>
                      <td className="p-4 font-mono text-[var(--accent-blue)]">
                        #{log.entity_id || 'N/A'}
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => setSelectedLog(log)}
                          className="text-[var(--accent-green)] hover:text-white transition-colors flex items-center space-x-1 ml-auto"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="text-xs">Inspect</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-[var(--bg-secondary)] p-4 flex items-center justify-between border-t border-[var(--border)]">
            <span className="text-xs text-[var(--text-secondary)]">
              Showing {logs.length} of {total} records
            </span>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setFilters(f => ({ ...f, page: Math.max(1, f.page - 1) }))}
                disabled={filters.page === 1}
                className="btn-secondary p-1 disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-white">
                Page {filters.page} of {totalPages}
              </span>
              <button 
                onClick={() => setFilters(f => ({ ...f, page: Math.min(totalPages, f.page + 1) }))}
                disabled={filters.page === totalPages}
                className="btn-secondary p-1 disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Inspect Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-2xl w-full p-6 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-white">Audit Log Details</h3>
                <p className="text-xs text-[var(--text-secondary)] font-mono">Log ID #{selectedLog.id} • User: {selectedLog.username || `User #${selectedLog.user_id}`}</p>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="text-[var(--text-secondary)] hover:text-white text-xl font-bold"
              >
                &times;
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-xs bg-[var(--bg-secondary)] p-3 rounded border border-[var(--border)]">
              <div>
                <span className="text-[var(--text-secondary)] block">Action</span>
                <span className="text-white font-semibold">{selectedLog.action}</span>
              </div>
              <div>
                <span className="text-[var(--text-secondary)] block">Created At</span>
                <span className="text-white font-semibold">{new Date(selectedLog.created_at).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[var(--text-secondary)] block">Target Category</span>
                <span className="text-white font-semibold">{selectedLog.entity_type}</span>
              </div>
              <div>
                <span className="text-[var(--text-secondary)] block">Reference ID</span>
                <span className="text-white font-semibold">#{selectedLog.entity_id || 'N/A'}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-[var(--text-secondary)] block font-medium">Recorded Metadata (JSON)</span>
              <pre className="bg-[var(--bg-primary)] p-4 rounded text-xs text-[var(--accent-green)] font-mono overflow-auto max-h-96 border border-[var(--border)]">
                {JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => setSelectedLog(null)} className="btn-secondary py-2 px-4">
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
