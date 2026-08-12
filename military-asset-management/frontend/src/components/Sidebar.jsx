import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, ShoppingCart, ArrowLeftRight, ClipboardList, ScrollText } from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuth();
  const role = user?.role || '';

  const getNavItems = () => {
    const items = [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'] }
    ];

    if (['ADMIN', 'LOGISTICS_OFFICER'].includes(role)) {
      items.push({ path: '/purchases', label: 'Purchases', icon: ShoppingCart, roles: ['ADMIN', 'LOGISTICS_OFFICER'] });
      items.push({ path: '/transfers', label: 'Transfers', icon: ArrowLeftRight, roles: ['ADMIN', 'LOGISTICS_OFFICER'] });
    }

    if (['ADMIN', 'BASE_COMMANDER'].includes(role)) {
      items.push({ path: '/assignments', label: 'Assignments', icon: ClipboardList, roles: ['ADMIN', 'BASE_COMMANDER'] });
    }

    if (role === 'ADMIN') {
      items.push({ path: '/audit-logs', label: 'Audit Logs', icon: ScrollText, roles: ['ADMIN'] });
    }

    return items;
  };

  const navItems = getNavItems();

  return (
    <aside className="w-60 fixed left-0 top-16 bottom-0 bg-[var(--bg-card)] border-r border-[var(--border)] flex flex-col">
      <div className="flex-1 py-6 space-y-2 px-3 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-[var(--accent-green)] text-white'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
      
      <div className="p-4 border-t border-[var(--border)]">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center border border-[var(--border)]">
            <span className="font-bold text-[var(--accent-blue)]">
              {user?.username?.substring(0, 2).toUpperCase() || 'US'}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-white">{user?.username || 'User'}</p>
            <p className="text-xs text-[var(--text-secondary)] truncate">{user?.role?.replace('_', ' ') || 'Role'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
