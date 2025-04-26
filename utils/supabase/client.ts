import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "supabase.auth.token",
        storage: {
          getItem: (key) => {
            if (typeof window === "undefined") return null;
            return window.localStorage.getItem(key);
          },
          setItem: (key, value) => {
            if (typeof window === "undefined") return;
            window.localStorage.setItem(key, value);
          },
          removeItem: (key) => {
            if (typeof window === "undefined") return;
            window.localStorage.removeItem(key);
          },
        },
      },
    }
  );
}
