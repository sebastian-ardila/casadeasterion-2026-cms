// Cosmetic expansion for staff role acronyms in the CMS UI. Mirrors
// apps/web/src/lib/staff.ts so the editor sees the same labelling
// pattern as the public site.

const EXPANSIONS: Record<string, string> = {
  CEO: "Chief Executive Officer",
  CTO: "Chief Technology Officer",
  COO: "Chief Operating Officer",
  CFO: "Chief Financial Officer",
  CMO: "Chief Marketing Officer",
};

/** Returns "CEO — Chief Executive Officer" for known acronyms, else the
 *  original string. Used to enrich the role dropdown labels without
 *  changing the persisted value. */
export function roleLabel(role: string): string {
  const primary = role.trim();
  const exp = EXPANSIONS[primary.toUpperCase()];
  return exp ? `${primary} — ${exp}` : primary;
}
