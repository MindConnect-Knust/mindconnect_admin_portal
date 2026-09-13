/**
 * Rendering gates for the portal, kept free of network imports so they can be
 * tested directly.
 *
 * These decide which links and pages a client bothers to show. They are not the
 * control: the server re-checks every permission on every request, and case
 * access additionally requires assignment to the case.
 */
const has = (list, permission) => Array.isArray(list) && list.includes(permission);

export const canCare = (session, permission) => has(session?.adminPermissions, permission);
export const canCase = (session, permission) => has(session?.casePermissions, permission);
export const canAnalytics = (session, permission) => has(session?.adminPermissions, permission);
/** Institutional administration permissions (staff access, directory import). */
export const canAdmin = (session, permission) => session?.rawRole === "admin" && has(session?.adminPermissions, permission);

/** Professional concern-referral permissions live with case permissions. */
export const canConcern = (session, permission) =>
  ["counsellor", "admin"].includes(session?.rawRole) && has(session?.casePermissions, permission);

/** Outcome permissions also live with case permissions. */
export const canOutcome = (session, permission) =>
  ["counsellor", "admin"].includes(session?.rawRole) && has(session?.casePermissions, permission);

/** A verified staff reporter. */
export const isStaff = (session) => session?.rawRole === "staff" && session?.staffVerified === true;
export const canStaff = (session, permission) => isStaff(session) && has(session?.staffPermissions, permission);

/** Where a signed-in person should land. */
export const homePathFor = (session) => {
  if (session?.rawRole === "staff") return "/staff";
  if (session?.rawRole === "counsellor") return has(session?.casePermissions, "CASE_VIEW_ASSIGNED") ? "/cases" : "/crisis";
  return "/";
};
