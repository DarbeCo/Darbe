import { createClient } from "https://esm.sh/@supabase/supabase-js@2.103.0";

const BLS_SERIES_ID = "CES0500000008";
const FRINGE_BENEFIT_MULTIPLIER = 1.157;

type BlsDatum = {
  year: string;
  period: string;
  value: string;
};

type BlsResponse = {
  Results?: {
    series?: Array<{
      seriesID: string;
      data?: BlsDatum[];
    }>;
  };
};

const getLatestAnnualAverage = (data: BlsDatum[]) => {
  const annualRows = data
    .filter((row) => row.period === "M13")
    .map((row) => ({
      year: Number(row.year),
      value: Number(row.value),
    }))
    .filter((row) => Number.isFinite(row.year) && Number.isFinite(row.value))
    .sort((left, right) => right.year - left.year);

  if (annualRows[0]) {
    return annualRows[0];
  }

  const valuesByYear = new Map<number, number[]>();
  data.forEach((row) => {
    const year = Number(row.year);
    const value = Number(row.value);
    if (!Number.isFinite(year) || !Number.isFinite(value)) return;
    if (!/^M\d{2}$/.test(row.period) || row.period === "M13") return;

    const values = valuesByYear.get(year) ?? [];
    values.push(value);
    valuesByYear.set(year, values);
  });

  const latestCompleteYear = Array.from(valuesByYear.entries())
    .filter(([, values]) => values.length >= 12)
    .sort(([leftYear], [rightYear]) => rightYear - leftYear)[0];

  if (!latestCompleteYear) {
    throw new Error("BLS response did not include annual average data.");
  }

  const [year, values] = latestCompleteYear;
  return {
    year,
    value: values.reduce((total, value) => total + value, 0) / values.length,
  };
};

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response("Missing Supabase function environment.", {
      status: 500,
    });
  }

  const currentYear = new Date().getUTCFullYear();
  const registrationKey = Deno.env.get("BLS_API_KEY");
  const body: Record<string, unknown> = {
    seriesid: [BLS_SERIES_ID],
    startyear: String(currentYear - 3),
    endyear: String(currentYear),
  };

  if (registrationKey) {
    body.registrationkey = registrationKey;
  }

  const blsResponse = await fetch("https://api.bls.gov/publicAPI/v2/timeseries/data/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!blsResponse.ok) {
    return new Response(`BLS request failed: ${blsResponse.status}`, {
      status: 502,
    });
  }

  const blsData = (await blsResponse.json()) as BlsResponse;
  const series = blsData.Results?.series?.find(
    (item) => item.seriesID === BLS_SERIES_ID
  );
  const annualAverage = getLatestAnnualAverage(series?.data ?? []);
  const hourlyValue = Number(
    (annualAverage.value * FRINGE_BENEFIT_MULTIPLIER).toFixed(2)
  );

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { error } = await supabase.from("volunteer_value_rates").upsert(
    {
      id: "current",
      hourly_value: hourlyValue,
      source: `BLS ${BLS_SERIES_ID} with ${FRINGE_BENEFIT_MULTIPLIER} fringe multiplier`,
      source_year: annualAverage.year,
      fetched_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  return Response.json({
    hourlyValue,
    sourceYear: annualAverage.year,
  });
});
