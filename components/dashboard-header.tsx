"use client";

import { BookOpen } from "lucide-react";
import { LoginButton } from "@/components/login-button";
import { UserNav } from "@/components/user-nav";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export function DashboardHeader() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check active session
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error) {
        console.error("Auth error:", error);
        return;
      }
      setUser(user);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (error) {
          console.error("Auth error:", error);
          return;
        }
        setUser(user);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
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
        {user ? <UserNav user={user} /> : <LoginButton />}
      </div>
    </header>
  );
}
