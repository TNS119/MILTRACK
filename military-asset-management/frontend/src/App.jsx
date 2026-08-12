import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Purchases from './pages/Purchases';
import Transfers from './pages/Transfers';
import Assignments from './pages/Assignments';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

function AppLayout({ children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ display: 'flex', flex: 1, paddingTop: '64px' }}>
        <Sidebar />
        <main style={{ flex: 1, marginLeft: '240px', padding: '24px', backgroundColor: 'var(--bg-primary)' }}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER']} />}>
            <Route element={<AppLayout><Dashboard /></AppLayout>} path="/" />
            
            <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'LOGISTICS_OFFICER']} />}>
              <Route element={<AppLayout><Purchases /></AppLayout>} path="/purchases" />
              <Route element={<AppLayout><Transfers /></AppLayout>} path="/transfers" />
            </Route>
            
            <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'BASE_COMMANDER']} />}>
              <Route element={<AppLayout><Assignments /></AppLayout>} path="/assignments" />
            </Route>
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
