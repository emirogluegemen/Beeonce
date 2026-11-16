'use strict';
const { mondayUTC, weekBounds, validDateOnly, validDateTime } = require('../src/validation');
const { hashPassword, verifyPassword } = require('../src/security');

test('Monday starts a UTC Monday–Sunday week', () => {
  expect(mondayUTC(new Date('2026-11-22T23:00:00Z'))).toBe('2026-11-16');
  const week = weekBounds('2026-11-16');
  expect(week.startDate).toBe('2026-11-16');
  expect(week.endDate).toBe('2026-11-23');
});
test('invalid calendar dates and missing timezone are rejected', () => {
  expect(() => validDateOnly('2026-02-30')).toThrow();
  expect(() => weekBounds('2026-11-17')).toThrow();
  expect(() => validDateTime('2026-11-18T10:00:00', 'time')).toThrow();
});
test('passwords are salted and verified using constant-time comparison', () => {
  const hashedA = hashPassword('Demo1234!');
  const hashedB = hashPassword('Demo1234!');
  expect(hashedA).not.toBe(hashedB);
  expect(verifyPassword('Demo1234!', hashedA)).toBe(true);
  expect(verifyPassword('wrong', hashedA)).toBe(false);
  expect(verifyPassword('Demo1234!', 'bad-format')).toBe(false);
});
