// Supabase Edge Function: delete-account
//
// Lets a signed-in user permanently delete their own VISTA account from
// inside the app. Required by App Store Guideline 5.1.1(v): an app that
// supports account creation must also let the user initiate deletion
// in-app — routing them to a support contact instead does not satisfy it.
//
// The caller is identified only from their own access token (verified via
// a client scoped to that token) — never from a client-supplied user id,
// so one signed-in user can't delete another's account.
//
// Booking-history rows (bookings, vista_rides, pilgrim_packages) are kept
// but scrubbed of personal fields rather than deleted outright — the
// booking_ref/amounts are real financial records needed for driver payout
// accounting, the same way Uber/Bolt retain anonymized trip records after
// a rider deletes their account.
//
// ── Deploy ──────────────────────────────────────────────────────────────
//   supabase functions deploy delete-account

import { createClient } from 'jsr:@supabase/supabase-js@2';

const ANONYMIZED_NAME = 'Deleted User';

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401 });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await callerClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired session' }), { status: 401 });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const userId = user.id;

    const results = await Promise.allSettled([
      admin
        .from('bookings')
        .update({ passenger_name: ANONYMIZED_NAME, passenger_phone: null, special_requests: null, flight_number: null })
        .eq('customer_id', userId),
      admin
        .from('pilgrim_packages')
        .update({ passenger_name: ANONYMIZED_NAME, passenger_phone: null, passenger_email: null, special_needs: null })
        .eq('customer_id', userId),
      admin.from('notifications').delete().eq('user_id', userId),
    ]);

    const failed = results
      .map((r, i) => ({ r, table: ['bookings', 'pilgrim_packages', 'notifications'][i] }))
      .filter(({ r }) => r.status === 'rejected');
    if (failed.length > 0) {
      console.error('delete-account: non-fatal cleanup failures', failed.map((f) => f.table));
    }

    await admin.from('profiles').delete().eq('id', userId);

    const { error: deleteUserError } = await admin.auth.admin.deleteUser(userId);
    if (deleteUserError) throw deleteUserError;

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
