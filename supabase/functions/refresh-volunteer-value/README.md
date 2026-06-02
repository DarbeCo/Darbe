# refresh-volunteer-value

Refreshes `public.volunteer_value_rates.current` from the BLS Public Data API.

Deploy:

```sh
supabase functions deploy refresh-volunteer-value --no-verify-jwt
```

Optional secret for higher BLS API limits:

```sh
supabase secrets set BLS_API_KEY=your_bls_registration_key
```

Schedule it daily in Supabase Dashboard:

1. Edge Functions
2. `refresh-volunteer-value`
3. Schedules
4. Add schedule: `0 8 * * *`

The function uses BLS series `CES0500000008` and a `1.157` fringe benefit
multiplier to approximate the annual volunteer value per hour.
