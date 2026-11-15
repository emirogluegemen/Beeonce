import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { request } from '../lib/api';
import { mondayUTC } from '../lib/dates';
import { Layout, Notice, WeekPicker } from '../components/Layout';
import { EventBoard } from '../components/EventBoard';
import { TaskBoard } from '../components/TaskBoard';
import { SpecialistLinks } from '../components/SpecialistLinks';

export function Workspace({ role }) {
  const { user, token } = useAuth();
  const [children, setChildren] = useState([]);
  const [childId, setChildId] = useState(null);
  const [weekStart, setWeekStart] = useState(() => mondayUTC());
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    let active = true; setError('');
    request('/children', { token }).then(data => {
      if (!active) return;
      setChildren(data.children);
      setChildId(old => data.children.some(c => c.id === old) ? old : data.children[0]?.id ?? null);
    }).catch(err => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [token, refreshKey]);
  const current = children.find(child => child.id === childId);
  const isParent = role === 'parent';
  return <Layout>
    <div className="page-heading"><div><p className="eyebrow">{isParent ? 'Parent dashboard' : 'Specialist workspace'} · M1–M4</p>
      <h1>{isParent ? 'Your child’s week' : 'Your linked children'}</h1>
      <p className="muted">Hello, {user.display_name}. {isParent ? 'Keep everyone organized in one place.' : 'Plan activities and follow task status for the children linked to you.'}</p>
    </div><button className="button button-secondary" onClick={() => setRefreshKey(v => v + 1)}>Refresh children</button></div>
    <Notice>{error}</Notice>
    {children.length === 0 && !error && <div className="panel empty-state">{isParent ? 'No children in this account.' : 'You are not linked to any children yet. Ask a parent to link your registered email.'}</div>}
    {children.length > 0 && <>
      <div className="toolbar"><label className="child-selector">Child<select value={childId ?? ''} onChange={e => setChildId(Number(e.target.value))}>
        {children.map(child => <option key={child.id} value={child.id}>{child.displayName}</option>)}
      </select></label><WeekPicker weekStart={weekStart} onChange={setWeekStart} /></div>
      <div className="overview-banner"><div className="overview-icon" aria-hidden="true">✦</div><div><p className="eyebrow">Weekly overview</p>
        <h2>{current?.displayName ?? 'Child'}’s schedule and tasks</h2><p>Plan the week, share activities and track completed tasks.</p></div></div>
      <div className="content-grid"><div className="stack">
        <EventBoard key={`ev-${childId}`} childId={childId} token={token} weekStart={weekStart} canCreate refreshKey={refreshKey} />
        {isParent && <SpecialistLinks key={`sp-${childId}`} childId={childId} token={token} />}
      </div><div className="stack"><TaskBoard key={`tk-${childId}`} childId={childId} token={token} weekStart={weekStart} role={role} refreshKey={refreshKey} /></div></div>
    </>}
  </Layout>;
}
