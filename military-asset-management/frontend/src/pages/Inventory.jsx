import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { assetsAPI, lookupsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { RefreshCw, MapPin, Package } from 'lucide-react';

const Inventory = () => {
  const { user } = useAuth();
  const isCommander = user?.role === 'BASE_COMMANDER';

  const [inventory, setInventory] = useState([]);
  const [bases, setBases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [filters, setFilters] = useState({
    baseId: isCommander ? user.baseId : '',
    category: ''
  });

  const fetchBases = async () => {
    try {
      const res = await lookupsAPI.getBases();
      setBases(res.data || []);
    } catch (err) {
      console.error('Error fetching bases:', err);
    }
  };

  const fetchInventory = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await assetsAPI.getInventory(filters);
      setInventory(res.data || []);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError(err.response?.data?.error || 'Failed to fetch inventory details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isCommander) {
      fetchBases();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.baseId, filters.category]);

  const handleClearFilters = () => {
    setFilters({
      baseId: isCommander ? user.baseId : '',
      category: ''
    });
  };

  // Helper to color-code the stock column values
  const getStockColorClass = (stock) => {
    if (stock > 0) return 'text-[var(--accent-green)] font-semibold';
    if (stock < 0) return 'text-[var(--accent-red)] font-bold';
    return 'text-[var(--text-secondary)]';
  };

  const getActiveBaseName = () => {
    if (isCommander) return user.baseName || 'Your Assigned Base';
    if (filters.baseId) {
      const active = bases.find(b => String(b.id) === String(filters.baseId));
      return active ? active.name : 'All Command Bases';
    }
    return 'All Command Bases';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Base Inventory Details</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            {isCommander 
              ? `Real-time physical asset counts for ${getActiveBaseName()}.` 
              : 'Global overview of inventory stock levels across all command sectors.'}
          </p>
        </div>
        <button 
          onClick={fetchInventory} 
          disabled={loading}
          className="btn-secondary flex items-center space-x-2 py-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Options */}
      <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
          {!isCommander && (
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Filter by Base</label>
              <select 
                className="input-field"
                value={filters.baseId}
                onChange={e => setFilters({ ...filters, baseId: e.target.value })}
              >
                <option value="">All Bases</option>
                {bases.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}
          <div className={isCommander ? 'md:col-span-2' : ''}>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Filter by Equipment Category</label>
            <select 
              className="input-field"
              value={filters.category}
              onChange={e => setFilters({ ...filters, category: e.target.value })}
            >
              <option value="">All Categories</option>
              <option value="WEAPON">Weapons</option>
              <option value="VEHICLE">Vehicles</option>
              <option value="AMMUNITION">Ammunition</option>
            </select>
          </div>
        </div>
        <button onClick={handleClearFilters} className="btn-secondary py-2 w-full md:w-auto">Clear Filters</button>
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
          <div className="p-4 border-b border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-between">
            <span className="text-sm font-semibold text-white flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-[var(--accent-blue)]" />
              <span>Sectors Selected: {getActiveBaseName()}</span>
            </span>
            <span className="text-xs text-[var(--text-secondary)]">
              {inventory.length} asset records mapped
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)] text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-wider">
                  {!isCommander && <th className="p-4">Base Sector</th>}
                  <th className="p-4">Equipment Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Stock Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-sm">
                {inventory.length === 0 ? (
                  <tr>
                    <td colSpan={isCommander ? '3' : '4'} className="p-8 text-center text-[var(--text-secondary)]">
                      No inventory records found matching current criteria.
                    </td>
                  </tr>
                ) : (
                  inventory.map((item, idx) => (
                    <tr key={`${item.baseId}-${item.equipmentTypeId}`} className="hover:bg-[var(--bg-secondary)] transition-colors">
                      {!isCommander && (
                        <td className="p-4 font-semibold text-white">
                          {item.baseName}
                        </td>
                      )}
                      <td className="p-4 text-white">
                        <span className="flex items-center space-x-2">
                          <Package className="w-4 h-4 text-[var(--text-secondary)]" />
                          <span>{item.equipmentName}</span>
                        </span>
                      </td>
                      <td className="p-4 text-[var(--text-secondary)]">
                        <span className="px-2 py-0.5 border border-[var(--border)] text-[10px] font-semibold uppercase rounded bg-[var(--bg-secondary)]">
                          {item.category}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={getStockColorClass(item.currentStock)}>
                          {item.currentStock}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
