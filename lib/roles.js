export const ROLES = {
  VIEWER: 'viewer',
  INVESTOR: 'investor',
  ADMIN: 'admin',
};

export function canAccessDocuments(role) {
  return role === ROLES.INVESTOR || role === ROLES.ADMIN;
}

export function canAccessCourses(role) {
  return true; // both viewers + investors
}