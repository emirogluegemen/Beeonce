import { useAuth } from '../lib/auth';
import { moveWeek, weekLabel, mondayUTC } from '../lib/dates';
const ROLE_NAMES = { parent: 'Parent', specialist: 'Specialist', child: 'Child' };

export function Layout({ children }) {
  const { user, logout } = useAuth();
  return <div className="app-shell">
    <header className="site-header">
      <div className="brand"><span className="brand-mark" aria-hidden="true">✳</span><span>Development <strong>Hub</strong><small>SENG 383 · v0.1</small></span></div>
      <div className="account"><div className="avatar" aria-hidden="true">{user.display_name.charAt(0)}</div>
        <span className="account-name"><strong>{user.display_name}</strong><small>{ROLE_NAMES[user.role]}</small></span>
        <button className="button button-quiet" onClick={logout}>Sign out</button>
      </div>
    </header>
    <main className="main-content">{children}</main>
    <footer className="site-footer">SENG 383 demonstration · Fictional data only · No clinical decision support in v0.1</footer>
  </div>;
}

export function Panel({ title, eyebrow, right, children, className = '' }) {
  return <section className={`panel ${className}`}><div className="panel-heading"><div>
    {eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2>{title}</h2>
  </div>{right}</div>{children}</section>;
}
export function Notice({ type = 'error', children }) {
  return children ? <div role={type === 'error' ? 'alert' : 'status'} className={`notice notice-${type}`}>{children}</div> : null;
}
export function Empty({ children }) { return <div className="empty-state">{children}</div>; }
export function WeekPicker({ weekStart, onChange }) {
  return <div className="week-control" aria-label="Select week">
    <button type="button" aria-label="Previous week" className="icon-button" onClick={() => onChange(moveWeek(weekStart, -1))}>‹</button>
    <span className="week-label">{weekLabel(weekStart)}</span>
    <button type="button" aria-label="Next week" className="icon-button" onClick={() => onChange(moveWeek(weekStart, 1))}>›</button>
    <button type="button" className="button button-quiet today-button" onClick={() => onChange(mondayUTC())}>This week</button>
  </div>;
}
