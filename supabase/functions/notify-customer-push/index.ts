// Supabase Edge Function: notify-customer-push
//
// Sends a push notification to a customer's device via Expo's push API
// whenever one of their bookings changes status. The native app
// (src/hooks/usePushNotifications.ts) already saves each signed-in
// customer's Expo push token to profiles.fcm_token — this is the other
// half: the thing that actually triggers a send.
//
// ── Deploy ──────────────────────────────────────────────────────────────
//   supabase functions deploy notify-customer-push
//
// ── Wire it up (Supabase Dashboard) ─────────────────────────────────────
//   Database → Webhooks → Create a new webhook for EACH of:
//     - bookings        (Airport Transfer + Pilgrimage-style rows)
//     - vista_rides
//     - pilgrim_packages
//   Event: UPDATE (INSERT too, if you also want a push the moment a
//   booking is received rather than only on status changes).
//   HTTP Request → this function's URL, method POST.
//
// No manual env var setup needed — SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY are automatically available to every Edge
// Function at runtime.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const STATUS_MESSAGES: Record<string, { title: string; body: (ref: string) => string }> = {
  pending: { title: 'Booking received', body: (ref) => `We've got your booking ${ref} — confirming details shortly.` },
  scheduled: { title: 'Ride scheduled', body: (ref) => `Your trip ${ref} is scheduled. We'll notify you as it approaches.` },
  searching: { title: 'Finding your driver', body: (ref) => `Matching ${ref} with a nearby driver now.` },
  confirmed: { title: 'Booking confirmed', body: (ref) => `${ref} is confirmed. Your driver will be assigned soon.` },
  driver_assigned: { title: 'Driver assigned', body: (ref) => `A driver has been assigned to ${ref}.` },
  en_route: { title: 'Driver on the way', body: (ref) => `Your driver for ${ref} is on the way.` },
  driver_arrived: { title: 'Your driver has arrived', body: (ref) => `Your driver for ${ref} is waiting for you.` },
  arrived: { title: 'Your driver has arrived', body: (ref) => `Your driver for ${ref} is waiting for you.` },
  in_progress: { title: 'Trip started', body: (ref) => `Your trip ${ref} is now in progress.` },
  completed: { title: 'Trip completed', body: (ref) => `${ref} is complete. Thanks for riding with VISTA!` },
  cancelled: { title: 'Booking cancelled', body: (ref) => `${ref} has been cancelled.` },
};

type WebhookPayload = {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: Record<string, unknown>;
  old_record: Record<string, unknown> | null;
};

Deno.serve(async (req) => {
  try {
    const payload: WebhookPayload = await req.json();
    const { record, old_record } = payload;

    const newStatus = record.status as string | undefined;
    const oldStatus = old_record?.status as string | undefined;
    // Skip no-op webhooks (an UPDATE on an unrelated column) — only push on
    // an actual status transition, or a brand-new row (old_record is null).
    if (!newStatus || (old_record && newStatus === oldStatus)) {
      return new Response(JSON.stringify({ skipped: true }), { status: 200 });
    }

    const customerId = record.customer_id as string | undefined;
    const bookingRef = (record.booking_ref as string | undefined) ?? '';
    if (!customerId) {
      return new Response(JSON.stringify({ skipped: true, reason: 'no customer_id' }), { status: 200 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: profile } = await supabase
      .from('profiles')
      .select('fcm_token')
      .eq('id', customerId)
      .maybeSingle();

    const token = profile?.fcm_token as string | undefined;
    if (!token || !token.startsWith('ExponentPushToken')) {
      return new Response(JSON.stringify({ skipped: true, reason: 'no push token' }), { status: 200 });
    }

    const message = STATUS_MESSAGES[newStatus];
    if (!message) {
      return new Response(JSON.stringify({ skipped: true, reason: 'unmapped status' }), { status: 200 });
    }

    const source = payload.table === 'vista_rides' ? 'ride' : 'booking';

    const expoRes = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        to: token,
        title: message.title,
        body: message.body(bookingRef),
        data: { source, id: record.id },
        sound: 'default',
      }),
    });

    return new Response(JSON.stringify({ sent: true, expo: await expoRes.json() }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
