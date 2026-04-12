import type { Cause } from "../types/cause.types";
import { supabase } from "../supabase/client";
import { ensureUserId } from "./utils";

const mapCause = (row: {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  active: boolean;
}): Cause => ({
  id: row.id,
  name: row.name,
  description: row.description,
  imageUrl: row.image_url ?? "",
  active: row.active,
});

export const getCauses = async (): Promise<Cause[]> => {
  const { data, error } = await supabase
    .from("causes")
    .select("id, name, description, image_url, active")
    .order("name");

  if (error) throw error;

  return (data ?? []).map(mapCause);
};

export const getMutualCauses = async (otherUserId: string): Promise<Cause[]> => {
  const userId = await ensureUserId();

  const [{ data: myCauses, error: myError }, { data: otherCauses, error: otherError }] =
    await Promise.all([
      supabase.from("user_causes").select("cause_id").eq("user_id", userId),
      supabase.from("user_causes").select("cause_id").eq("user_id", otherUserId),
    ]);

  if (myError) throw myError;
  if (otherError) throw otherError;

  const myCauseIds = new Set((myCauses ?? []).map((row) => row.cause_id));
  const mutualIds = (otherCauses ?? [])
    .map((row) => row.cause_id)
    .filter((causeId) => myCauseIds.has(causeId));

  if (!mutualIds.length) return [];

  const { data: causes, error: causesError } = await supabase
    .from("causes")
    .select("id, name, description, image_url, active")
    .in("id", mutualIds)
    .order("name");

  if (causesError) throw causesError;

  return (causes ?? []).map(mapCause);
};
