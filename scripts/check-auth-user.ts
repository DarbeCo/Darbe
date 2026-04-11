import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/services/supabase/database.types";

const args = process.argv.slice(2);
const getArgValue = (flag: string) => {
  const index = args.indexOf(flag);
  if (index === -1) return null;
  return args[index + 1] ?? null;
};

const emailArg = getArgValue("--email");
const userIdArg = getArgValue("--user-id");

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

if (!emailArg && !userIdArg) {
  console.error("Usage: node scripts/check-auth-user.ts --email user@example.com");
  console.error("   or: node scripts/check-auth-user.ts --user-id <uuid>");
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const findUserByEmail = async (email: string) => {
  const target = email.trim().toLowerCase();
  let page = 1;
  const perPage = 1000;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const match = data.users.find(
      (user) => (user.email ?? "").toLowerCase() === target
    );
    if (match) return match;
    if (!data.nextPage) break;
    page = data.nextPage;
  }
  return null;
};

const main = async () => {
  console.log(`Supabase URL: ${supabaseUrl}`);

  if (userIdArg) {
    const { data, error } = await supabase.auth.admin.getUserById(userIdArg);
    if (error) throw error;
    if (!data.user) {
      console.log(`No auth user found for id ${userIdArg}`);
      return;
    }
    console.log("Auth user found:", {
      id: data.user.id,
      email: data.user.email ?? null,
      createdAt: data.user.created_at ?? null,
      lastSignInAt: data.user.last_sign_in_at ?? null,
    });
    return;
  }

  const user = await findUserByEmail(emailArg ?? "");
  if (!user) {
    console.log(`No auth user found for email ${emailArg}`);
    return;
  }
  console.log("Auth user found:", {
    id: user.id,
    email: user.email ?? null,
    createdAt: user.created_at ?? null,
    lastSignInAt: user.last_sign_in_at ?? null,
  });
};

main().catch((error) => {
  console.error("Auth user check failed:", error);
  process.exit(1);
});
