'use strict';
const { decodeToken } = require('./security');

function authenticate(db) {
  return (req, res, next) => {
    const header = req.get('authorization') || '';
    const matched = /^Bearer (.+)$/i.exec(header);
    if (!matched) return res.status(401).json({ error: 'Authentication required' });
    try {
      const payload = decodeToken(matched[1]);
      // Role is ALWAYS read from the database, never from a client-supplied value.
      const user = db.prepare('SELECT id, email, display_name, role FROM users WHERE id = ?').get(Number(payload.sub));
      if (!user) return res.status(401).json({ error: 'Invalid session' });
      req.user = user;
      next();
    } catch { return res.status(401).json({ error: 'Invalid or expired session' }); }
  };
}
function requireRole(...roles) {
  return (req, res, next) => roles.includes(req.user.role)
    ? next() : res.status(403).json({ error: 'Role cannot perform this action' });
}
function childAccess(db, permission = 'read') {
  return (req, res, next) => {
    const childId = Number(req.params.childId);
    if (!Number.isSafeInteger(childId) || childId <= 0) return res.status(404).json({ error: 'Child not found' });
    const child = db.prepare('SELECT id, user_id, parent_user_id, display_name FROM children WHERE id = ?').get(childId);
    if (!child) return res.status(404).json({ error: 'Child not found' });
    const user = req.user;
    let allowed = false;
    if (user.role === 'parent') allowed = user.id === child.parent_user_id;
    if (user.role === 'specialist') allowed = !!db.prepare(
      'SELECT 1 FROM specialist_links WHERE child_id = ? AND specialist_user_id = ?'
    ).get(childId, user.id);
    if (user.role === 'child') allowed = permission === 'read' && user.id === child.user_id;
    if (!allowed) return res.status(403).json({ error: 'Access to this child is denied' });
    req.child = child;
    next();
  };
}
function ownerOnly(req, res, next) {
  if (req.user.role !== 'parent' || req.user.id !== req.child.parent_user_id) {
    return res.status(403).json({ error: 'Only the owning parent can manage specialists' });
  }
  next();
}
module.exports = { authenticate, requireRole, childAccess, ownerOnly };
