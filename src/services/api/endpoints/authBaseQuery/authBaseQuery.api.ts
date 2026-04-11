import { fakeBaseQuery } from "@reduxjs/toolkit/query/react";

// All endpoints use queryFn (Supabase services), so we don't need a network base query.
export const baseQuery = fakeBaseQuery();
