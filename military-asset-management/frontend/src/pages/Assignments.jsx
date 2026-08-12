import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { assignmentsAPI, expendituresAPI, lookupsAPI, assetsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const Assignments = () => {
  const { user } = useAuth();
  const isCommander = user?.role === 'BASE_COMMANDER';
  
  const [activeTab, setActiveTab] = useState('assignments');
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [listData, setListData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [availableStock, setAvailableStock] = useState(null);
  const [baseInventory, setBaseInventory] = useState([]);

  const [formData, setFormData] = useState({
    baseId: isCommander ? user.baseId : '',
    equipmentTypeId: '',
    quantity: 1,
    assignedTo: '',
    reason: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const [bRes, eqRes] = await Promise.all([lookupsAPI.getBases(), lookupsAPI.getEquipmentTypes()]);
        setBases(bRes.data);
        setEquipmentTypes(eqRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchInitial();
  }, []);

  useEffect(() => {
    const fetchBaseInventory = async () => {
      if (formData.baseId) {
        try {
          const res = await assetsAPI.getInventory({ baseId: formData.baseId });
          setBaseInventory(res.data || []);
        } catch (err) {
          console.error('Error fetching base inventory:', err);
          setBaseInventory([]);
        }
      } else {
        setBaseInventory([]);
        setAvailableStock(null);
      }
    };
    fetchBaseInventory();
  }, [formData.baseId, activeTab]);

  useEffect(() => {
    if (formData.equipmentTypeId && baseInventory.length > 0) {
      const match = baseInventory.find(item => String(item.equipmentTypeId) === String(formData.equipmentTypeId));
      const stock = match ? match.currentStock : 0;
      setAvailableStock(stock);
      if (formData.quantity > stock) {
        setFormData(prev => ({ ...prev, quantity: Math.max(1, stock) }));
      }
    } else {
      setAvailableStock(null);
    }
  }, [formData.equipmentTypeId, baseInventory]);

  useEffect(() => {
    fetchList();
  }, [activeTab]);

  const fetchList = async () => {
    setLoading(true);
    try {
      if (activeTab === 'assignments') {
        const res = await assignmentsAPI.getAll();
        // backend returns { data: [...], total, page, limit }
        setListData(res.data.data || []);
      } else {
        const res = await expendituresAPI.getAll();
        setListData(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
      setListData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (availableStock !== null && formData.quantity > availableStock) {
      setMessage({ type: 'error', text: `Cannot log more than available stock (${availableStock}).` });
      return;
    }

    setSubmitLoading(true);
    setMessage('');
    
    try {
      const payload = {
        baseId: formData.baseId,
        equipmentTypeId: formData.equipmentTypeId,
        quantity: formData.quantity,
      };

      if (activeTab === 'assignments') {
        payload.assignedTo = formData.assignedTo;
        payload.assignedDate = formData.date;
        payload.notes = formData.notes;
        await assignmentsAPI.create(payload);
        setMessage({ type: 'success', text: 'Assignment logged successfully.' });
      } else {
        payload.reason = formData.reason;
        payload.expenditureDate = formData.date;
        await expendituresAPI.create(payload);
        setMessage({ type: 'success', text: 'Expenditure logged successfully.' });
      }

      setFormData({
        ...formData,
        quantity: 1,
        assignedTo: '',
        reason: '',
        notes: ''
      });

      // Fetch fresh base inventory to update all dropdown counts and stock immediately
      const invRes = await assetsAPI.getInventory({ baseId: formData.baseId });
      setBaseInventory(invRes.data || []);

      fetchList();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Action failed.' });
    } finally {
      setSubmitLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Field Operations</h1>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-[var(--border)]">
        <button 
          className={`px-4 py-2 font-medium ${activeTab === 'assignments' ? 'text-[var(--accent-blue)] border-b-2 border-[var(--accent-blue)]' : 'text-[var(--text-secondary)] hover:text-white'}`}
          onClick={() => setActiveTab('assignments')}
        >
          Assignments
        </button>
        <button 
          className={`px-4 py-2 font-medium ${activeTab === 'expenditures' ? 'text-[var(--accent-red)] border-b-2 border-[var(--accent-red)]' : 'text-[var(--text-secondary)] hover:text-white'}`}
          onClick={() => setActiveTab('expenditures')}
        >
          Expenditures
        </button>
      </div>

      <div className="glass-card p-6">
        <h2 className={`text-lg font-semibold mb-4 ${activeTab === 'assignments' ? 'text-[var(--accent-blue)]' : 'text-[var(--accent-red)]'}`}>
          Log New {activeTab === 'assignments' ? 'Assignment' : 'Expenditure'}
        </h2>
        
        {message && (
          <div className={`p-3 mb-4 rounded border ${message.type === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-red-500/10 border-red-500/50 text-red-400'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Base</label>
            <select required className="input-field" disabled={isCommander} value={formData.baseId} onChange={e => setFormData({...formData, baseId: e.target.value})}>
              <option value="">Select Base</option>
              {bases.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Equipment Type</label>
            <select required className="input-field" value={formData.equipmentTypeId} onChange={e => setFormData({...formData, equipmentTypeId: e.target.value})}>
              <option value="">Select Equipment</option>
              {equipmentTypes.map(eq => {
                const match = baseInventory.find(item => String(item.equipmentTypeId) === String(eq.id));
                const stock = match ? match.currentStock : 0;
                const isOutOfStock = formData.baseId && stock <= 0;
                return (
                  <option key={eq.id} value={eq.id} disabled={isOutOfStock}>
                    {eq.name} {formData.baseId ? (stock <= 0 ? '(Out of Stock)' : `(Available: ${stock})`) : ''}
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Quantity {availableStock !== null && `(Available: ${availableStock})`}
            </label>
            <input 
              type="number" 
              min="1" 
              max={availableStock !== null ? availableStock : undefined}
              required 
              className="input-field" 
              value={formData.quantity} 
              onChange={e => {
                let val = parseInt(e.target.value, 10);
                if (isNaN(val)) val = '';
                else if (val < 1) val = 1;
                else if (availableStock !== null && val > availableStock) val = availableStock;
                setFormData({...formData, quantity: val});
              }} 
            />
          </div>
          
          {activeTab === 'assignments' && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Assigned To (Unit/Person)</label>
              <input type="text" required className="input-field" value={formData.assignedTo} onChange={e => setFormData({...formData, assignedTo: e.target.value})} placeholder="e.g. Bravo Team" />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Date</label>
            <input type="date" required className="input-field" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
          </div>

          {activeTab === 'expenditures' && (
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Reason for Expenditure</label>
              <input type="text" required className="input-field" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} placeholder="e.g. Training exercise, Damaged, Expired" />
            </div>
          )}

          {activeTab === 'assignments' && (
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Notes</label>
              <input type="text" className="input-field" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
            </div>
          )}
          
          <div className="lg:col-span-3 flex justify-end mt-2">
            <button type="submit" className={activeTab === 'assignments' ? 'btn-primary' : 'btn-danger'} disabled={submitLoading}>
              {submitLoading ? 'Processing...' : `Submit ${activeTab === 'assignments' ? 'Assignment' : 'Expenditure'}`}
            </button>
          </div>
        </form>
      </div>

      {/* History Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
          <h2 className="text-lg font-semibold">{activeTab === 'assignments' ? 'Active Assignments' : 'Expenditure Log'}</h2>
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
                  {activeTab === 'assignments' ? (
                    <th className="p-4 font-medium text-[var(--text-secondary)]">Assigned To</th>
                  ) : (
                    <th className="p-4 font-medium text-[var(--text-secondary)]">Reason</th>
                  )}
                  <th className="p-4 font-medium text-[var(--text-secondary)] text-right">Qty</th>
                </tr>
              </thead>
              <tbody>
                {listData.length === 0 ? (
                  <tr><td colSpan="5" className="p-4 text-center text-[var(--text-secondary)]">No records found.</td></tr>
                ) : (
                  listData.map(item => (
                    <tr key={item.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-secondary)] transition-colors">
                      <td className="p-4">
                        {new Date(
                          item.assigned_date || item.expenditure_date
                        ).toLocaleDateString()}
                      </td>
                      <td className="p-4">{item.baseName || item.base_name || 'N/A'}</td>
                      <td className="p-4">{item.equipmentTypeName || item.equipment_type_name || 'N/A'}</td>
                      <td className="p-4">{activeTab === 'assignments' ? item.assigned_to : item.reason}</td>
                      <td className={`p-4 text-right font-medium ${activeTab === 'assignments' ? 'text-[var(--accent-blue)]' : 'text-[var(--accent-red)]'}`}>
                        {item.quantity}
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

export default Assignments;
