import React from 'react';

const StatCard = ({ title, value, subtitle, icon: Icon, color, onClick, trend }) => {
  const colorMap = {
    green: 'var(--accent-green)',
    blue: 'var(--accent-blue)',
    amber: 'var(--accent-amber)',
    red: 'var(--accent-red)',
    purple: 'var(--accent-purple)'
  };

  const borderColor = colorMap[color] || colorMap.blue;

  return (
    <div 
      className={`stat-card relative overflow-hidden ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      style={{ borderLeftWidth: '4px', borderLeftColor: borderColor }}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">{title}</h3>
          <div className="text-3xl font-bold text-white mt-1">{value}</div>
        </div>
        {Icon && (
          <div 
            className="p-3 rounded-lg"
            style={{ backgroundColor: `${borderColor}20`, color: borderColor }}
          >
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        {trend && (
          <span className={`text-xs font-bold ${trend > 0 ? 'text-[var(--accent-green)]' : trend < 0 ? 'text-[var(--accent-red)]' : 'text-gray-400'}`}>
            {trend > 0 ? '↑' : trend < 0 ? '↓' : '-'} {Math.abs(trend)}%
          </span>
        )}
        {subtitle && (
          <p className="text-xs text-[var(--text-secondary)]">{subtitle}</p>
        )}
      </div>
      
      {/* Decorative gradient blob */}
      <div 
        className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-10 blur-xl pointer-events-none"
        style={{ backgroundColor: borderColor }}
      ></div>
    </div>
  );
};

export default StatCard;
