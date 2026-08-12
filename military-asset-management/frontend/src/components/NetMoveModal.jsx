import React from 'react';
import { X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const NetMoveModal = ({ isOpen, onClose, metrics }) => {
  if (!isOpen) return null;

  const data = [
    { name: 'Purchases', value: metrics.purchases || 0, color: 'var(--accent-blue)' },
    { name: 'Transfers In', value: metrics.transfersIn || 0, color: 'var(--accent-green)' },
    { name: 'Transfers Out', value: metrics.transfersOut || 0, color: 'var(--accent-red)' }
  ];

  const total = (metrics.purchases || 0) + (metrics.transfersIn || 0) - (metrics.transfersOut || 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex justify-between items-center p-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-bold text-white">Net Movement Breakdown</h2>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[var(--text-secondary)]">Purchases (+)</span>
              <span className="font-bold text-[var(--accent-blue)]">{metrics.purchases || 0}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-[var(--text-secondary)]">Transfers In (+)</span>
              <span className="font-bold text-[var(--accent-green)]">{metrics.transfersIn || 0}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-[var(--text-secondary)]">Transfers Out (-)</span>
              <span className="font-bold text-[var(--accent-red)]">{metrics.transfersOut || 0}</span>
            </div>
            
            <div className="h-px bg-[var(--border)] w-full"></div>
            
            <div className="flex justify-between items-center text-lg">
              <span className="font-bold text-white">Total Net Movement</span>
              <span className={`font-bold ${total >= 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}`}>
                {total > 0 ? '+' : ''}{total}
              </span>
            </div>
          </div>
          
          <div className="h-40 w-full mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} width={80} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)', borderRadius: '4px' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-secondary)] flex justify-end">
          <button onClick={onClose} className="btn-secondary">Close</button>
        </div>
      </div>
    </div>
  );
};

export default NetMoveModal;
