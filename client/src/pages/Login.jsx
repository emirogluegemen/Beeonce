import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, homeForRole } from '../lib/auth';
import { Notice } from '../components/Layout';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  async function submit(event) {
    event.preventDefault(); setError(''); setLoading(true);
    try { const user = await login(email, password); navigate(homeForRole(user.role), { replace: true }); }
    catch (err) { setError(err.message); } finally { setLoading(false); }
  }
  return <div className="login-shell"><div className="login-intro">
    <div className="login-logo">✳ <strong>Development Hub</strong></div>
    <p className="eyebrow light-eyebrow">A shared space for development</p>
    <h1>One child's progress.<br /><em>One connected team.</em></h1>
    <p>Organize weekly activities and collaborate across parent, specialist and child accounts—all within a secure, role-based demonstration.</p>
    <div className="intro-stats"><div><strong>01</strong><span>Shared calendar</span></div><div><strong>02</strong><span>Coordinated tasks</span></div><div><strong>03</strong><span>Role-specific access</span></div></div>
    <small>Course project v0.1 · Synthetic data only</small>
  </div><div className="login-side"><div className="login-card">
    <div className="login-small-mark" aria-hidden="true">✳</div>
    <h2>Welcome back</h2><p className="muted">Sign in to your account. Your role is assigned automatically.</p>
    <form className="form-stack" onSubmit={submit}><Notice>{error}</Notice>
      <label>Email address<input type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} placeholder="parent@demo.test" /></label>
      <label>Password<input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" /></label>
      <button className="button button-primary full-width" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
    </form>
    <div className="demo-accounts"><h3>Fictional demo accounts</h3><p>All passwords: <code>Demo1234!</code></p>
      <div className="demo-buttons"><button onClick={() => { setEmail('parent@demo.test'); setPassword('Demo1234!'); }}>Parent</button>
      <button onClick={() => { setEmail('teacher@demo.test'); setPassword('Demo1234!'); }}>Teacher</button>
      <button onClick={() => { setEmail('child@demo.test'); setPassword('Demo1234!'); }}>Child</button></div>
      <p className="hint">These accounts are for local development only. Do not enter real children's information.</p>
    </div>
  </div></div></div>;
}
