'use strict';
const TYPES = ['teacher', 'psychologist', 'doctor', 'special_education_teacher', 'coach'];
const AREAS = ['cognitive', 'social_emotional', 'language', 'motor', 'self_care'];
const pad = n => String(n).padStart(2, '0');

function requiredString(value, name, max = 120) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) {
    const err = new Error(`${name} must be 1–${max} characters`); err.status = 400; throw err;
  }
  return value.trim();
}
function optionalString(value, name, max = 1000) {
  if (value == null || value === '') return '';
  if (typeof value !== 'string' || value.length > max) {
    const err = new Error(`${name} must be at most ${max} characters`); err.status = 400; throw err;
  }
  return value.trim();
}
function choice(value, allowed, name) {
  if (!allowed.includes(value)) { const err = new Error(`Invalid ${name}`); err.status = 400; throw err; }
  return value;
}
function validDateOnly(input, name = 'date') {
  if (typeof input !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const err = new Error(`Invalid ${name}; expected YYYY-MM-DD`); err.status = 400; throw err;
  }
  const date = new Date(`${input}T00:00:00.000Z`);
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== input) {
    const err = new Error(`Invalid ${name}`); err.status = 400; throw err;
  }
  return input;
}
function validDateTime(input, name) {
  if (typeof input !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(input) || !/(Z|[+-]\d{2}:\d{2})$/.test(input)) {
    const err = new Error(`Invalid ${name}; expected ISO 8601 with timezone`); err.status = 400; throw err;
  }
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) { const err = new Error(`Invalid ${name}`); err.status = 400; throw err; }
  return date.toISOString();
}
function weekBounds(weekStart) {
  const text = validDateOnly(weekStart, 'weekStart');
  const date = new Date(`${text}T00:00:00.000Z`);
  if (date.getUTCDay() !== 1) {
    const err = new Error('weekStart must be a Monday (UTC)'); err.status = 400; throw err;
  }
  const weekEnd = new Date(date.valueOf() + 7 * 24 * 60 * 60 * 1000).toISOString();
  return { start: date.toISOString(), end: weekEnd, startDate: text, endDate: weekEnd.slice(0, 10) };
}
function mondayUTC(now = new Date()) {
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7);
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}
module.exports = { TYPES, AREAS, requiredString, optionalString, choice, validDateOnly, validDateTime, weekBounds, mondayUTC };
