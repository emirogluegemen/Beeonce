import { useEffect, useState } from 'react';
import { request } from '../lib/api';
import { dateLocal, dueDateText, DEVELOPMENT_AREAS } from '../lib/dates';
import { Empty, Notice, Panel } from './Layout';

function TaskForm({ childId, token, onCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [area, setArea] = useState('cognitive');
  const [dueAt, setDueAt] = useState(() => dateLocal());
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  async function submit(e) {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await request(`/children/${childId}/tasks`, { token, method: 'POST', body: {
        title, description, developmentArea: area, dueAt
      } });
      setTitle(''); setDescription(''); onCreated();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }
  return <form onSubmit={submit} className="form-stack" aria-label="Assign a task">
    <h3>Assign a task</h3><Notice>{error}</Notice>
    <label>Task title<input required maxLength={120} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Practice reading" /></label>
    <label>Description<textarea required maxLength={1000} rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="What should the child do?" /></label>
    <div className="form-grid"><label>Development area<select value={area} onChange={e => setArea(e.target.value)}>
      {Object.entries(DEVELOPMENT_AREAS).map(([key, label]) => <option value={key} key={key}>{label}</option>)}
    </select></label>
    <label>Due date<input required type="date" value={dueAt} onChange={e => setDueAt(e.target.value)} /></label></div>
    <button className="button button-primary" disabled={saving}>{saving ? 'Assigning…' : 'Assign task'}</button>
  </form>;
}

export function TaskBoard({ childId, token, weekStart, role, refreshKey = 0 }) {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [counter, setCounter] = useState(0);
  const [mine, setMine] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const canCreate = role !== 'child';
  useEffect(() => {
    let active = true;
    setError('');
    const filter = mine && canCreate ? '&assignedBy=me' : '';
    request(`/children/${childId}/tasks?weekStart=${weekStart}${filter}`, { token })
      .then(data => { if (active) setTasks(data.tasks); })
      .catch(err => { if (active) { setError(err.message); setTasks([]); } });
    return () => { active = false; };
  }, [childId, token, weekStart, mine, canCreate, counter, refreshKey]);

  async function complete(taskId) {
    setBusyId(taskId); setActionError('');
    try {
      await request(`/tasks/${taskId}/completion`, { token, method: 'PATCH', body: { completed: true } });
      setCounter(v => v + 1);
    } catch (err) { setActionError(err.message); } finally { setBusyId(null); }
  }
  const done = tasks.filter(t => t.status === 'completed').length;
  return <Panel title={role === 'child' ? 'My tasks' : 'Assigned tasks'} eyebrow="M4 · Tasks and completion"
    right={<span className="metric-pill">{done}/{tasks.length} completed</span>}>
    <Notice>{error || actionError}</Notice>
    {canCreate && <label className="filter-check"><input type="checkbox" checked={mine} onChange={e => setMine(e.target.checked)} /> Show only tasks assigned by me</label>}
    {tasks.length === 0 && !error ? <Empty>No tasks due in this week{mine ? ' assigned by you' : ''}.</Empty> :
      <ul className="task-list">{tasks.map(task => <li className="task-item" key={task.id}>
        <span className={`task-status ${task.status === 'completed' ? 'task-status-done' : ''}`} aria-hidden="true">{task.status === 'completed' ? '✓' : '○'}</span>
        <div className="task-copy"><div className="task-title-row"><strong>{task.title}</strong><span className={`status-badge ${task.status === 'completed' ? 'badge-done' : ''}`}>{task.status === 'completed' ? 'Completed' : 'Pending'}</span></div>
          <p>{task.description}</p><small>{DEVELOPMENT_AREAS[task.developmentArea]} · Due {dueDateText(task.dueAt)} · Assigned by {task.assignedByName}</small>
          {task.completedAt && <small className="completion-date">Completed {new Date(task.completedAt).toLocaleString('en-GB')}</small>}
        </div>
        {role === 'child' && task.status !== 'completed' && <button className="button button-primary complete-button" disabled={busyId === task.id} onClick={() => complete(task.id)} aria-label={`Mark ${task.title} as done`}>{busyId === task.id ? 'Saving…' : 'Mark done'}</button>}
      </li>)}</ul>}
    {canCreate && <div className="section-divider"><TaskForm token={token} childId={childId} onCreated={() => setCounter(v => v + 1)} /></div>}
  </Panel>;
}
