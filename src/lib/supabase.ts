import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import { createClient, type SupabaseClientOptions } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY — check your .env file.'
  );
}

/**
 * expo-secure-store backed storage adapter so the session token never
 * touches AsyncStorage in plaintext. SecureStore keys must be <= 2048 bytes
 * and alphanumeric/._- , which Supabase's own keys already satisfy.
 */
const SecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

const options: SupabaseClientOptions<'public'> = {
  auth: {
    storage: SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
};

// Not parameterized with generated Database types yet — regenerate with
// `npx supabase gen types typescript --project-id quovxkwaexjucjaunned`
// and pass it as createClient<Database>(...) once available.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, options);
