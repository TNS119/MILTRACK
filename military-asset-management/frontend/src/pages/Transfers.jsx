import React, { useState, useEffect } from 'react';
import { transfersAPI, lookupsAPI, assetsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const Transfers = () => {
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    fromBaseId: '',
    toBaseId: '',
    equipmentTypeId: '',
    quantity: 1,
    transferDate: new Date().toISOString().split('T')[0],
    notes: ''
  });
  
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [availableStock, setAvailableStock] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [basesRes, eqTypesRes, transfersRes] = await Promise.all([
          lookupsAPI.getBases(),
          lookupsAPI.getEquipmentTypes(),
          transfersAPI.getAll()
        ]);
        setBases(basesRes.data);
        setEquipmentTypes(eqTypesRes.data);
        setTransfers(transfersRes.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchStock = async () => {
      if (formData.fromBaseId && formData.equipmentTypeId) {
        try {
          const res = await assetsAPI.checkStock(formData.fromBaseId, formData.equipmentTypeId);
          setAvailableStock(res.data.available);
        } catch (err) {
          console.error('Error checking stock:', err);
          setAvailableStock(0);
        }
      } else {
        setAvailableStock(null);
      }
    };
    fetchStock();
  }, [formData.fromBaseId, formData.equipmentTypeId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.fromBaseId === formData.toBaseId) {
      setMessage({ type: 'error', text: 'Source and Destination bases must be different.' });
      return;
    }

    if (availableStock !== null && formData.quantity > availableStock) {
      setMessage({ type: 'error', text: `Cannot transfer more than available stock (${availableStock}).` });
      return;
    }
    
    setSubmitLoading(true);
    setMessage('');
    try {
      await transfersAPI.create({
        sourceBaseId: formData.fromBaseId,
        destinationBaseId: formData.toBaseId,
        equipmentTypeId: formData.equipmentTypeId,
        quantity: formData.quantity,
        notes: formData.notes,
      });
      setMessage({ type: 'success', text: 'Transfer initiated successfully.' });
      setFormData({ ...formData, quantity: 1, notes: '' });
      
      // Fetch fresh stock to update the UI Available count immediately
      const stockRes = await assetsAPI.checkStock(formData.fromBaseId, formData.equipmentTypeId);
      setAvailableStock(stockRes.data.available);

      const res = await transfersAPI.getAll();
      setTransfers(res.data.data || []);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to initiate transfer.' });
    } finally {
      setSubmitLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Inter-Base Transfers</h1>

      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4 text-[var(--accent-amber)]">Initiate Transfer</h2>
        {message && (
          <div className={`p-3 mb-4 rounded border ${message.type === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-red-500/10 border-red-500/50 text-red-400'}`}>
            {message.text}
          </div>
        )}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Source Base</label>
            <select required className="input-field" value={formData.fromBaseId} onChange={e => setFormData({...formData, fromBaseId: e.target.value})}>
              <option value="">Select Origin</option>
              {bases.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Destination Base</label>
            <select required className="input-field" value={formData.toBaseId} onChange={e => setFormData({...formData, toBaseId: e.target.value})}>
              <option value="">Select Destination</option>
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
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Quantity {availableStock !== null && `(Available: ${availableStock})`}
            </label>
            <input type="number" min="1" required className="input-field" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Transfer Date</label>
            <input type="date" required className="input-field" value={formData.transferDate} onChange={e => setFormData({...formData, transferDate: e.target.value})} />
          </div>
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Notes</label>
            <input type="text" className="input-field" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
          </div>
          <div className="lg:col-span-3 flex justify-end mt-2">
            <button type="submit" className="btn-primary" disabled={submitLoading}>
              {submitLoading ? 'Processing...' : 'Submit Transfer'}
            </button>
          </div>
        </form>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold">Transfer History</h2>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="h-32 flex items-center justify-center"><LoadingSpinner /></div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)]">
                  <th className="p-4 font-medium text-[var(--text-secondary)]">Date</th>
                  <th className="p-4 font-medium text-[var(--text-secondary)]">From</th>
                  <th className="p-4 font-medium text-[var(--text-secondary)]">To</th>
                  <th className="p-4 font-medium text-[var(--text-secondary)]">Equipment</th>
                  <th className="p-4 font-medium text-[var(--text-secondary)] text-right">Qty</th>
                  <th className="p-4 font-medium text-[var(--text-secondary)] text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {transfers.length === 0 ? (
                  <tr><td colSpan="6" className="p-4 text-center text-[var(--text-secondary)]">No transfers found.</td></tr>
                ) : (
                  transfers.map(t => (
                    <tr key={t.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-secondary)] transition-colors">
                      <td className="p-4">{new Date(t.transfer_date).toLocaleDateString()}</td>
                      <td className="p-4">{t.sourceBaseName || 'N/A'}</td>
                      <td className="p-4">{t.destinationBaseName || 'N/A'}</td>
                      <td className="p-4">{t.equipmentTypeName || 'N/A'}</td>
                      <td className="p-4 text-right font-medium text-[var(--accent-amber)]">{t.quantity}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          t.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {t.status || 'PENDING'}
                        </span>
                      </td>
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

export default Transfers;
