"use client";

import { BookOpen } from "lucide-react";
import { LoginButton } from "@/components/login-button";
import { UserNav } from "@/components/user-nav";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function DashboardHeader() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="border-b bg-gradient-to-r from-amber-50 to-orange-50">
      <div className="container flex h-16 items-center justify-between px-8">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-amber-700" />
          <span className="text-xl font-bold text-amber-900">StoryHearth</span>
        </div>
        {user ? <UserNav user={user} /> : <LoginButton />}
      </div>
    </header>
  );
}
