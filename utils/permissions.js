/**
 * Phase 2: Centralized Permission Matrix
 * Used by frontend and backend to determine if a role has access to a specific action
 */

const PERMISSION_MATRIX = {
  admin: {
    users: ['view', 'create', 'edit', 'delete'],
    fees: ['view', 'create', 'edit', 'delete', 'export'],
    attendance: ['view', 'create', 'edit', 'delete'],
    homework: ['view', 'create', 'edit', 'delete'],
    results: ['view', 'create', 'edit', 'delete'],
    notices: ['view', 'create', 'edit', 'delete'],
    gallery: ['view', 'create', 'edit', 'delete'],
    settings: ['view', 'edit'],
    audit: ['view', 'export'],
    backup: ['create', 'export']
  },
  director: {
    users: ['view', 'create', 'edit', 'delete'],
    fees: ['view', 'create', 'edit', 'delete', 'export'],
    attendance: ['view', 'create', 'edit', 'delete'],
    homework: ['view', 'create', 'edit', 'delete'],
    results: ['view', 'create', 'edit', 'delete'],
    notices: ['view', 'create', 'edit', 'delete'],
    gallery: ['view', 'create', 'edit', 'delete'],
    settings: ['view', 'edit'],
    audit: ['view', 'export'],
    backup: ['create', 'export']
  },
  teacher: {
    users: ['view_students'],
    fees: [],
    attendance: ['view', 'create', 'edit'],
    homework: ['view', 'create', 'edit', 'delete'],
    results: ['view', 'create', 'edit'],
    notices: ['view'],
    gallery: ['view'],
    settings: [],
    audit: [],
    backup: []
  },
  student: {
    users: ['view_self'],
    fees: ['view_self'],
    attendance: ['view_self'],
    homework: ['view'],
    results: ['view_self'],
    notices: ['view'],
    gallery: ['view'],
    settings: [],
    audit: [],
    backup: []
  }
};

/**
 * Check if a role has a specific permission
 */
const hasPermission = (role, resource, action) => {
  if (!PERMISSION_MATRIX[role]) return false;
  if (!PERMISSION_MATRIX[role][resource]) return false;
  return PERMISSION_MATRIX[role][resource].includes(action);
};

module.exports = {
  PERMISSION_MATRIX,
  hasPermission
};
