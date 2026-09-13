export const canCrisis = (session, permission) =>
  Array.isArray(session?.crisisPermissions) && session.crisisPermissions.includes(permission);
