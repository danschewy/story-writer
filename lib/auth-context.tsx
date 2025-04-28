"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
    avatar_url?: string;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    // Initial auth check
    async function checkAuth() {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (!mounted) return;

        if (error) {
          console.error("Auth check error:", error);
          setError("Authentication error");
          setLoading(false);
          return;
        }

        setUser(user);
        setLoading(false);
      } catch (err) {
        console.error("Unexpected auth error:", err);
        if (mounted) {
          setError("Unexpected error during authentication");
          setLoading(false);
        }
      }
    }

    checkAuth();

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === "SIGNED_IN") {
        setUser(session?.user ?? null);
        setError(null);
        setLoading(false);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setLoading(false);
      } else if (event === "USER_UPDATED") {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async () => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error("Sign in error:", error);
        setError("Failed to sign in");
        setLoading(false);
      }
      // Don't set loading to false here as we're redirecting
    } catch (err) {
      console.error("Unexpected sign in error:", err);
      setError("Unexpected error during sign in");
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Sign out error:", error);
        setError("Failed to sign out");
        setLoading(false);
        return;
      }

      setUser(null);
      setLoading(false);
      router.push("/");
    } catch (err) {
      console.error("Unexpected sign out error:", err);
      setError("Unexpected error during sign out");
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
