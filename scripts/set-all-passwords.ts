import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/services/supabase/database.types";

const args = process.argv.slice(2);
const hasFlag = (flag: string) => args.includes(flag);
const getArgValue = (flag: string) => {
  const index = args.indexOf(flag);
  if (index === -1) return null;
  return args[index + 1] ?? null;
};

const password = getArgValue("--password") ?? "password1!";
const apply = hasFlag("--apply");
const dryRun = !apply;

const supabaseUrl =
  process.env.SUPABASE_URL ??
  process.env.VITE_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "";
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SERVICE_ROLE_KEY ??
  "";

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY in env.");
  process.exit(1);
}

if (!password) {
  console.error("Missing --password value.");
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const listAllUsers = async () => {
  const users: { id: string; email?: string }[] = [];
  let page = 1;
  const perPage = 1000;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    users.push(...data.users.map((user) => ({ id: user.id, email: user.email ?? undefined })));
    if (!data.nextPage) break;
    page = data.nextPage;
  }
  return users;
};

const main = async () => {
  console.log(`Mode: ${dryRun ? "dry-run" : "apply"}`);
  const users = await listAllUsers();
  console.log(`Users found: ${users.length}`);

  if (dryRun) {
    console.log("Dry run only. Re-run with --apply to update passwords.");
    return;
  }

  let updated = 0;
  for (const user of users) {
    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      password,
    });
    if (error) {
      console.error(`Failed to update ${user.email ?? user.id}:`, error.message);
      continue;
    }
    updated += 1;
  }

  console.log(`Passwords updated: ${updated}/${users.length}`);
};

main().catch((error) => {
  console.error("Password reset failed:", error);
  process.exit(1);
});
