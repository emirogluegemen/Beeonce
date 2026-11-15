import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, homeForRole, useAuth } from './lib/auth';
import { Login } from './pages/Login';
import { Workspace } from './pages/Workspace';
import { ChildHome } from './pages/ChildHome';

function Protected({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="splash">Opening your workspace…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role !== user.role) return <Navigate to={homeForRole(user.role)} replace />;
  return children;
}
function Entry() {
  const { user, loading } = useAuth();
  if (loading) return <div className="splash">Opening your workspace…</div>;
  return <Navigate replace to={user ? homeForRole(user.role) : '/login'} />;
}
function PublicLogin() {
  const { user, loading } = useAuth();
  if (loading) return <div className="splash">Opening your workspace…</div>;
  return user ? <Navigate to={homeForRole(user.role)} replace /> : <Login />;
}
export default function App() {
  return <AuthProvider><BrowserRouter><Routes>
    <Route path="/" element={<Entry />} />
    <Route path="/login" element={<PublicLogin />} />
    <Route path="/parent" element={<Protected role="parent"><Workspace role="parent" /></Protected>} />
    <Route path="/specialist" element={<Protected role="specialist"><Workspace role="specialist" /></Protected>} />
    <Route path="/child" element={<Protected role="child"><ChildHome /></Protected>} />
    <Route path="*" element={<Entry />} />
  </Routes></BrowserRouter></AuthProvider>;
}
