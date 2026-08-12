import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { assetsAPI, lookupsAPI } from '../services/api';
import StatCard from '../components/StatCard';
import NetMoveModal from '../components/NetMoveModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { BarChart2, TrendingUp, TrendingDown, Users, Shield, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    baseId: user?.role === 'BASE_COMMANDER' ? user.baseId : '',
    equipmentTypeId: ''
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [basesRes, eqTypesRes] = await Promise.all([
          lookupsAPI.getBases(),
          lookupsAPI.getEquipmentTypes()
        ]);
        setBases(basesRes.data);
        setEquipmentTypes(eqTypesRes.data);
      } catch (err) {
        console.error('Error fetching lookups', err);
      }
    };
    fetchLookups();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await assetsAPI.getDashboard(filters);
      setData(res.data);
    } catch (err) {
      setError('Failed to fetch dashboard data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleApplyFilters = () => {
    fetchDashboardData();
  };

  const handleClearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      baseId: user?.role === 'BASE_COMMANDER' ? user.baseId : '',
      equipmentTypeId: ''
    });
    setTimeout(fetchDashboardData, 0);
  };

  const chartData = [
    {
      name: 'Activity',
      Purchases: data?.purchases || 0,
      'Transfers In': data?.transfersIn || 0,
      'Transfers Out': data?.transfersOut || 0,
      Expended: data?.expended || 0
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Command Overview</h1>
      </div>


      <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Start Date</label>
          <input
            type="date"
            className="input-field"
            value={filters.startDate}
            onChange={e => setFilters({ ...filters, startDate: e.target.value })}
          />
        </div>
        <div className="flex-1 w-full">
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">End Date</label>
          <input
            type="date"
            className="input-field"
            value={filters.endDate}
            onChange={e => setFilters({ ...filters, endDate: e.target.value })}
          />
        </div>
        {user?.role !== 'BASE_COMMANDER' && (
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Base</label>
            <select
              className="input-field"
              value={filters.baseId}
              onChange={e => setFilters({ ...filters, baseId: e.target.value })}
            >
              <option value="">All Bases</option>
              {bases.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="flex-1 w-full">
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Equipment Type</label>
          <select
            className="input-field"
            value={filters.equipmentTypeId}
            onChange={e => setFilters({ ...filters, equipmentTypeId: e.target.value })}
          >
            <option value="">All Types</option>
            {equipmentTypes.map(eq => (
              <option key={eq.id} value={eq.id}>{eq.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={handleApplyFilters} className="btn-primary py-2">Apply</button>
          <button onClick={handleClearFilters} className="btn-secondary py-2">Clear</button>
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
        <>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              title="Opening Balance"
              value={data?.openingBalance ?? 0}
              icon={BarChart2}
              color="blue"
              subtitle="Stock at start of period"
            />
            <StatCard
              title="Net Movement"
              value={data?.netMovement ?? 0}
              icon={(data?.netMovement ?? 0) >= 0 ? TrendingUp : TrendingDown}
              color={(data?.netMovement ?? 0) >= 0 ? 'green' : 'red'}
              onClick={() => setIsModalOpen(true)}
              subtitle="Click for breakdown"
            />
            <StatCard
              title="Assigned"
              value={data?.assigned ?? 0}
              icon={Users}
              color="amber"
              subtitle="Allocated to active units"
            />
            <StatCard
              title="Closing Balance"
              value={data?.closingBalance ?? 0}
              icon={Shield}
              color="purple"
              subtitle="Available inventory stock"
            />
            <StatCard
              title="Expended"
              value={data?.expended ?? 0}
              icon={Zap}
              color="red"
              subtitle="Consumed or written off"
            />
          </div>

          <div className="glass-card p-6 mt-6">
            <h3 className="text-lg font-bold mb-6">Movement Overview</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" />
                  <YAxis stroke="var(--text-secondary)" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="Purchases" fill="var(--accent-blue)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Transfers In" fill="var(--accent-green)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Transfers Out" fill="var(--accent-amber)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Expended" fill="var(--accent-red)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {data && (
        <NetMoveModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          metrics={data}
        />
      )}
    </div>
  );
};

export default Dashboard;
