import { useEffect, useState } from 'react';
import { Layout, Notice, WeekPicker } from '../components/Layout';
import { useAuth } from '../lib/auth';
import { request } from '../lib/api';
import { mondayUTC } from '../lib/dates';
import { EventBoard } from '../components/EventBoard';
import { TaskBoard } from '../components/TaskBoard';

export function ChildHome() {
  const { user, token } = useAuth();
  const [child, setChild] = useState(null);
  const [error, setError] = useState('');
  const [weekStart, setWeekStart] = useState(() => mondayUTC());
  useEffect(() => {
    let active = true;
    request('/child/me', { token })
      .then(data => { if (active) setChild(data.child); })
      .catch(err => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [token]);
  return <Layout><div className="page-heading"><div><p className="eyebrow">Child dashboard · M1–M4</p>
    <h1>Hello, {user.display_name.split(' ')[0]}! <span aria-hidden="true">👋</span></h1><p className="muted">Here are your activities and tasks for the week.</p></div></div>
    <Notice>{error}</Notice>
    {child && <><div className="toolbar toolbar-child"><span className="read-only-caption">My weekly plan</span><WeekPicker weekStart={weekStart} onChange={setWeekStart} /></div>
      <div className="overview-banner child-banner"><div className="overview-icon" aria-hidden="true">★</div>
        <div><p className="eyebrow">Small steps, great progress</p><h2>What will you do this week?</h2><p>When you finish a task, press “Mark done”.</p></div></div>
      <div className="content-grid child-grid"><TaskBoard childId={child.id} token={token} weekStart={weekStart} role="child" />
        <EventBoard childId={child.id} token={token} weekStart={weekStart} canCreate={false} /></div></>}
  </Layout>;
}
