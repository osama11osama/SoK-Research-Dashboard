const AuditLog = require('../models/AuditLog');

// Role-based access control middleware factory
const requireRole = (...allowedRoles) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

// Specific role checkers
exports.requireSuperAdmin = requireRole('SUPER_ADMIN');
exports.requireReviewerNote = requireRole('SUPER_ADMIN', 'REVIEWER_NOTE');
exports.requireAnyApproved = requireRole('SUPER_ADMIN', 'REVIEWER_NOTE', 'REVIEWER_VIEW');

// Audit logging helper
exports.logAudit = async (actorUserId, action, targetType, targetId, metadata = {}) => {
  try {
    await AuditLog.create({
      actorUserId,
      action,
      targetType,
      targetId,
      metadata
    });
  } catch (err) {
    console.error('Failed to create audit log:', err);
  }
};

module.exports = {
  requireSuperAdmin: exports.requireSuperAdmin,
  requireReviewerNote: exports.requireReviewerNote,
  requireAnyApproved: exports.requireAnyApproved,
  logAudit: exports.logAudit
};

