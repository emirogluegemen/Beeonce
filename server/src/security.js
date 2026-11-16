'use strict';
const { randomBytes, scryptSync, timingSafeEqual } = require('node:crypto');

function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
function verifyPassword(password, stored) {
  if (typeof stored !== 'string' || !stored.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  try {
    const actual = scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, 'hex');
    return expected.length === actual.length && timingSafeEqual(actual, expected);
  } catch { return false; }
}
function signingSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error('JWT_SECRET must have at least 32 characters');
  return secret;
}
function createToken(user) {
  const jwt = require('jsonwebtoken');
  return jwt.sign({ sub: String(user.id) }, signingSecret(), {
    algorithm: 'HS256', expiresIn: '8h', issuer: 'seng383-child-hub'
  });
}
function decodeToken(token) {
  const jwt = require('jsonwebtoken');
  return jwt.verify(token, signingSecret(), { algorithms: ['HS256'], issuer: 'seng383-child-hub' });
}
module.exports = { hashPassword, verifyPassword, createToken, decodeToken };
