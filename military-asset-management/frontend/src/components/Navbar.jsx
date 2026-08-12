import React from 'react';
import { Shield, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleColors = {
    ADMIN: 'bg-red-500/20 text-red-400 border-red-500/50',
    COMMANDER: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    BASE_COMMANDER: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    LOGISTICS_OFFICER: 'bg-amber-500/20 text-amber-400 border-amber-500/50'
  };

  const roleBadge = user?.role ? roleColors[user.role] : 'bg-gray-500/20 text-gray-400 border-gray-500/50';

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-[var(--bg-card)] border-b border-[var(--border)] z-50 px-6 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <Shield className="w-8 h-8 text-[var(--accent-green)]" />
        <span className="text-xl font-bold tracking-wider">MILTRACK</span>
      </div>
      
      <div className="flex items-center space-x-6">
        {user && (
          <div className="flex items-center space-x-4">
            {user.baseName && (
              <span className="hidden sm:inline-block px-3 py-1 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-full text-xs font-bold text-[var(--text-secondary)] tracking-wider">
                {user.baseName.toUpperCase()}
              </span>
            )}
            <span className={`px-2 py-1 text-xs font-bold border rounded ${roleBadge}`}>
              {user.role.replace('_', ' ')}
            </span>
            <span className="font-medium">{user.username || 'User'}</span>
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-2 text-[var(--text-secondary)] hover:text-white transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
