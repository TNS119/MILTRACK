import React, { useState } from 'react';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(username, password);
      const { user } = response.data;
      login(user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] relative overflow-hidden">
      {/* Subtle grid background pattern */}
      <div 
        className="absolute inset-0 z-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }}
      ></div>
      
      <div className="glass-card w-full max-w-md p-8 z-10 mx-4 border-t-4 border-t-[var(--accent-blue)]">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center border border-[var(--border)] mb-4 shadow-lg shadow-[var(--accent-blue)]/20">
            <Shield className="w-8 h-8 text-[var(--accent-blue)]" />
          </div>
          <h1 className="text-3xl font-bold tracking-widest text-white mb-2">MILTRACK</h1>
          <p className="text-[var(--text-secondary)] text-sm tracking-wide">Military Asset Management System</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Operative ID / Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field w-full"
              placeholder="Enter your ID"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Passcode
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field w-full pr-10"
                placeholder="Enter passcode"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-white"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 flex justify-center items-center mt-2 relative overflow-hidden group"
          >
            {loading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <span className="font-bold tracking-wide">AUTHORIZE ACCESS</span>
            )}
            {/* Hover effect sweep */}
            <div className="absolute inset-0 h-full w-0 bg-white/10 group-hover:w-full transition-all duration-300 ease-out"></div>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
