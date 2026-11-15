export function mondayUTC(now = new Date()) {
  const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  day.setUTCDate(day.getUTCDate() - (day.getUTCDay() + 6) % 7);
  return day.toISOString().slice(0, 10);
}
export function moveWeek(weekStart, weeks) {
  const d = new Date(`${weekStart}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + weeks * 7);
  return d.toISOString().slice(0, 10);
}
export function weekLabel(weekStart) {
  const end = moveWeek(weekStart, 1);
  const fmt = text => new Date(`${text}T12:00:00.000Z`).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', timeZone: 'UTC'
  });
  const last = new Date(`${end}T00:00:00.000Z`);
  last.setUTCDate(last.getUTCDate() - 1);
  return `${fmt(weekStart)} – ${fmt(last.toISOString().slice(0, 10))}`;
}
export function dateLocal(now = new Date()) {
  const pad = n => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
export function dateTimeLocal(now = new Date()) {
  const pad = n => String(n).padStart(2, '0');
  return `${dateLocal(now)}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}
export function dateText(iso) {
  return new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
}
export function dueDateText(value) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('en-GB', { dateStyle: 'medium' });
}
export const DEVELOPMENT_AREAS = {
  cognitive: 'Cognitive', social_emotional: 'Social & emotional',
  language: 'Language', motor: 'Motor', self_care: 'Self-care'
};
export const SPECIALIST_TYPES = {
  teacher: 'Teacher', psychologist: 'Psychologist', doctor: 'Doctor',
  special_education_teacher: 'Special education teacher', coach: 'Coach'
};
