import { createClient } from "https://esm.sh/@supabase/supabase-js@2.103.0";

const TEXAS_VOLUNTEER_VALUE_PER_HOUR = 33.59;
const TEXAS_VOLUNTEER_VALUE_SOURCE_YEAR = 2025;

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response("Missing Supabase function environment.", {
      status: 500,
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { error } = await supabase.from("volunteer_value_rates").upsert(
    {
      id: "current",
      hourly_value: TEXAS_VOLUNTEER_VALUE_PER_HOUR,
      source: "Texas volunteer value cached override",
      source_year: TEXAS_VOLUNTEER_VALUE_SOURCE_YEAR,
      fetched_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  return Response.json({
    hourlyValue: TEXAS_VOLUNTEER_VALUE_PER_HOUR,
    sourceYear: TEXAS_VOLUNTEER_VALUE_SOURCE_YEAR,
  });
});
