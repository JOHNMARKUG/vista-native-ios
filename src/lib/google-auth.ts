// OAuth client IDs are not secret — they're meant to ship inside the app
// binary (Google's own docs embed them directly in client code), unlike the
// Apple/Google client *secrets* used server-side, which must never appear here.
//
// The previous value here (444032839313-...) didn't belong to VISTA's own
// Google Cloud project at all — it wasn't visible under any OAuth client in
// the actual "vista-transport-eaf40" project, meaning nobody could ever
// have configured its redirect URIs or bundle ID correctly. That's the
// real reason Google sign-in kept failing with "doesn't comply with
// Google's OAuth 2.0 policy" regardless of what the app's redirect URI was
// changed to. This is a real iOS client registered under bundle ID
// ug.vista.transport in VISTA's own project.
export const GOOGLE_IOS_CLIENT_ID =
  '1075873555121-ir5f76lmr994qscta9tg9ckuqu65v22a.apps.googleusercontent.com';
