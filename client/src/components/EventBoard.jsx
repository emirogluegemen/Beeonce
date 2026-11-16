import { useEffect, useState } from 'react';
import { request } from '../lib/api';
import { dateText, dateTimeLocal } from '../lib/dates';
import { Empty, Notice, Panel } from './Layout';

function EventForm({ childId, token, onCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [start, setStart] = useState(() => dateTimeLocal(new Date(Date.now() + 60 * 60 * 1000)));
  const [end, setEnd] = useState(() => dateTimeLocal(new Date(Date.now() + 90 * 60 * 1000)));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  async function submit(e) {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      await request(`/children/${childId}/events`, { token, method: 'POST', body: {
        title, description, startsAt: new Date(start).toISOString(), endsAt: new Date(end).toISOString()
      } });
      setTitle(''); setDescription(''); onCreated();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }
  return <form onSubmit={submit} className="form-stack" aria-label="Add an event">
    <h3>Add an event</h3><Notice>{error}</Notice>
    <label>Event title<input required maxLength={120} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Reading session" /></label>
    <label>Description <span className="muted">(optional)</span><textarea maxLength={1000} rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="Add any useful details" /></label>
    <div className="form-grid"><label>Starts<input required type="datetime-local" value={start} onChange={e => setStart(e.target.value)} /></label>
      <label>Ends<input required type="datetime-local" value={end} onChange={e => setEnd(e.target.value)} /></label></div>
    <button className="button button-primary" disabled={saving}>{saving ? 'Saving…' : 'Add to schedule'}</button>
  </form>;
}
export function EventBoard({ childId, token, weekStart, canCreate, refreshKey = 0 }) {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');
  const [counter, setCounter] = useState(0);
  useEffect(() => {
    let active = true;
    setError('');
    request(`/children/${childId}/events?weekStart=${weekStart}`, { token })
      .then(data => { if (active) setEvents(data.events); })
      .catch(err => { if (active) { setError(err.message); setEvents([]); } });
    return () => { active = false; };
  }, [childId, token, weekStart, counter, refreshKey]);
  return <Panel title="Weekly schedule" eyebrow="M3 · Shared calendar">
    <Notice>{error}</Notice>
    {events.length === 0 && !error ? <Empty>No events scheduled for this week.</Empty> :
      <ol className="timeline">{events.map(event => <li key={event.id} className="timeline-item">
        <span className="timeline-dot" aria-hidden="true" /><div><strong>{event.title}</strong>
          <div className="item-meta">{dateText(event.startsAt)} – {new Date(event.endsAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
          {event.description && <p>{event.description}</p>}
          <small>Added by {event.createdByName}</small></div>
      </li>)}</ol>}
    {canCreate && <div className="section-divider"><EventForm childId={childId} token={token} onCreated={() => setCounter(v => v + 1)} /></div>}
  </Panel>;
}
