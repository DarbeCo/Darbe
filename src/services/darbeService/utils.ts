import { supabase } from "../supabase/client";

export const ensureUserId = async (): Promise<string> => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    throw error ?? new Error("Not authenticated");
  }
  return data.user.id;
};
