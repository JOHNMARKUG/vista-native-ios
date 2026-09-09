// OAuth client IDs are not secret — they're meant to ship inside the app
// binary (Google's own docs embed them directly in client code), unlike the
// Apple/Google client *secrets* used server-side, which must never appear here.
export const GOOGLE_IOS_CLIENT_ID =
  '444032839313-0lpvt3pcllv30nbvmeldgh8u3poadppf.apps.googleusercontent.com';
