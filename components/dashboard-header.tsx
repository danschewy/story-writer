"use client";

import { BookOpen } from "lucide-react";
import { LoginButton } from "@/components/login-button";
import { UserNav } from "@/components/user-nav";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export function DashboardHeader() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (!isMounted) return;

        if (error) {
          console.error("Auth error:", error);
          setUser(null);
        } else {
          setUser(user);
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error checking auth:", error);
        setUser(null);
        setIsLoading(false);
      }
    }

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;

      if (session) {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (error) {
          console.error("Auth error:", error);
          setUser(null);
        } else {
          setUser(user);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <header className="border-b bg-gradient-to-r from-amber-50 to-orange-50">
      <div className="container flex h-16 items-center justify-between px-8">
        <Link
          href="/"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <BookOpen className="h-6 w-6 text-amber-700" />
          <span className="text-xl font-bold text-amber-900">StoryHearth</span>
        </Link>
        {isLoading ? (
          <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
        ) : user ? (
          <UserNav user={user} />
        ) : (
          <LoginButton />
        )}
      </div>
    </header>
  );
}
