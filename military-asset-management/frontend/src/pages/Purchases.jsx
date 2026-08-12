import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { purchasesAPI, lookupsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const Purchases = () => {
  const { user } = useAuth();
  const isAdminOrLogistics = ['ADMIN', 'LOGISTICS_OFFICER'].includes(user?.role);
  
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    baseId: '',
    equipmentTypeId: '',
    quantity: 1,
    purchaseDate: new Date().toISOString().split('T')[0],
    notes: ''
  });
  
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const [basesRes, eqTypesRes, purchasesRes] = await Promise.all([
          lookupsAPI.getBases(),
          lookupsAPI.getEquipmentTypes(),
          purchasesAPI.getAll()
        ]);
        setBases(basesRes.data);
        setEquipmentTypes(eqTypesRes.data);
        setPurchases(purchasesRes.data.data || []);
      } catch (err) {
        console.error('Error fetching data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setMessage('');
    try {
      await purchasesAPI.create(formData);
      setMessage({ type: 'success', text: 'Purchase logged successfully.' });
      setFormData({ ...formData, quantity: 1, notes: '' });
      // Refresh list
      const res = await purchasesAPI.getAll();
      setPurchases(res.data.data || []);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to log purchase.' });
    } finally {
      setSubmitLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Procurement & Purchases</h1>

      {isAdminOrLogistics && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4 text-[var(--accent-blue)]">Log New Purchase</h2>
          {message && (
            <div className={`p-3 mb-4 rounded border ${message.type === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-red-500/10 border-red-500/50 text-red-400'}`}>
              {message.text}
            </div>
          )}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Destination Base</label>
              <select required className="input-field" value={formData.baseId} onChange={e => setFormData({...formData, baseId: e.target.value})}>
                <option value="">Select Base</option>
                {bases.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Equipment Type</label>
              <select required className="input-field" value={formData.equipmentTypeId} onChange={e => setFormData({...formData, equipmentTypeId: e.target.value})}>
                <option value="">Select Equipment</option>
                {equipmentTypes.map(eq => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Quantity</label>
              <input type="number" min="1" required className="input-field" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Purchase Date</label>
              <input type="date" required className="input-field" value={formData.purchaseDate} onChange={e => setFormData({...formData, purchaseDate: e.target.value})} />
            </div>
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Notes</label>
              <input type="text" className="input-field" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Optional notes..." />
            </div>
            <div className="lg:col-span-3 flex justify-end mt-2">
              <button type="submit" className="btn-primary" disabled={submitLoading}>
                {submitLoading ? 'Processing...' : 'Log Purchase'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold">Purchase History</h2>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="h-32 flex items-center justify-center"><LoadingSpinner /></div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                  <th className="p-4 font-medium text-[var(--text-secondary)]">Date</th>
                  <th className="p-4 font-medium text-[var(--text-secondary)]">Base</th>
                  <th className="p-4 font-medium text-[var(--text-secondary)]">Equipment</th>
                  <th className="p-4 font-medium text-[var(--text-secondary)] text-right">Qty</th>
                  <th className="p-4 font-medium text-[var(--text-secondary)]">Notes</th>
                </tr>
              </thead>
              <tbody>
                {purchases.length === 0 ? (
                  <tr><td colSpan="5" className="p-4 text-center text-[var(--text-secondary)]">No purchases found.</td></tr>
                ) : (
                  purchases.map(p => (
                    <tr key={p.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-secondary)] transition-colors">
                      <td className="p-4">{new Date(p.purchase_date).toLocaleDateString()}</td>
                      <td className="p-4">{p.baseName || p.base_name || 'N/A'}</td>
                      <td className="p-4">{p.equipmentTypeName || p.equipment_type_name || 'N/A'}</td>
                      <td className="p-4 text-right font-medium text-[var(--accent-blue)]">+{p.quantity}</td>
                      <td className="p-4 text-sm text-[var(--text-secondary)]">{p.notes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Purchases;
