import { useEffect, useState } from 'react';
import { request } from '../lib/api';
import { SPECIALIST_TYPES } from '../lib/dates';
import { Empty, Notice, Panel } from './Layout';

export function SpecialistLinks({ childId, token }) {
  const [specialists, setSpecialists] = useState([]);
  const [email, setEmail] = useState('');
  const [type, setType] = useState('teacher');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true; setError('');
    request(`/children/${childId}/specialists`, { token })
      .then(data => { if (active) setSpecialists(data.specialists); })
      .catch(err => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [childId, token, refresh]);
  async function add(e) {
    e.preventDefault(); setError(''); setSuccess(''); setLoading(true);
    try {
      await request(`/children/${childId}/specialists`, { token, method: 'POST', body: { email, specialistType: type } });
      setSuccess('Specialist linked successfully.'); setEmail(''); setRefresh(n => n + 1);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }
  async function remove(specialist) {
    if (!window.confirm(`Unlink ${specialist.displayName}? Their access to this child will end immediately.`)) return;
    setError(''); setSuccess('');
    try {
      await request(`/children/${childId}/specialists/${specialist.id}`, { token, method: 'DELETE' });
      setSuccess(`${specialist.displayName} has been unlinked.`); setRefresh(n => n + 1);
    } catch (err) { setError(err.message); }
  }
  return <Panel title="Linked specialists" eyebrow="M2 · Manage access">
    <Notice>{error}</Notice><Notice type="success">{success}</Notice>
    {specialists.length === 0 ? <Empty>No specialists linked yet.</Empty> : <ul className="link-list">{specialists.map(person => <li key={person.id}>
      <div className="person-icon" aria-hidden="true">{person.displayName.charAt(0)}</div>
      <div className="person-copy"><strong>{person.displayName}</strong><small>{SPECIALIST_TYPES[person.specialistType]} · {person.email}</small></div>
      <button type="button" className="button button-danger" onClick={() => remove(person)} aria-label={`Unlink ${person.displayName}`}>Unlink</button>
    </li>)}</ul>}
    <div className="section-divider"><form onSubmit={add} className="form-stack" aria-label="Link specialist">
      <h3>Link a registered specialist</h3>
      <label>Registered email<input type="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} placeholder="doctor@demo.test" /></label>
      <label>Specialist type<select value={type} onChange={e => setType(e.target.value)}>{Object.entries(SPECIALIST_TYPES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <button className="button button-primary" disabled={loading}>{loading ? 'Linking…' : 'Link specialist'}</button>
      <p className="hint">Only pre-registered specialist accounts can be linked. Unlinking revokes API access immediately.</p>
    </form></div>
  </Panel>;
}
