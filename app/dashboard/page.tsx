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
      try {
        console.log("Dashboard: Running checkAuth");
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (!isMounted) return;

        console.log("Dashboard: getUser result:", {
          hasUser: !!user,
          error,
        });

        if (error) {
          console.error("Dashboard: getUser error", error);
          router.push("/");
          return;
        }

        if (!user) {
          console.log("Dashboard: No user found, redirecting to /");
          router.push("/");
          return;
        }

        console.log("Dashboard: User found, setting user and loading state.");
        setUser(user);
        setLoading(false);
      } catch (error) {
        console.error("Dashboard: Error in checkAuth:", error);
        router.push("/");
      }
    }

    checkAuth();

    console.log("Dashboard: Setting up onAuthStateChange listener");
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;

      console.log("Dashboard: onAuthStateChange triggered:", {
        event: _event,
        hasSession: !!session,
      });

      if (!session) {
        console.log(
          "Dashboard: onAuthStateChange - no session, redirecting to /"
        );
        router.push("/");
        return;
      }

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error || !user) {
        console.error("Dashboard: onAuthStateChange - getUser error:", error);
        router.push("/");
        return;
      }

      setUser(user);
      setLoading(false);
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
      <main className="flex-1 container py-6 px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-amber-900">Your Stories</h1>
          <CreateSessionButton />
        </div>
        <SessionList />
      </main>
    </div>
  );
}
