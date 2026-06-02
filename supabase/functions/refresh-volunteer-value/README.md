# refresh-volunteer-value

Refreshes `public.volunteer_value_rates.current` with the cached Texas volunteer
value.

Deploy:

```sh
supabase functions deploy refresh-volunteer-value --no-verify-jwt
```

Schedule it daily in Supabase Dashboard:

1. Edge Functions
2. `refresh-volunteer-value`
3. Schedules
4. Add schedule: `0 8 * * *`

The function stores the current Texas volunteer value per hour, `$33.59`, so the
scheduled refresh keeps the database aligned with the app fallback.
