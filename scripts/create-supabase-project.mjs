/**
 * Create a new Supabase project (hosted Postgres) in an organization.
 * Supabase does not support multiple user databases inside one project;
 * each project is its own Postgres instance.
 *
 * Usage:
 *   set SUPABASE_ACCESS_TOKEN=sbp_...
 *   node scripts/create-supabase-project.mjs
 *
 * Optional env:
 *   SUPABASE_ORG_SLUG=TanveerAssociates
 *   SUPABASE_PROJECT_NAME=TanveerAssociatesNew
 *   SUPABASE_DB_PASSWORD=strong-password-here
 *   SUPABASE_REGION=ap-northeast-1
 */

const token = process.env.SUPABASE_ACCESS_TOKEN;
const orgSlug =
  process.env.SUPABASE_ORG_SLUG?.trim() || "TanveerAssociates";
const projectName =
  process.env.SUPABASE_PROJECT_NAME?.trim() || "TanveerAssociatesNew";
const dbPass =
  process.env.SUPABASE_DB_PASSWORD ||
  crypto.randomUUID().replace(/-/g, "") + "Aa1!";
const region = process.env.SUPABASE_REGION?.trim() || "ap-northeast-1";

if (!token) {
  console.error(
    "Missing SUPABASE_ACCESS_TOKEN. Create one at https://supabase.com/dashboard/account/tokens",
  );
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};

async function api(path, init = {}) {
  const res = await fetch(`https://api.supabase.com/v1${path}`, {
    ...init,
    headers: { ...headers, ...init.headers },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    throw new Error(`${init.method || "GET"} ${path} ${res.status}: ${text}`);
  }
  return body;
}

const orgs = await api("/organizations");
const org = orgs.find(
  (o) =>
    o.slug === orgSlug ||
    o.name === orgSlug ||
    o.slug?.toLowerCase() === orgSlug.toLowerCase(),
);

if (!org) {
  console.error(
    "Organization not found. Available:",
    orgs.map((o) => ({ name: o.name, slug: o.slug })),
  );
  process.exit(1);
}

console.log("Using organization:", org.name, org.slug);

const created = await api("/projects", {
  method: "POST",
  body: JSON.stringify({
    organization_slug: org.slug,
    name: projectName,
    db_pass: dbPass,
    region_selection: { type: "specific", code: region },
  }),
});

console.log("\nProject creation started:");
console.log(JSON.stringify(created, null, 2));
console.log("\nDatabase password (save securely):", dbPass);
console.log(
  "\nWhen status is ACTIVE_HEALTHY, copy the Session pooler DATABASE_URL from:",
);
console.log(
  `https://supabase.com/dashboard/project/${created.ref}?showConnect=true`,
);
