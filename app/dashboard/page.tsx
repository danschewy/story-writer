"use client";

import { DashboardHeader } from "@/components/dashboard-header";
import { CreateSessionButton } from "@/components/create-session-button";
import { SessionList } from "@/components/session-list";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      console.log("Dashboard: Running checkAuth");
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      console.log("Dashboard: getSession result:", {
        hasSession: !!session,
        error,
      });

      if (error) {
        console.error("Dashboard: getSession error", error);
        router.push("/");
        return;
      }

      if (!session) {
        console.log("Dashboard: No session found, redirecting to /");
        router.push("/");
        return;
      }

      console.log("Dashboard: Session found, setting user and loading state.");
      setUser(session.user);
      setLoading(false);
    }

    checkAuth();

    console.log("Dashboard: Setting up onAuthStateChange listener");
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;

      console.log("Dashboard: onAuthStateChange triggered:", {
        event: _event,
        hasSession: !!session,
      });
      setUser(session?.user ?? null);

      if (!session) {
        console.log(
          "Dashboard: onAuthStateChange - no session, redirecting to /"
        );
        router.push("/");
      }
    });

    return () => {
      console.log("Dashboard: Unsubscribing from onAuthStateChange");
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <DashboardHeader />
        <main className="flex-1 container py-6">
          <div className="flex items-center justify-center h-[50vh]">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 container py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Your Story Sessions</h1>
          <CreateSessionButton />
        </div>
        <SessionList />
      </main>
    </div>
  );
}
